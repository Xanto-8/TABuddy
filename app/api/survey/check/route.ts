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
      select: { id: true, hasReadGuide: true, hasFillSurvey: true },
    })

    if (!user) {
      return errorResponse('用户不存在', 404)
    }

    const surveyUrlConfig = await prisma.systemConfig.findUnique({
      where: { key: 'globalSurveyUrl' },
    })
    const pushEnabledConfig = await prisma.systemConfig.findUnique({
      where: { key: 'surveyPushEnabled' },
    })
    const onceOnlyConfig = await prisma.systemConfig.findUnique({
      where: { key: 'surveyOnceOnly' },
    })

    const surveyUrl = surveyUrlConfig?.value || ''
    const pushEnabled = pushEnabledConfig?.value === 'true'
    const onceOnly = onceOnlyConfig?.value === 'true'

    let shouldShow = false

    if (user.hasReadGuide && pushEnabled && surveyUrl) {
      if (onceOnly) {
        shouldShow = !user.hasFillSurvey
      } else {
        shouldShow = true
      }
    }

    return successResponse({
      shouldShow,
      surveyUrl: shouldShow ? surveyUrl : '',
      hasFillSurvey: user.hasFillSurvey,
    })
  } catch (error) {
    console.error('[survey/check] error:', error)
    return errorResponse('获取问卷信息失败', 500)
  }
}
