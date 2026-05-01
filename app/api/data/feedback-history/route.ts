import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const entries = await prisma.feedbackHistoryEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(entries)
  } catch (error) {
    console.error('FeedbackHistory GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ content: string; date?: string }>(request)
    if (!body || !body.content) return errorResponse('content is required', 400)

    const entry = await prisma.feedbackHistoryEntry.create({
      data: { content: body.content, date: body.date ?? '', userId },
    })
    return successResponse(entry, 201)
  } catch (error) {
    console.error('FeedbackHistory POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
