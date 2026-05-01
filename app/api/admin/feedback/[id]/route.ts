import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse, getBody } from '@/lib/api-data-utils'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理反馈')

  const { id } = await params

  const body = await getBody<{
    status?: string
    reply?: string
  }>(request)

  if (!body) {
    return errorResponse('请求参数无效')
  }

  const validStatuses = ['pending', 'resolved', 'closed']
  if (body.status && !validStatuses.includes(body.status)) {
    return errorResponse('无效的状态值')
  }

  try {
    const existing = await prisma.userFeedback.findUnique({ where: { id } })
    if (!existing) {
      return errorResponse('反馈不存在', 404)
    }

    const updateData: Record<string, string | Date> = {}
    if (body.status) updateData.status = body.status
    if (body.reply !== undefined) {
      updateData.reply = body.reply
      updateData.repliedAt = new Date()
    }

    const updated = await prisma.userFeedback.update({
      where: { id },
      data: updateData,
    })

    if (body.reply !== undefined && body.reply.trim()) {
      await prisma.notification.create({
        data: {
          title: '反馈已回复',
          message: `管理员回复了您的反馈：${body.reply.trim().substring(0, 100)}`,
          type: 'feedback',
          link: '/help',
          userId: existing.userId,
        },
      })
    }

    return successResponse(updated)
  } catch (error) {
    console.error('[admin/feedback] PUT error:', error)
    return errorResponse('更新失败', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可删除反馈')

  const { id } = await params

  try {
    await prisma.userFeedback.delete({ where: { id } })
    return successResponse({ message: '已删除' })
  } catch (error) {
    console.error('[admin/feedback] DELETE error:', error)
    return errorResponse('删除失败', 500)
  }
}
