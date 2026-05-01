import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse, getBody } from '@/lib/api-data-utils'

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

    return successResponse({ id: feedback.id, message: '反馈提交成功' })
  } catch (error) {
    console.error('[feedback/submit] error:', error)
    return errorResponse('提交失败，请稍后重试', 500)
  }
}
