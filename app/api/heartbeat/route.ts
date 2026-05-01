import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: { lastActiveAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[heartbeat] error:', error)
    return NextResponse.json({ error: '心跳更新失败' }, { status: 500 })
  }
}
