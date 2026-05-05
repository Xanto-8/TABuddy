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

    const record = await prisma.quizRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!record) return errorResponse('Not found', 404)
    return successResponse(record)
  } catch (error) {
    console.error('QuizRecord GET error:', error)
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

    const existing = await prisma.quizRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{
      studentName?: string; courseName?: string; score?: string
      date?: string; type?: string; notes?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const record = await prisma.quizRecord.update({
      where: { id: params.id },
      data: {
        ...(body.studentName !== undefined && { studentName: body.studentName }),
        ...(body.courseName !== undefined && { courseName: body.courseName }),
        ...(body.score !== undefined && { score: body.score }),
        ...(body.date !== undefined && { date: body.date }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })
    return successResponse(record)
  } catch (error) {
    console.error('QuizRecord PUT error:', error)
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

    const existing = await prisma.quizRecord.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.quizRecord.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('QuizRecord DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
