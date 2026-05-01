import { NextRequest, NextResponse } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== 'classadmin') {
      return errorResponse('仅班级管理员可查看已绑定成员', 403)
    }

    const binds = await prisma.teacherAssistantBind.findMany({
      where: { teacherId: userId, assistantId: { not: null }, status: 'active' },
      include: {
        assistant: {
          select: {
            id: true,
            username: true,
            password: true,
            displayName: true,
            role: true,
            classGroupId: true,
            lastActiveAt: true,
            lastLoginIp: true,
            lastLoginCountry: true,
            lastLoginCity: true,
            lastLoginRegion: true,
            createdAt: true,
            avatar: true,
          },
        },
      },
      orderBy: { bindedAt: 'desc' },
    })

    const classGroupIds = binds
      .map(b => b.assistant?.classGroupId)
      .filter(Boolean) as string[]
    const classGroups = await prisma.classGroup.findMany({
      where: { id: { in: classGroupIds } },
      select: { id: true, name: true },
    })
    const classGroupMap = new Map(classGroups.map(cg => [cg.id, cg.name]))

    const result = binds.map(b => ({
      bindId: b.id,
      bindedAt: b.bindedAt,
      assistant: b.assistant ? {
        ...b.assistant,
        className: b.assistant.classGroupId ? classGroupMap.get(b.assistant.classGroupId) || null : null,
      } : null,
    }))

    return successResponse(result)
  } catch (error) {
    console.error('[bound-members] GET error:', error)
    return errorResponse('获取已绑定成员列表失败', 500)
  }
}
