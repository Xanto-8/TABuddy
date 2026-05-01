import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User not found', 404)

    if (user.role !== 'assistant') {
      return errorResponse('Only assistants can bind via invite code', 403)
    }

    const body = await getBody<{ inviteCode: string }>(request)
    if (!body || !body.inviteCode) {
      return errorResponse('Invite code is required', 400)
    }

    const inviteCode = body.inviteCode.trim().toUpperCase()

    const source = await prisma.teacherAssistantBind.findFirst({
      where: { inviteCode, assistantId: null, status: 'active' },
      include: { teacher: { select: { id: true, username: true, displayName: true, avatar: true } } },
    })

    if (!source) {
      return errorResponse('Invalid or expired invite code', 404)
    }

    if (source.expiresAt && new Date(source.expiresAt) < new Date()) {
      await prisma.teacherAssistantBind.update({
        where: { id: source.id },
        data: { status: 'unbinded' },
      })
      return errorResponse('Invite code has expired', 410)
    }

    if (source.teacherId === userId) {
      return errorResponse('Cannot bind to yourself', 400)
    }

    const existingBind = await prisma.teacherAssistantBind.findFirst({
      where: { assistantId: userId, status: 'active' },
    })
    if (existingBind) {
      return errorResponse('You are already bound to a teacher. Please unbind first.', 400)
    }

    const alreadyBound = await prisma.teacherAssistantBind.findFirst({
      where: { teacherId: source.teacherId, assistantId: userId, status: 'active' },
    })
    if (alreadyBound) {
      return errorResponse('You are already bound to this teacher.', 400)
    }

    const binding = await prisma.teacherAssistantBind.create({
      data: {
        teacherId: source.teacherId,
        assistantId: userId,
        inviteCode,
        status: 'active',
        bindedAt: new Date(),
      },
      include: {
        teacher: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    })

    return successResponse(binding, 201)
  } catch (error) {
    console.error('Bind invite code error:', error)
    return errorResponse('Failed to bind invite code', 500)
  }
}
