import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可修改用户')

  try {
    const body = await request.json()
    const { username, password, displayName, role, classGroupId } = body

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (username !== undefined) {
      if (!username.trim()) {
        return NextResponse.json({ error: '用户名不能为空' }, { status: 400 })
      }
      const existing = await prisma.user.findUnique({ where: { username } })
      if (existing && existing.id !== id) {
        return NextResponse.json({ error: '用户名已存在' }, { status: 409 })
      }
      updateData.username = username.trim()
    }

    if (password !== undefined) {
      if (!password || password.length < 6) {
        return NextResponse.json({ error: '密码长度不能少于6位' }, { status: 400 })
      }
      updateData.password = password
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (role !== undefined) {
      const VALID_ROLES = ['superadmin', 'classadmin', 'assistant', 'student']
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json({ error: '无效的角色类型' }, { status: 400 })
      }
      updateData.role = role
      if (role === 'superadmin') {
        updateData.classGroupId = null
      } else if (classGroupId !== undefined) {
        updateData.classGroupId = classGroupId || null
      }
    } else if (classGroupId !== undefined) {
      updateData.classGroupId = classGroupId || null
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有需要更新的字段' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        role: true,
        classGroupId: true,
        password: true,
        lastActiveAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[admin/users/id] PATCH error:', error)
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 })
  }
}
