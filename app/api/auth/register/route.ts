import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth-utils'
import { getClientIP } from '@/lib/auth-guard'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { getIPLocation } from '@/lib/ip-location'

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    const bannedIP = await prisma.bannedIP.findUnique({ where: { ip: clientIP } })
    if (bannedIP) {
      return errorResponse('该IP已被封禁，无法注册', 403)
    }

    const body = await getBody<{ username: string; password: string; displayName?: string }>(request)
    if (!body || !body.username || !body.password) {
      return errorResponse('Username and password are required')
    }

    const { username, password, displayName } = body

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters')
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return errorResponse('Username already exists')
    }

    const userCount = await prisma.user.count()

    const location = await getIPLocation(clientIP)

    const user = await prisma.user.create({
      data: {
        username,
        password,
        displayName: displayName || '',
        role: userCount === 0 ? 'superadmin' : 'assistant',
        lastActiveAt: new Date(),
        lastLoginIp: clientIP,
        lastLoginCity: location?.city || '',
        lastLoginRegion: location?.region || '',
      },
    })

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      classGroupId: user.classGroupId,
    })

    return successResponse({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
        classGroupId: user.classGroupId,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}
