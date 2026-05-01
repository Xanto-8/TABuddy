import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { verifyToken } from '@/lib/auth-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const items = await prisma.publicKnowledgeItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(items)
  } catch (error) {
    console.error('PublicKnowledge GET error:', error)
    return errorResponse('Failed to fetch public knowledge items', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const decoded = verifyToken(authHeader.slice(7))
    if (!decoded || decoded.role !== 'admin') {
      return errorResponse('Forbidden: admin access required', 403)
    }

    const body = await getBody<{ title: string; content: string; category?: string; tags?: string }>(request)
    if (!body || !body.title || !body.content) {
      return errorResponse('Title and content are required', 400)
    }

    const item = await prisma.publicKnowledgeItem.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category ?? '',
        tags: body.tags ?? '[]',
      },
    })

    return successResponse(item, 201)
  } catch (error) {
    console.error('PublicKnowledge POST error:', error)
    return errorResponse('Failed to create public knowledge item', 500)
  }
}
