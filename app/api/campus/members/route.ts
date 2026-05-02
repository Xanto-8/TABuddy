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
      return NextResponse.json({ data: { users: [], total: 0 } })
    }

    const users = await prisma.user.findMany({
      where: { id: { in: classAdminIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        createdAt: true,
        lastActiveAt: true,
        _count: { select: { classes: true, students: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const mappedUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      role: u.role,
      roleLabel: u.role === 'classadmin' ? '班级管理员' : u.role,
      createdAt: u.createdAt,
      lastActiveAt: u.lastActiveAt,
      classCount: u._count.classes,
      studentCount: u._count.students,
    }))

    return NextResponse.json({
      data: {
        users: mappedUsers,
        total: mappedUsers.length,
      },
    })
  } catch (error) {
    console.error('[campus/members] error:', error)
    return NextResponse.json({ error: '获取校区成员失败' }, { status: 500 })
  }
}
