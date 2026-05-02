import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'campusadmin') {
      return errorResponse('Only campus head teachers can view bound admins', 403)
    }

    const binds = await prisma.campusAdminBind.findMany({
      where: { campusAdminId: userId, status: 'active' },
      include: {
        classAdmin: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
      orderBy: { bindedAt: 'desc' },
    })

    return successResponse(binds)
  } catch (error) {
    console.error('Get bound admins error:', error)
    return errorResponse('Failed to get bound admins', 500)
  }
}
