import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth-utils'
import { getClientIP } from '@/lib/auth-guard'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { getLocationFromRequest } from '@/lib/ip-location'

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)

    const bannedIP = await prisma.bannedIP.findUnique({ where: { ip: clientIP } })
    if (bannedIP) {
      return errorResponse('该IP已被封禁，无法注册', 403)
    }

    const body = await getBody<{ username: string; password: string; displayName?: string; teacherCode?: string }>(request)
    if (!body || !body.username || !body.password) {
      return errorResponse('Username and password are required')
    }

    const { username, password, displayName, teacherCode } = body

    if (password.length < 6) {
      return errorResponse('Password must be at least 6 characters')
    }

    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return errorResponse('Username already exists')
    }

    const userCount = await prisma.user.count()

    let role = 'assistant'

    if (userCount === 0) {
      role = 'superadmin'
    } else if (teacherCode) {
      const code = teacherCode.trim().toUpperCase()
      const validCode = await prisma.teacherRegCode.findFirst({
        where: { code, isActive: true },
      })
      if (!validCode) {
        return errorResponse('老师注册码无效或已失效，请检查后重试', 400)
      }
      role = 'classadmin'
    }

    const location = await getLocationFromRequest(request)

    const user = await prisma.user.create({
      data: {
        username,
        password,
        displayName: displayName || '',
        role,
        lastActiveAt: new Date(),
        lastLoginIp: location.ip,
        lastLoginCountry: location.country,
        lastLoginCity: location.city,
        lastLoginRegion: location.region,
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
