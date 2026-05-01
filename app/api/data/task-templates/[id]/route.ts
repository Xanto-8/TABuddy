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
    const existing = await prisma.taskTemplate.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Task template not found', 404)

    const body = await getBody<{ title?: string; type?: string; classId?: string | null }>(request)
    if (!body) return errorResponse('Request body is required', 400)

    const template = await prisma.taskTemplate.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.classId !== undefined && { classId: body.classId }),
      },
    })

    return successResponse(template)
  } catch (error) {
    console.error('TaskTemplate PUT error:', error)
    return errorResponse('Failed to update task template', 500)
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
    const existing = await prisma.taskTemplate.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Task template not found', 404)

    await prisma.taskTemplate.delete({ where: { id } })
    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error('TaskTemplate DELETE error:', error)
    return errorResponse('Failed to delete task template', 500)
  }
}
