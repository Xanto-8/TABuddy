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
    const existing = await prisma.classSchedule.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Class schedule not found', 404)

    const body = await getBody<{
      classId?: string; dayOfWeek?: number; startTime?: string
      endTime?: string; room?: string; location?: string
    }>(request)
    if (!body) return errorResponse('Request body is required', 400)

    const schedule = await prisma.classSchedule.update({
      where: { id },
      data: {
        ...(body.classId !== undefined && { classId: body.classId }),
        ...(body.dayOfWeek !== undefined && { dayOfWeek: body.dayOfWeek }),
        ...(body.startTime !== undefined && { startTime: body.startTime }),
        ...(body.endTime !== undefined && { endTime: body.endTime }),
        ...(body.room !== undefined && { room: body.room }),
        ...(body.location !== undefined && { location: body.location }),
      },
    })

    return successResponse(schedule)
  } catch (error) {
    console.error('ClassSchedule PUT error:', error)
    return errorResponse('Failed to update class schedule', 500)
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
    const existing = await prisma.classSchedule.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Class schedule not found', 404)

    await prisma.classSchedule.delete({ where: { id } })
    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error('ClassSchedule DELETE error:', error)
    return errorResponse('Failed to delete class schedule', 500)
  }
}
