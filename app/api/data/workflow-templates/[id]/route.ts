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
    const template = await prisma.workflowTemplate.findFirst({ where: { id: params.id, userId } })
    if (!template) return errorResponse('Not found', 404)
    return successResponse(template)
  } catch (error) {
    console.error('workflow-templates GET by id error:', error)
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
    const existing = await prisma.workflowTemplate.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{ name?: string; nodes?: string }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const template = await prisma.workflowTemplate.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nodes !== undefined && { nodes: body.nodes }),
      },
    })
    return successResponse(template)
  } catch (error) {
    console.error('workflow-templates PUT error:', error)
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
    const existing = await prisma.workflowTemplate.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.workflowTemplate.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('workflow-templates DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
