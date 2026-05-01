import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return errorResponse('User not found', 404)

    const body = await getBody<{ bindId: string }>(request)
    if (!body || !body.bindId) {
      return errorResponse('Bind ID is required', 400)
    }

    const bind = await prisma.teacherAssistantBind.findUnique({
      where: { id: body.bindId },
    })

    if (!bind) {
      return errorResponse('Bind record not found', 404)
    }

    if (bind.teacherId !== userId) {
      return errorResponse('Only the teacher can unbind assistants', 403)
    }

    await prisma.teacherAssistantBind.update({
      where: { id: body.bindId },
      data: {
        status: 'unbinded',
        assistantId: null,
        bindedAt: null,
      },
    })

    return successResponse({ message: 'Assistant unbound successfully' })
  } catch (error) {
    console.error('Unbind assistant error:', error)
    return errorResponse('Failed to unbind assistant', 500)
  }
}
