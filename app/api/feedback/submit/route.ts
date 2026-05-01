import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse, getBody } from '@/lib/api-data-utils'
import { emitNotification } from '@/lib/notification-event-bus'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const body = await getBody<{
    type: string
    description: string
    screenshot?: string
  }>(request)

  if (!body || !body.type || !body.description?.trim()) {
    return errorResponse('请填写问题类型和描述')
  }

  if (body.description.length > 1000) {
    return errorResponse('描述内容不能超过1000字')
  }

  const validTypes = ['bug', 'suggestion', 'other']
  if (!validTypes.includes(body.type)) {
    return errorResponse('无效的问题类型')
  }

  try {
    const feedback = await prisma.userFeedback.create({
      data: {
        type: body.type,
        description: body.description.trim(),
        screenshot: body.screenshot || '',
        userId: tokenUser.userId,
      },
    })

    const typeLabel = { bug: 'Bug 反馈', suggestion: '功能建议', other: '其他' }[body.type] || body.type
    const submitterName = tokenUser.username

    const superadmins = await prisma.user.findMany({
      where: { role: 'superadmin' },
      select: { id: true },
    })

    for (const admin of superadmins) {
      const notification = await prisma.notification.create({
        data: {
          title: '新的用户反馈',
          message: `${submitterName} 提交了 ${typeLabel}：${body.description.trim().substring(0, 100)}`,
          type: 'feedback',
          link: '/admin/feedback',
          userId: admin.id,
        },
      })
      emitNotification({
        type: 'new_notification',
        userId: admin.id,
        notification: {
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          link: notification.link,
          read: notification.read,
          createdAt: notification.createdAt.toISOString(),
        },
      })
    }

    return successResponse({ id: feedback.id, message: '反馈提交成功' })
  } catch (error) {
    console.error('[feedback/submit] error:', error)
    return errorResponse('提交失败，请稍后重试', 500)
  }
}
