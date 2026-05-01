import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const records = await prisma.feedbackRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(records)
  } catch (error) {
    console.error('FeedbackRecords GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      studentName: string; courseName?: string; content: string
      date?: string; type?: string
    }>(request)
    if (!body || !body.studentName || !body.content) {
      return errorResponse('studentName and content are required', 400)
    }

    const record = await prisma.feedbackRecord.create({
      data: {
        studentName: body.studentName, courseName: body.courseName ?? '',
        content: body.content, date: body.date ?? '',
        type: body.type ?? '', userId,
      },
    })
    return successResponse(record, 201)
  } catch (error) {
    console.error('FeedbackRecords POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
