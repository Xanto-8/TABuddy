import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      select: { id: true, role: true, hasReadGuide: true },
    })

    if (!user) {
      return errorResponse('用户不存在', 404)
    }

    const adminGuideConfig = await prisma.systemConfig.findUnique({
      where: { key: 'adminGuideUrl' },
    })
    const assistantGuideConfig = await prisma.systemConfig.findUnique({
      where: { key: 'assistantGuideUrl' },
    })

    let guideUrl = ''
    if (user.role === 'classadmin' || user.role === 'superadmin') {
      guideUrl = adminGuideConfig?.value || ''
    } else if (user.role === 'assistant') {
      guideUrl = assistantGuideConfig?.value || ''
    }

    const defaultAdminGuide = 'https://www.yuque.com/xanto-xqkmi/qze364/xf884bnend48ehf5?singleDoc#'
    const defaultAssistantGuide = 'https://www.yuque.com/xanto-xqkmi/qze364/xf884bnend48ehf5?singleDoc#'

    if (!guideUrl) {
      guideUrl = user.role === 'assistant' ? defaultAssistantGuide : defaultAdminGuide
    }

    return successResponse({
      hasReadGuide: user.hasReadGuide,
      role: user.role,
      guideUrl,
    })
  } catch (error) {
    console.error('[guide/check] error:', error)
    return errorResponse('获取引导信息失败', 500)
  }
}
