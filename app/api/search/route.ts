import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'

const ROLE_LABELS: Record<string, string> = {
  superadmin: '超级管理员',
  classadmin: '班级管理员',
  assistant: '助教',
  student: '学生',
}

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  const q = request.nextUrl.searchParams.get('q')?.trim() || ''

  if (!q || q.length < 1) {
    return NextResponse.json({ data: { users: [], classes: [] } })
  }

  const isSuperAdmin = tokenUser.role === 'superadmin'

  try {
    const keyword = `%${q}%`

    const classFilter = isSuperAdmin
      ? {}
      : { id: tokenUser.classGroupId || '__none__' }

    const userWhere: Record<string, unknown> = {
      OR: [
        { displayName: { contains: q } },
        { username: { contains: q } },
      ],
    }

    if (!isSuperAdmin) {
      userWhere.classGroupId = tokenUser.classGroupId || '__none__'
    }

    const [users, classes] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          role: true,
          classGroupId: true,
          lastActiveAt: true,
        },
        orderBy: { username: 'asc' },
        take: 20,
      }),
      prisma.classGroup.findMany({
        where: {
          name: { contains: q },
          ...classFilter,
        },
        select: {
          id: true,
          name: true,
          _count: { select: { users: true } },
        },
        orderBy: { name: 'asc' },
        take: 10,
      }),
    ])

    const userClassIds = Array.from(new Set(users.map(u => u.classGroupId).filter(Boolean)))
    const classMap: Record<string, string> = {}
    if (userClassIds.length > 0) {
      const classGroups = await prisma.classGroup.findMany({
        where: { id: { in: userClassIds as string[] } },
        select: { id: true, name: true },
      })
      for (const cg of classGroups) {
        classMap[cg.id] = cg.name
      }
    }

    const mappedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName || u.username,
      avatar: u.avatar,
      role: u.role,
      roleLabel: ROLE_LABELS[u.role] || u.role,
      classGroupId: u.classGroupId,
      className: u.classGroupId ? classMap[u.classGroupId] || '' : '',
      lastActiveAt: u.lastActiveAt,
    }))

    return NextResponse.json({
      data: {
        users: mappedUsers,
        classes: classes.map(c => ({
          id: c.id,
          name: c.name,
          userCount: c._count.users,
        })),
      },
    })
  } catch (error) {
    console.error('[search] GET error:', error)
    return NextResponse.json({ error: '搜索失败' }, { status: 500 })
  }
}
