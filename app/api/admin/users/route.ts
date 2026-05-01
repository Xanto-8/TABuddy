import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理用户')

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        classGroupId: true,
        lastActiveAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
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
      displayName: u.displayName,
      role: u.role,
      classGroupId: u.classGroupId,
      className: u.classGroupId ? classGroupMap.get(u.classGroupId) || null : null,
      lastActiveAt: u.lastActiveAt,
      createdAt: u.createdAt,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[admin/users] GET error:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理用户')

  try {
    const body = await request.json()
    const { userId, password, displayName, role, classGroupId } = body

    if (!userId) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 })
    }

    const updateData: Record<string, string | null> = {}

    if (password !== undefined) {
      if (password && password.length < 6) {
        return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 })
      }
      if (password) updateData.password = password
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (role !== undefined) {
      if (!['superadmin', 'classadmin', 'student'].includes(role)) {
        return NextResponse.json({ error: '无效的角色类型' }, { status: 400 })
      }
      updateData.role = role
      if (role === 'superadmin') {
        updateData.classGroupId = null
      }
    }

    if (classGroupId !== undefined) {
      if (classGroupId) {
        const classGroup = await prisma.classGroup.findUnique({ where: { id: classGroupId } })
        if (!classGroup) {
          return NextResponse.json({ error: '班级不存在' }, { status: 400 })
        }
        updateData.classGroupId = classGroupId
      } else {
        updateData.classGroupId = null
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        classGroupId: true,
      },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('[admin/users] POST error:', error)
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}
