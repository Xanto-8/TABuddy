import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, requireRole, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenUser = getTokenUser(request)
    if (!tokenUser) return unauthorizedResponse()
    if (!requireRole(tokenUser, ['superadmin'])) return forbiddenResponse()

    const code = await prisma.teacherRegCode.findUnique({
      where: { id: params.id },
    })

    if (!code) {
      return errorResponse('注册码不存在', 404)
    }

    const updated = await prisma.teacherRegCode.update({
      where: { id: params.id },
      data: { isActive: !code.isActive },
    })

    return successResponse({
      id: updated.id,
      code: updated.code,
      isActive: updated.isActive,
    })
  } catch (error) {
    console.error('Toggle teacher code error:', error)
    return errorResponse('操作失败', 500)
  }
}
