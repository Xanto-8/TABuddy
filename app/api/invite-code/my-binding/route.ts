import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'assistant') {
      return errorResponse('Only assistants can view their binding', 403)
    }

    const bind = await prisma.teacherAssistantBind.findFirst({
      where: { assistantId: userId, status: 'active' },
      include: {
        teacher: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    })

    return successResponse(bind)
  } catch (error) {
    console.error('Get my binding error:', error)
    return errorResponse('Failed to get binding info', 500)
  }
}
