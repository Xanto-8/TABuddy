import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const { id } = params
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{ read?: boolean; title?: string; message?: string; type?: string }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const notification = await prisma.notification.update({
      where: { id },
      data: {
        ...(body.read !== undefined && { read: body.read }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.message !== undefined && { message: body.message }),
        ...(body.type !== undefined && { type: body.type }),
      },
    })
    return successResponse(notification)
  } catch (error) {
    console.error('notifications PUT error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const { id } = params
    const existing = await prisma.notification.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.notification.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('notifications DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
