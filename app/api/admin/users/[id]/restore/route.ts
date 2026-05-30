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
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可恢复账号')

  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (!user.deletedAt) {
      return NextResponse.json({ error: '该账号未被注销，无需恢复' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id },
      data: { deletedAt: null },
    })

    if (user.lastLoginIp && user.lastLoginIp !== 'unknown') {
      const bannedRecord = await prisma.bannedIP.findUnique({
        where: { ip: user.lastLoginIp },
      })
      if (bannedRecord) {
        await prisma.bannedIP.delete({ where: { ip: user.lastLoginIp } })
      }
    }

    return NextResponse.json({
      data: {
        message: `用户 ${user.username} 已恢复`,
        restoredUser: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        },
      },
    })
  } catch (error) {
    console.error('[admin/users/id/restore] PATCH error:', error)
    return NextResponse.json({ error: '恢复账号失败' }, { status: 500 })
  }
}
