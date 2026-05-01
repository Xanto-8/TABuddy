import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  try {
    const tokenUser = getTokenUser(request)
    if (!tokenUser) return unauthorizedResponse()
    if (!requireRole(tokenUser, ['superadmin'])) return forbiddenResponse()

    const codes = await prisma.teacherRegCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    })

    return successResponse({
      codes: codes.map(c => ({
        id: c.id,
        code: c.code,
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
        creator: c.creator,
      })),
    })
  } catch (error) {
    console.error('Admin get teacher codes error:', error)
    return errorResponse('获取失败', 500)
  }
}
