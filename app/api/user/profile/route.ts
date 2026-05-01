import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'

export async function PUT(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { username, displayName, avatar } = body

    const updateData: Record<string, unknown> = {}

    if (username !== undefined) {
      const trimmed = username.trim()
      if (!trimmed) {
        return NextResponse.json({ error: '用户名不能为空' }, { status: 400 })
      }
      const existing = await prisma.user.findUnique({ where: { username: trimmed } })
      if (existing && existing.id !== tokenUser.userId) {
        return NextResponse.json({ error: '用户名已被占用' }, { status: 409 })
      }
      updateData.username = trimmed
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '没有需要修改的字段' }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: tokenUser.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        classGroupId: true,
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[user/profile] PUT error:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
