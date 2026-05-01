import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User not found', 404)

    return successResponse({ avatar: user.avatar })
  } catch (error) {
    console.error('Avatar GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ avatar: string }>(request)
    if (!body || typeof body.avatar !== 'string') {
      return errorResponse('Avatar URL is required', 400)
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatar: body.avatar },
    })

    return successResponse({ avatar: user.avatar })
  } catch (error) {
    console.error('Avatar PUT error:', error)
    return errorResponse('Internal server error', 500)
  }
}
