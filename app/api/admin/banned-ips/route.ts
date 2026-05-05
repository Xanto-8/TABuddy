import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可管理封禁IP')

  try {
    const bannedIPs = await prisma.bannedIP.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const bannedByIds = Array.from(new Set(bannedIPs.map(b => b.bannedBy)))
    const bannedByUsers = await prisma.user.findMany({
      where: { id: { in: bannedByIds } },
      select: { id: true, username: true, displayName: true },
    })
    const userMap = new Map(bannedByUsers.map(u => [u.id, u.displayName || u.username]))

    const result = bannedIPs.map(b => ({
      id: b.id,
      ip: b.ip,
      reason: b.reason,
      bannedByName: userMap.get(b.bannedBy) || '未知',
      createdAt: b.createdAt,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('[admin/banned-ips] GET error:', error)
    return NextResponse.json({ error: '获取封禁列表失败' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()
  if (tokenUser.role !== 'superadmin') return forbiddenResponse('仅超级管理员可撤销封禁')

  try {
    const { ip, id } = await request.json()
    if (!ip && !id) {
      return NextResponse.json({ error: '缺少IP或ID' }, { status: 400 })
    }

    if (id) {
      await prisma.bannedIP.delete({ where: { id } })
    } else {
      await prisma.bannedIP.delete({ where: { ip } })
    }

    return NextResponse.json({
      data: { message: `IP ${ip || id} 已解封` },
    })
  } catch (error) {
    console.error('[admin/banned-ips] DELETE error:', error)
    return NextResponse.json({ error: '撤销封禁失败' }, { status: 500 })
  }
}
