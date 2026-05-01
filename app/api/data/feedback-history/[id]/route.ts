import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const entry = await prisma.feedbackHistoryEntry.findFirst({
      where: { id: params.id, userId },
    })
    if (!entry) return errorResponse('Not found', 404)
    return successResponse(entry)
  } catch (error) {
    console.error('FeedbackHistoryEntry GET error:', error)
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

    const existing = await prisma.feedbackHistoryEntry.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.feedbackHistoryEntry.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('FeedbackHistoryEntry DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
