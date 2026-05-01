import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, ONLINE_THRESHOLD_MINUTES } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const offlineTime = new Date(Date.now() - (ONLINE_THRESHOLD_MINUTES + 1) * 60 * 1000)
    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { lastActiveAt: offlineTime },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[heartbeat/offline] error:', error)
    return NextResponse.json({ error: '离线状态更新失败' }, { status: 500 })
  }
}
