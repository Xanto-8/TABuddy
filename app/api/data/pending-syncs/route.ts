import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user || user.role === 'student') {
      return errorResponse('权限不足', 403)
    }

    const whereClause = user.role === 'superadmin'
      ? { status: 'pending' as const }
      : { teacherId: userId, status: 'pending' as const }

    const pendingRequests = await prisma.pendingClassSync.findMany({
      where: whereClause,
      include: {
        assistant: {
          select: { id: true, displayName: true, username: true },
        },
        teacher: {
          select: { id: true, displayName: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = pendingRequests.map(r => ({
      id: r.id,
      className: r.className,
      classType: r.classType,
      color: r.color,
      assistantId: r.assistantId,
      assistantName: r.assistant.displayName || r.assistant.username,
      teacherName: r.teacher.displayName || r.teacher.username,
      status: r.status,
      createdAt: r.createdAt,
    }))

    return successResponse(result)
  } catch (error) {
    console.error('Pending syncs GET error:', error)
    return errorResponse('获取待审批列表失败', 500)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      requestId: string
      action: 'approve' | 'reject'
    }>(request)

    if (!body || !body.requestId || !body.action) {
      return errorResponse('缺少必要参数', 400)
    }

    const pendingRequest = await prisma.pendingClassSync.findUnique({
      where: { id: body.requestId },
    })

    if (!pendingRequest) {
      return errorResponse('请求不存在', 404)
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (pendingRequest.teacherId !== userId && currentUser?.role !== 'superadmin') {
      return errorResponse('无权操作该请求', 403)
    }

    if (pendingRequest.status !== 'pending') {
      return errorResponse('该请求已被处理', 400)
    }

    if (body.action === 'approve') {
      await prisma.$transaction([
        prisma.class.create({
          data: {
            name: pendingRequest.className,
            type: pendingRequest.classType,
            color: pendingRequest.color,
            userId: pendingRequest.teacherId,
            createdBy: '',
          },
        }),
        prisma.pendingClassSync.update({
          where: { id: body.requestId },
          data: { status: 'approved' },
        }),
      ])

      return successResponse({
        message: `班级「${pendingRequest.className}」已同步到班级管理`,
        className: pendingRequest.className,
      })
    } else {
      await prisma.pendingClassSync.update({
        where: { id: body.requestId },
        data: { status: 'rejected' },
      })

      return successResponse({
        message: `已拒绝班级「${pendingRequest.className}」的同步请求`,
        className: pendingRequest.className,
      })
    }
  } catch (error) {
    console.error('Pending syncs PATCH error:', error)
    return errorResponse('处理同步请求失败', 500)
  }
}
