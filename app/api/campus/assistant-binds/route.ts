import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'campusadmin') return forbiddenResponse('仅校区班主任可查看')

  try {
    const binds = await prisma.campusAdminBind.findMany({
      where: { campusAdminId: tokenUser.userId, status: 'active' },
      select: { classAdminId: true },
    })

    const classAdminIds = binds.map(b => b.classAdminId)
    if (classAdminIds.length === 0) {
      return NextResponse.json({ data: { binds: [] } })
    }

    const assistantBinds = await prisma.teacherAssistantBind.findMany({
      where: { teacherId: { in: classAdminIds }, status: 'active', assistantId: { not: null } },
      include: {
        teacher: { select: { id: true, displayName: true, username: true } },
        assistant: { select: { id: true, displayName: true, username: true, avatar: true, lastActiveAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mapped = assistantBinds
      .filter(b => b.assistant !== null)
      .map(b => ({
      id: b.id,
      createdAt: b.createdAt,
      bindedAt: b.bindedAt,
      teacher: { id: b.teacher.id, displayName: b.teacher.displayName, username: b.teacher.username },
      assistant: { id: b.assistant!.id, displayName: b.assistant!.displayName, username: b.assistant!.username, avatar: b.assistant!.avatar, lastActiveAt: b.assistant!.lastActiveAt },
    }))

    const totalAssistants = new Set(mapped.map(m => m.assistant.id)).size
    const totalTeachers = new Set(mapped.map(m => m.teacher.id)).size

    return NextResponse.json({
      data: {
        binds: mapped,
        totalBinds: mapped.length,
        totalAssistants,
        totalTeachers,
      },
    })
  } catch (error) {
    console.error('[campus/assistant-binds] error:', error)
    return NextResponse.json({ error: '获取助教绑定数据失败' }, { status: 500 })
  }
}
