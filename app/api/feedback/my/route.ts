import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const feedbacks = await prisma.userFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        description: true,
        screenshot: true,
        status: true,
        reply: true,
        repliedAt: true,
        createdAt: true,
      },
    })

    return successResponse(feedbacks)
  } catch (error) {
    console.error('[feedback/my] error:', error)
    return errorResponse('Internal server error', 500)
  }
}
