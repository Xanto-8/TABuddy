import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-data-utils'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { id: true, hasFillSurvey: true },
    })

    if (!user) {
      return errorResponse('用户不存在', 404)
    }

    if (user.hasFillSurvey) {
      return successResponse({ message: '已标记为已填写' })
    }

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { hasFillSurvey: true },
    })

    return successResponse({ message: '标记已填写成功' })
  } catch (error) {
    console.error('[survey/submit] error:', error)
    return errorResponse('操作失败', 500)
  }
}
