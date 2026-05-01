import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const config = await prisma.reminderConfig.findFirst({ where: { userId } })
    let parsed = {}
    if (config) {
      try { parsed = JSON.parse(config.config || '{}') } catch { parsed = {} }
    }

    return successResponse({ config: parsed })
  } catch (error) {
    console.error('ReminderConfig GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<Record<string, unknown>>(request)
    if (!body) return errorResponse('Invalid request body', 400)

    const existing = await prisma.reminderConfig.findFirst({ where: { userId } })
    if (existing) {
      await prisma.reminderConfig.update({
        where: { id: existing.id },
        data: { config: JSON.stringify(body) },
      })
    } else {
      await prisma.reminderConfig.create({
        data: { config: JSON.stringify(body), userId },
      })
    }

    return successResponse({ config: body })
  } catch (error) {
    console.error('ReminderConfig PUT error:', error)
    return errorResponse('Internal server error', 500)
  }
}
