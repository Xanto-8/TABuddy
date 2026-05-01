import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User not found', 404)

    let settings = {}
    try {
      settings = JSON.parse(user.settings || '{}')
    } catch {
      settings = {}
    }

    return successResponse({ settings })
  } catch (error) {
    console.error('Settings GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<Record<string, unknown>>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const user = await prisma.user.update({
      where: { id: userId },
      data: { settings: JSON.stringify(body) },
    })

    let settings = {}
    try {
      settings = JSON.parse(user.settings || '{}')
    } catch {
      settings = {}
    }

    return successResponse({ settings })
  } catch (error) {
    console.error('Settings PUT error:', error)
    return errorResponse('Internal server error', 500)
  }
}
