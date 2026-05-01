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

    const record = await prisma.feedbackRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!record) return errorResponse('Not found', 404)
    return successResponse(record)
  } catch (error) {
    console.error('FeedbackRecord GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const existing = await prisma.feedbackRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{
      studentName?: string; courseName?: string; content?: string
      date?: string; type?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const record = await prisma.feedbackRecord.update({
      where: { id: params.id },
      data: {
        ...(body.studentName !== undefined && { studentName: body.studentName }),
        ...(body.courseName !== undefined && { courseName: body.courseName }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.date !== undefined && { date: body.date }),
        ...(body.type !== undefined && { type: body.type }),
      },
    })
    return successResponse(record)
  } catch (error) {
    console.error('FeedbackRecord PUT error:', error)
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

    const existing = await prisma.feedbackRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.feedbackRecord.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('FeedbackRecord DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
