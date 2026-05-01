import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(notifications)
  } catch (error) {
    console.error('notifications GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const body = await getBody<{ title: string; message: string; type?: string; read?: boolean }>(request)
    if (!body || !body.title || !body.message) return errorResponse('Title and message are required', 400)

    const notification = await prisma.notification.create({
      data: { title: body.title, message: body.message, type: body.type || 'info', read: body.read || false, userId },
    })
    return successResponse(notification, 201)
  } catch (error) {
    console.error('notifications POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
