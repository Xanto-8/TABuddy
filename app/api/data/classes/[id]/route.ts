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

    const { id } = params
    const classItem = await prisma.class.findFirst({
      where: { id, userId },
      include: { schedules: true },
    })

    if (!classItem) return errorResponse('Class not found', 404)
    return successResponse(classItem)
  } catch (error) {
    console.error('Class GET error:', error)
    return errorResponse('Failed to fetch class', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { id } = params
    const existing = await prisma.class.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Class not found', 404)

    const body = await getBody<{
      name?: string; type?: string; studentCount?: number; color?: string
      courseTasks?: string; taskTemplates?: string; scores?: string
      latestScore?: string; accuracyTrend?: string; scheduleIds?: string
      studentIds?: string; isArchived?: boolean
    }>(request)
    if (!body) return errorResponse('Request body is required', 400)

    const classItem = await prisma.class.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.studentCount !== undefined && { studentCount: body.studentCount }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.courseTasks !== undefined && { courseTasks: body.courseTasks }),
        ...(body.taskTemplates !== undefined && { taskTemplates: body.taskTemplates }),
        ...(body.scores !== undefined && { scores: body.scores }),
        ...(body.latestScore !== undefined && { latestScore: body.latestScore }),
        ...(body.accuracyTrend !== undefined && { accuracyTrend: body.accuracyTrend }),
        ...(body.scheduleIds !== undefined && { scheduleIds: body.scheduleIds }),
        ...(body.studentIds !== undefined && { studentIds: body.studentIds }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
      },
      include: { schedules: true },
    })

    return successResponse(classItem)
  } catch (error) {
    console.error('Class PUT error:', error)
    return errorResponse('Failed to update class', 500)
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
    const existing = await prisma.class.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Class not found', 404)

    await prisma.class.delete({ where: { id } })
    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error('Class DELETE error:', error)
    return errorResponse('Failed to delete class', 500)
  }
}
