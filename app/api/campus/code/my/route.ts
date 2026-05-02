import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('Only class admins can view campus codes', 403)
    }

    const source = await prisma.campusAdminBind.findFirst({
      where: { classAdminId: userId, campusAdminId: null, status: 'active' },
    })

    if (!source) {
      return successResponse(null)
    }

    if (source.expiresAt && new Date(source.expiresAt) < new Date()) {
      await prisma.campusAdminBind.update({
        where: { id: source.id },
        data: { status: 'unbinded' },
      })
      return successResponse(null)
    }

    return successResponse(source)
  } catch (error) {
    console.error('Get my campus code error:', error)
    return errorResponse('Failed to get campus code', 500)
  }
}
