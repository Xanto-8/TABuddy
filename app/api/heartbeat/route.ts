import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse } from '@/lib/auth-guard'
import { getLocationFromRequest } from '@/lib/ip-location'

export async function POST(request: NextRequest) {
  const tokenUser = getTokenUser(request)
  if (!tokenUser) return unauthorizedResponse()

  try {
    const location = await getLocationFromRequest(request)

    await prisma.user.update({
      where: { id: tokenUser.userId },
      data: {
        lastActiveAt: new Date(),
        lastLoginIp: location.ip,
        lastLoginCountry: location.country,
        lastLoginCity: location.city,
        lastLoginRegion: location.region,
      },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[heartbeat] error:', error)
    return NextResponse.json({ error: '心跳更新失败' }, { status: 500 })
  }
}
