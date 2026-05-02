import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    })

    return successResponse({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('notifications read-all error:', error)
    return errorResponse('Internal server error', 500)
  }
}
