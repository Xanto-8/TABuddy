import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const logs = await prisma.pushLog.findMany({
      where: { userId },
      orderBy: { sentAt: 'desc' },
    })
    return successResponse(logs)
  } catch (error) {
    console.error('PushLogs GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ title: string; message: string; type?: string }>(request)
    if (!body || !body.title || !body.message) {
      return errorResponse('Title and message are required', 400)
    }

    const log = await prisma.pushLog.create({
      data: { title: body.title, message: body.message, type: body.type ?? '', userId },
    })
    return successResponse(log, 201)
  } catch (error) {
    console.error('PushLogs POST error:', error)
    return errorResponse('Internal server error', 500)
  }
}
