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

    const templates = await prisma.taskTemplate.findMany({ where })
    return successResponse(templates)
  } catch (error) {
    console.error('TaskTemplates GET error:', error)
    return errorResponse('Failed to fetch task templates', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ title: string; type?: string; classId?: string }>(request)
    if (!body || !body.title) return errorResponse('Title is required', 400)

    const template = await prisma.taskTemplate.create({
      data: { title: body.title, type: body.type ?? '', classId: body.classId ?? null, userId },
    })

    return successResponse(template, 201)
  } catch (error) {
    console.error('TaskTemplates POST error:', error)
    return errorResponse('Failed to create task template', 500)
  }
}
