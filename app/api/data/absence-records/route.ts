import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    const where: Record<string, unknown> = { userId }
    if (classId) where.className = classId
    if (date) where.date = date

    const records = await prisma.absenceRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(records)
  } catch (error) {
    console.error('AbsenceRecords GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      studentName: string; className?: string; date: string
      type?: string; reason?: string; notes?: string
    }>(request)
    if (!body || !body.studentName || !body.date) {
      return errorResponse('studentName and date are required', 400)
    }

    const record = await prisma.absenceRecord.create({
      data: {
        studentName: body.studentName, className: body.className ?? '',
        date: body.date, type: body.type ?? 'absent',
        reason: body.reason ?? '', notes: body.notes ?? '', userId,
      },
    })
    return successResponse(record, 201)
  } catch (error) {
    console.error('AbsenceRecords POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
