import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request)
    if (!tokenUser) return unauthorizedResponse()
    if (!requireRole(tokenUser, ['superadmin', 'classadmin'])) return forbiddenResponse()

    const activeCode = await prisma.teacherRegCode.findFirst({
      where: { creatorId: tokenUser.userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const allCodes = await prisma.teacherRegCode.findMany({
      where: { creatorId: tokenUser.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return successResponse({
      active: activeCode ? {
        id: activeCode.id,
        code: activeCode.code,
        isActive: activeCode.isActive,
        createdAt: activeCode.createdAt.toISOString(),
      } : null,
      history: allCodes.map(c => ({
        id: c.id,
        code: c.code,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Get my teacher code error:', error)
    return errorResponse('获取失败', 500)
  }
}
