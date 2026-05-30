import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可查看已注销用户')

  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: { not: null } },
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
        deletedAt: true,
        createdAt: true,
      },
      orderBy: { deletedAt: 'desc' },
    })

    const classGroupIds = users.map(u => u.classGroupId).filter(Boolean) as string[]
    const classGroups = await prisma.classGroup.findMany({
      where: { id: { in: classGroupIds } },
      select: { id: true, name: true },
    })
    const classGroupMap = new Map(classGroups.map(cg => [cg.id, cg.name]))

    const result = users.map(u => ({
      id: u.id,
      username: u.username,
      password: u.password,
      displayName: u.displayName,
      role: u.role,
      classGroupId: u.classGroupId,
      className: u.classGroupId ? classGroupMap.get(u.classGroupId) || null : null,
      lastActiveAt: u.lastActiveAt,
      lastLoginIp: u.lastLoginIp,
      lastLoginCountry: u.lastLoginCountry,
      lastLoginCity: u.lastLoginCity,
      lastLoginRegion: u.lastLoginRegion,
      deletedAt: u.deletedAt,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[admin/users/deleted] GET error:', error)
    return NextResponse.json({ error: '获取已注销用户列表失败' }, { status: 500 })
  }
}
