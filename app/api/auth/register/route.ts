import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateToken } from '@/lib/auth-utils'
import { errorResponse, successResponse, getBody } from '@/lib/api-data-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await getBody<{ username: string; password: string; displayName: string }>(request)
    if (!body || !body.username || !body.password || !body.displayName) {
      return errorResponse('Username, password, and displayName are required')
    }

    const { username, password, displayName } = body

    const existingUser = await prisma.user.findUnique({ where: { username } })
    if (existingUser) {
      return errorResponse('Username already exists', 409)
    }

    const userCount = await prisma.user.count()

    const user = await prisma.user.create({
      data: {
        username,
        password,
        displayName,
        role: userCount === 0 ? 'superadmin' : 'student',
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
        classGroupId: user.classGroupId,
      },
    }, 201)
  } catch (error) {
    console.error('Register error:', error)
    return errorResponse('Internal server error', 500)
  }
}
