import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User not found', 404)

    if (user.role !== 'campusadmin') {
      return errorResponse('Only campus head teachers can bind via campus code', 403)
    }

    const body = await getBody<{ inviteCode: string }>(request)
    if (!body || !body.inviteCode) {
      return errorResponse('Invite code is required', 400)
    }

    const inviteCode = body.inviteCode.trim().toUpperCase()

    const source = await prisma.campusAdminBind.findFirst({
      where: { inviteCode, campusAdminId: null, status: 'active' },
      include: {
        classAdmin: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    })

    if (!source) {
      return errorResponse('Invalid or expired campus code', 404)
    }

    if (source.expiresAt && new Date(source.expiresAt) < new Date()) {
      await prisma.campusAdminBind.update({
        where: { id: source.id },
        data: { status: 'unbinded' },
      })
      return errorResponse('Campus code has expired', 410)
    }

    if (source.classAdminId === userId) {
      return errorResponse('Cannot bind to yourself', 400)
    }

    const alreadyBound = await prisma.campusAdminBind.findFirst({
      where: { classAdminId: source.classAdminId, campusAdminId: userId, status: 'active' },
    })
    if (alreadyBound) {
      return errorResponse('You are already bound to this class admin.', 400)
    }

    const binding = await prisma.campusAdminBind.create({
      data: {
        classAdminId: source.classAdminId,
        campusAdminId: userId,
        inviteCode,
        status: 'active',
        bindedAt: new Date(),
      },
      include: {
        classAdmin: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    })

    return successResponse(binding, 201)
  } catch (error) {
    console.error('Bind campus code error:', error)
    return errorResponse('Failed to bind campus code', 500)
  }
}
