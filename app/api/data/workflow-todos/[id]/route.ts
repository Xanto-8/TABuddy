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
    const todo = await prisma.workflowTodo.findFirst({ where: { id: params.id, userId } })
    if (!todo) return errorResponse('Not found', 404)
    return successResponse(todo)
  } catch (error) {
    console.error('workflow-todos GET by id error:', error)
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
    const { id } = params
    const existing = await prisma.workflowTodo.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{
      title?: string; completed?: boolean; dueDate?: string; priority?: string; notes?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const todo = await prisma.workflowTodo.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })
    return successResponse(todo)
  } catch (error) {
    console.error('workflow-todos PUT error:', error)
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
    const { id } = params
    const existing = await prisma.workflowTodo.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.workflowTodo.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('workflow-todos DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
