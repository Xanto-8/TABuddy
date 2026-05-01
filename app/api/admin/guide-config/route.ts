import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse, getBody } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理系统配置')

  try {
    const [adminGuideConfig, assistantGuideConfig, surveyUrlConfig, pushEnabledConfig, onceOnlyConfig] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: 'adminGuideUrl' } }),
      prisma.systemConfig.findUnique({ where: { key: 'assistantGuideUrl' } }),
      prisma.systemConfig.findUnique({ where: { key: 'globalSurveyUrl' } }),
      prisma.systemConfig.findUnique({ where: { key: 'surveyPushEnabled' } }),
      prisma.systemConfig.findUnique({ where: { key: 'surveyOnceOnly' } }),
    ])

    return successResponse({
      adminGuideUrl: adminGuideConfig?.value || '',
      assistantGuideUrl: assistantGuideConfig?.value || '',
      globalSurveyUrl: surveyUrlConfig?.value || '',
      surveyPushEnabled: pushEnabledConfig?.value || 'false',
      surveyOnceOnly: onceOnlyConfig?.value || 'false',
    })
  } catch (error) {
    console.error('[admin/guide-config] GET error:', error)
    return errorResponse('获取配置失败', 500)
  }
}

export async function PUT(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可修改系统配置')

  try {
    const body = await getBody<{
      adminGuideUrl?: string
      assistantGuideUrl?: string
      globalSurveyUrl?: string
      surveyPushEnabled?: string
      surveyOnceOnly?: string
    }>(request)
    if (!body) {
      return errorResponse('请求参数无效')
    }

    const configEntries: { key: string; value: string }[] = []

    if (body.adminGuideUrl !== undefined) {
      configEntries.push({ key: 'adminGuideUrl', value: body.adminGuideUrl })
    }
    if (body.assistantGuideUrl !== undefined) {
      configEntries.push({ key: 'assistantGuideUrl', value: body.assistantGuideUrl })
    }
    if (body.globalSurveyUrl !== undefined) {
      configEntries.push({ key: 'globalSurveyUrl', value: body.globalSurveyUrl })
    }
    if (body.surveyPushEnabled !== undefined) {
      configEntries.push({ key: 'surveyPushEnabled', value: body.surveyPushEnabled })
    }
    if (body.surveyOnceOnly !== undefined) {
      configEntries.push({ key: 'surveyOnceOnly', value: body.surveyOnceOnly })
    }

    await Promise.all(
      configEntries.map(entry =>
        prisma.systemConfig.upsert({
          where: { key: entry.key },
          update: { value: entry.value },
          create: { key: entry.key, value: entry.value },
        })
      )
    )

    return successResponse({ message: '配置更新成功' })
  } catch (error) {
    console.error('[admin/guide-config] PUT error:', error)
    return errorResponse('更新配置失败', 500)
  }
}
