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
    const existing = await prisma.courseTask.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Course task not found', 404)

    const body = await getBody<{
      title?: string; completed?: boolean; dueDate?: string
      priority?: string; classId?: string | null
    }>(request)
    if (!body) return errorResponse('Request body is required', 400)

    const task = await prisma.courseTask.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.classId !== undefined && { classId: body.classId }),
      },
    })

    return successResponse(task)
  } catch (error) {
    console.error('CourseTask PUT error:', error)
    return errorResponse('Failed to update course task', 500)
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
    const existing = await prisma.courseTask.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Course task not found', 404)

    await prisma.courseTask.delete({ where: { id } })
    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error('CourseTask DELETE error:', error)
    return errorResponse('Failed to delete course task', 500)
  }
}
