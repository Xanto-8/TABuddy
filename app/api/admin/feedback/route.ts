import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可查看反馈')

  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')

    const where = statusFilter && ['pending', 'resolved', 'closed'].includes(statusFilter)
      ? { status: statusFilter }
      : {}

    const feedbacks = await prisma.userFeedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true,
          },
        },
      },
    })

    return Response.json({ data: feedbacks })
  } catch (error) {
    console.error('[admin/feedback] GET error:', error)
    return Response.json({ error: '获取反馈列表失败' }, { status: 500 })
  }
}
