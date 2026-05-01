import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const where: Record<string, unknown> = { userId }
    if (classId) where.classId = classId

    const records = await prisma.quizRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(records)
  } catch (error) {
    console.error('QuizRecords GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      studentName: string; courseName?: string; score?: string
      date?: string; type?: string; notes?: string
    }>(request)
    if (!body || !body.studentName) return errorResponse('studentName is required', 400)

    const record = await prisma.quizRecord.create({
      data: {
        studentName: body.studentName, courseName: body.courseName ?? '',
        score: body.score ?? '', date: body.date ?? '',
        type: body.type ?? '', notes: body.notes ?? '', userId,
      },
    })
    return successResponse(record, 201)
  } catch (error) {
    console.error('QuizRecords POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
