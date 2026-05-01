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

    const assessments = await prisma.homeworkAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(assessments)
  } catch (error) {
    console.error('HomeworkAssessments GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      studentName: string; courseName?: string; score?: string
      date?: string; notes?: string
    }>(request)
    if (!body || !body.studentName) return errorResponse('studentName is required', 400)

    const assessment = await prisma.homeworkAssessment.create({
      data: {
        studentName: body.studentName, courseName: body.courseName ?? '',
        score: body.score ?? '', date: body.date ?? '', notes: body.notes ?? '', userId,
      },
    })
    return successResponse(assessment, 201)
  } catch (error) {
    console.error('HomeworkAssessments POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
