import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const templates = await prisma.workflowTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(templates)
  } catch (error) {
    console.error('workflow-templates GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ name: string; nodes?: string }>(request)
    if (!body || !body.name) return errorResponse('Name is required', 400)

    const template = await prisma.workflowTemplate.create({
      data: { name: body.name, nodes: body.nodes || '[]', userId },
    })
    return successResponse(template, 201)
  } catch (error) {
    console.error('workflow-templates POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
