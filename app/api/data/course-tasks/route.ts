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

    const tasks = await prisma.courseTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(tasks)
  } catch (error) {
    console.error('CourseTasks GET error:', error)
    return errorResponse('Failed to fetch course tasks', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      title: string; completed?: boolean; dueDate?: string
      priority?: string; classId?: string
    }>(request)

    if (!body || !body.title) return errorResponse('Title is required', 400)

    const task = await prisma.courseTask.create({
      data: {
        title: body.title, completed: body.completed ?? false,
        dueDate: body.dueDate ?? '', priority: body.priority ?? 'medium',
        classId: body.classId ?? null, userId,
      },
    })

    return successResponse(task, 201)
  } catch (error) {
    console.error('CourseTasks POST error:', error)
    return errorResponse('Failed to create course task', 500)
  }
}
