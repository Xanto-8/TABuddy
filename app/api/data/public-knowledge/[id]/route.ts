import { NextRequest } from 'next/server'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { verifyToken } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const decoded = verifyToken(authHeader.slice(7))
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse('Forbidden: admin access required', 403)
    }

    const { id } = params
    const existing = await prisma.publicKnowledgeItem.findUnique({ where: { id } })
    if (!existing) return errorResponse('Not found', 404)

    const body = await getBody<{ title?: string; content?: string; category?: string; tags?: string }>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const item = await prisma.publicKnowledgeItem.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.content !== undefined && { content: body.content }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.tags !== undefined && { tags: body.tags }),
      },
    })

    return successResponse(item)
  } catch (error) {
    console.error('PublicKnowledge PUT error:', error)
    return errorResponse('Failed to update public knowledge item', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const decoded = verifyToken(authHeader.slice(7))
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse('Forbidden: admin access required', 403)
    }

    const { id } = params
    const existing = await prisma.publicKnowledgeItem.findUnique({ where: { id } })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.publicKnowledgeItem.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('PublicKnowledge DELETE error:', error)
    return errorResponse('Failed to delete public knowledge item', 500)
  }
}
