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

    const creatorName = user.displayName || user.id.slice(0, 8)
    const createdRequests: Array<{ id: string; teacherId: string }> = []

    for (const bind of binds) {
      const existing = await prisma.pendingClassSync.findFirst({
        where: {
          assistantId: userId,
          teacherId: bind.teacher.id,
          className: body.name,
          status: 'pending',
        },
      })

      if (existing) continue

      const request = await prisma.pendingClassSync.create({
        data: {
          className: body.name,
          classType: body.type ?? '',
          color: body.color ?? '',
          assistantId: userId,
          teacherId: bind.teacher.id,
          status: 'pending',
        },
      })
      createdRequests.push({ id: request.id, teacherId: bind.teacher.id })

      const notificationData = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: 'sync_request',
        title: '班级同步请求',
        message: `助教 ${creatorName} 请求将班级「${body.name}」同步到您的班级管理`,
        createdAt: new Date().toISOString(),
        read: false,
        dismissed: false,
        completed: false,
        link: '/classes',
        requestId: request.id,
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
      syncedTo: createdRequests.length,
      teachers: binds.map(b => ({ id: b.teacher.id, displayName: b.teacher.displayName })),
      message: `已发送同步请求给 ${createdRequests.length} 位老师，等待对方审批`,
    }, 201)
  } catch (error) {
    console.error('Classes sync error:', error)
    return errorResponse('Failed to sync class to teachers', 500)
  }
}
