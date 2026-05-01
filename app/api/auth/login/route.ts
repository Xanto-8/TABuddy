import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth-utils'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { getClientIP } from '@/lib/auth-guard'
import { getLocationFromRequest } from '@/lib/ip-location'

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    const bannedIP = await prisma.bannedIP.findUnique({ where: { ip: clientIP } })
    if (bannedIP) {
      return errorResponse('该IP已被封禁，无法登录', 403)
    }

    const body = await getBody<{ username: string; password: string }>(request)
    if (!body || !body.username || !body.password) {
      return errorResponse('Username and password are required')
    }

    const { username, password } = body

    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return errorResponse('Invalid username or password', 401)
    }

    if (user.password !== password) {
      return errorResponse('Invalid username or password', 401)
    }

    const location = await getLocationFromRequest(request)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastActiveAt: new Date(),
        lastLoginIp: location.ip,
        lastLoginCountry: location.country,
        lastLoginCity: location.city,
        lastLoginRegion: location.region,
      },
    })

    const token = generateToken({ id: user.id, username: user.username, role: user.role, classGroupId: user.classGroupId })

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        classGroupId: user.classGroupId,
        hasReadGuide: user.hasReadGuide,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
