import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      classId: string
      name: string
      type?: string
      color?: string
      isArchived?: boolean
    }>(request)

    if (!body || !body.name) {
      return errorResponse('Name and classId are required', 400)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, displayName: true },
    })

    if (!user || user.role !== 'assistant') {
      return errorResponse('Only assistants can sync classes to teachers', 403)
    }

    const binds = await prisma.teacherAssistantBind.findMany({
      where: { assistantId: userId, status: 'active' },
      include: {
        teacher: { select: { id: true, displayName: true, username: true } },
      },
    })

    if (binds.length === 0) {
      return errorResponse('No bound teachers found', 400)
    }

    const createdClasses: Array<{ id: string; userId: string }> = []
    const creatorName = user.displayName || user.id.slice(0, 8)

    for (const bind of binds) {
      const teacherClass = await prisma.class.create({
        data: {
          name: body.name,
          type: body.type ?? '',
          color: body.color ?? '',
          isArchived: body.isArchived ?? false,
          createdBy: creatorName,
          userId: bind.teacher.id,
        },
      })
      createdClasses.push({ id: teacherClass.id, userId: bind.teacher.id })

      const notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        classId: teacherClass.id,
        className: body.name,
        type: 'workflow_node',
        title: '新班级同步通知',
        message: `助教 ${creatorName} 创建了新班级「${body.name}」并已同步到您的班级管理`,
        createdAt: new Date().toISOString(),
        read: false,
        dismissed: false,
        completed: false,
        link: '/classes',
      }

      try {
        const existingStore = await prisma.userStore.findUnique({
          where: { userId_key: { userId: bind.teacher.id, key: 'appStore' } },
        })

        let storeValue: Record<string, unknown> = {}
        if (existingStore) {
          try {
            storeValue = JSON.parse(existingStore.value)
          } catch {
            storeValue = {}
          }
        }

        if (!Array.isArray(storeValue.notifications)) {
          storeValue.notifications = []
        }
        ;(storeValue.notifications as unknown[]).unshift(notificationData)

        await prisma.userStore.upsert({
          where: { userId_key: { userId: bind.teacher.id, key: 'appStore' } },
          update: { value: JSON.stringify(storeValue) },
          create: { userId: bind.teacher.id, key: 'appStore', value: JSON.stringify(storeValue) },
        })
      } catch (error) {
        console.error(`Failed to add notification for teacher ${bind.teacher.id}:`, error)
      }
    }

    return successResponse({
      syncedTo: binds.length,
      teachers: binds.map(b => ({ id: b.teacher.id, displayName: b.teacher.displayName })),
      classIds: createdClasses.map(c => c.id),
    }, 201)
  } catch (error) {
    console.error('Classes sync error:', error)
    return errorResponse('Failed to sync class to teachers', 500)
  }
}
