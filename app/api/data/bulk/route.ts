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

    const storeUserIds = [userId]
    const boundAssistants = (userData as { boundAssistants?: { id: string }[] }).boundAssistants
    if (boundAssistants && boundAssistants.length > 0) {
      storeUserIds.push(...boundAssistants.map(a => a.id))
    }

    const storeEntries = await prisma.userStore.findMany({
      where: { userId: { in: storeUserIds } },
    })

    const storeData: Record<string, unknown> = {}
    const keyGroups: Record<string, { userId: string; value: unknown }[]> = {}

    for (const entry of storeEntries) {
      let parsed: unknown
      try { parsed = JSON.parse(entry.value) } catch { parsed = entry.value }
      if (!keyGroups[entry.key]) keyGroups[entry.key] = []
      keyGroups[entry.key].push({ userId: entry.userId, value: parsed })
    }

    for (const [key, entries] of Object.entries(keyGroups)) {
      const firstVal = entries[0].value

      if (entries.length === 1) {
        storeData[key] = firstVal
      } else if (Array.isArray(firstVal)) {
        const merged = new Map<string, unknown>()
        for (const { value } of entries) {
          if (Array.isArray(value)) {
            for (const item of value) {
              const itemAny = item as { id?: string }
              merged.set(itemAny.id || `__idx_${Math.random()}`, item)
            }
          }
        }
        storeData[key] = Array.from(merged.values())
      } else if (typeof firstVal === 'object' && firstVal !== null) {
        const merged: Record<string, unknown> = {}
        for (const { value } of entries) {
          if (typeof value === 'object' && value !== null) {
            Object.assign(merged, value as Record<string, unknown>)
          }
        }
        storeData[key] = merged
      } else {
        const classadminEntry = entries.find(e => e.userId === userId)
        storeData[key] = classadminEntry ? classadminEntry.value : firstVal
      }
    }

    const boundAssistantList = (userData as { boundAssistants?: { id: string; displayName: string }[] }).boundAssistants
    if (boundAssistantList && boundAssistantList.length > 0) {
      const assistantOriginalClasses = await prisma.class.findMany({
        where: { userId: { in: boundAssistantList.map(a => a.id) } },
        select: { id: true, name: true, userId: true },
      })

      const assistantNameMap: Record<string, string> = {}
      for (const a of boundAssistantList) {
        assistantNameMap[a.id] = a.displayName
      }

      const classIdMapping: Record<string, string> = {}
      const classadminClasses = (userData as { classes?: { id: string; name: string; createdBy?: string }[] }).classes || []
      for (const aClass of assistantOriginalClasses) {
        const displayName = assistantNameMap[aClass.userId]
        if (!displayName) continue
        const synced = classadminClasses.find(
          (c: { name: string; createdBy?: string }) => c.name === aClass.name && c.createdBy === displayName
        )
        if (synced) {
          classIdMapping[aClass.id] = synced.id
        }
      }

      if (Object.keys(classIdMapping).length > 0) {
        const ud = userData as Record<string, unknown>
        for (const item of (ud.students as { classId?: string }[]) || []) {
          if (item.classId && classIdMapping[item.classId]) item.classId = classIdMapping[item.classId]
        }
        for (const item of (ud.classSchedules as { classId?: string }[]) || []) {
          if (item.classId && classIdMapping[item.classId]) item.classId = classIdMapping[item.classId]
        }

        for (const value of Object.values(storeData)) {
          if (Array.isArray(value)) {
            for (const item of value) {
              if (item && typeof item === 'object' && 'classId' in item) {
                const obj = item as { classId?: string }
                if (obj.classId && classIdMapping[obj.classId]) {
                  obj.classId = classIdMapping[obj.classId]
                }
              }
            }
          }
        }
      }
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
