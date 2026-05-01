import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('Only class admins can view bound assistants', 403)
    }

    const binds = await prisma.teacherAssistantBind.findMany({
      where: { teacherId: userId, assistantId: { not: null }, status: 'active' },
      include: {
        assistant: {
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
    console.error('Get bound assistants error:', error)
    return errorResponse('Failed to get bound assistants', 500)
  }
}
