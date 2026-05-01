import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { successResponse, errorResponse, getBody } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理系统配置')

  try {
    const adminGuideConfig = await prisma.systemConfig.findUnique({
      where: { key: 'adminGuideUrl' },
    })
    const assistantGuideConfig = await prisma.systemConfig.findUnique({
      where: { key: 'assistantGuideUrl' },
    })

    return successResponse({
      adminGuideUrl: adminGuideConfig?.value || '',
      assistantGuideUrl: assistantGuideConfig?.value || '',
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
    const body = await getBody<{ adminGuideUrl?: string; assistantGuideUrl?: string }>(request)
    if (!body) {
      return errorResponse('请求参数无效')
    }

    if (body.adminGuideUrl !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: 'adminGuideUrl' },
        update: { value: body.adminGuideUrl },
        create: { key: 'adminGuideUrl', value: body.adminGuideUrl },
      })
    }

    if (body.assistantGuideUrl !== undefined) {
      await prisma.systemConfig.upsert({
        where: { key: 'assistantGuideUrl' },
        update: { value: body.assistantGuideUrl },
        create: { key: 'assistantGuideUrl', value: body.assistantGuideUrl },
      })
    }

    return successResponse({ message: '配置更新成功' })
  } catch (error) {
    console.error('[admin/guide-config] PUT error:', error)
    return errorResponse('更新配置失败', 500)
  }
}
