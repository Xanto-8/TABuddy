import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const entry = await prisma.userStore.findUnique({
        where: { userId_key: { userId, key } },
      })
      if (!entry) return successResponse({ key, value: null })
      let value = null
      try { value = JSON.parse(entry.value) } catch { value = entry.value }
      return successResponse({ key, value })
    }

    const entries = await prisma.userStore.findMany({ where: { userId } })
    const result: Record<string, unknown> = {}
    for (const entry of entries) {
      try { result[entry.key] = JSON.parse(entry.value) } catch { result[entry.key] = entry.value }
    }
    return successResponse(result)
  } catch (error) {
    console.error('Store GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{ key: string; value: unknown }>(request)
    if (!body || !body.key) return errorResponse('Key is required', 400)

    const stringValue = typeof body.value === 'string' ? body.value : JSON.stringify(body.value)

    const entry = await prisma.userStore.upsert({
      where: { userId_key: { userId, key: body.key } },
      update: { value: stringValue },
      create: { userId, key: body.key, value: stringValue },
    })

    let parsedValue: unknown = null
    try { parsedValue = JSON.parse(entry.value) } catch { parsedValue = entry.value }

    return successResponse({ key: entry.key, value: parsedValue })
  } catch (error) {
    console.error('Store PUT error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')
    if (!key) return errorResponse('Key parameter is required', 400)

    await prisma.userStore.deleteMany({ where: { userId, key } })
    return successResponse({ key, deleted: true })
  } catch (error) {
    console.error('Store DELETE error:', error)
    return errorResponse('Internal server error', 500)
  }
}
