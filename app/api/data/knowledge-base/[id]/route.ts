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

    const existing = await prisma.knowledgeBaseEntry.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{
      title?: string; content?: string; category?: string; tags?: string
    }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const entry = await prisma.knowledgeBaseEntry.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    })
    return successResponse(entry)
  } catch (error) {
    console.error('KnowledgeBaseEntry PUT error:', error)
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

    const existing = await prisma.knowledgeBaseEntry.findFirst({
      where: { id: params.id, userId },
    })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.knowledgeBaseEntry.delete({ where: { id: params.id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('KnowledgeBaseEntry DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
