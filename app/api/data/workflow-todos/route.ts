import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const todos = await prisma.workflowTodo.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(todos)
  } catch (error) {
    console.error('workflow-todos GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)
    const body = await getBody<{
      title: string; completed?: boolean; dueDate?: string; priority?: string; notes?: string
    }>(request)
    if (!body || !body.title) return errorResponse('Title is required', 400)

    const todo = await prisma.workflowTodo.create({
      data: {
        title: body.title, completed: body.completed || false,
        dueDate: body.dueDate || '', priority: body.priority || 'medium',
        notes: body.notes || '', userId,
      },
    })
    return successResponse(todo, 201)
  } catch (error) {
    console.error('workflow-todos POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
