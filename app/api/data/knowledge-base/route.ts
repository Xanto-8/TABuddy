import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const entries = await prisma.knowledgeBaseEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse(entries)
  } catch (error) {
    console.error('KnowledgeBase GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      title: string; content: string; category?: string; tags?: string
    }>(request)
    if (!body || !body.title || !body.content) {
      return errorResponse('Title and content are required', 400)
    }

    const entry = await prisma.knowledgeBaseEntry.create({
      data: {
        title: body.title, content: body.content,
        category: body.category ?? '', tags: body.tags ?? '[]', userId,
      },
    })
    return successResponse(entry, 201)
  } catch (error) {
    console.error('KnowledgeBase POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return errorResponse('id query parameter is required', 400)

    const existing = await prisma.knowledgeBaseEntry.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Not found', 404)

    await prisma.knowledgeBaseEntry.delete({ where: { id } })
    return successResponse({ deleted: true })
  } catch (error) {
    console.error('KnowledgeBase DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
