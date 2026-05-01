import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { getAllUserData } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const userData = await getAllUserData(userId)

    const publicKnowledgeItems = await prisma.publicKnowledgeItem.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const storeEntries = await prisma.userStore.findMany({ where: { userId } })
    const storeData: Record<string, unknown> = {}
    for (const entry of storeEntries) {
      try { storeData[entry.key] = JSON.parse(entry.value) } catch { storeData[entry.key] = entry.value }
    }

    return successResponse({
      ...userData,
      publicKnowledgeItems,
      storeData,
    })
  } catch (error) {
    console.error('Bulk GET error:', error)
    return errorResponse('Internal server error', 500)
  }
}
