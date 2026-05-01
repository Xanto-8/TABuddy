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

    const schedules = await prisma.classSchedule.findMany({
      where,
      include: { class: { select: { id: true, name: true, color: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return successResponse(schedules)
  } catch (error) {
    console.error('ClassSchedules GET error:', error)
    return errorResponse('Failed to fetch class schedules', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      classId: string; dayOfWeek: number; startTime: string; endTime: string
      room?: string; location?: string
    }>(request)

    if (!body) return errorResponse('Request body is required', 400)
    if (!body.classId) return errorResponse('classId is required', 400)
    if (body.dayOfWeek === undefined || body.dayOfWeek < 0 || body.dayOfWeek > 6) {
      return errorResponse('dayOfWeek is required and must be between 0 and 6', 400)
    }
    if (!body.startTime) return errorResponse('startTime is required', 400)
    if (!body.endTime) return errorResponse('endTime is required', 400)

    const classItem = await prisma.class.findFirst({ where: { id: body.classId, userId } })
    if (!classItem) return errorResponse('Class not found', 404)

    const schedule = await prisma.classSchedule.create({
      data: {
        classId: body.classId, dayOfWeek: body.dayOfWeek,
        startTime: body.startTime, endTime: body.endTime,
        room: body.room ?? '', location: body.location ?? '', userId,
      },
      include: { class: { select: { id: true, name: true, color: true } } },
    })

    return successResponse(schedule, 201)
  } catch (error) {
    console.error('ClassSchedules POST error:', error)
    return errorResponse('Failed to create class schedule', 500)
  }
}
