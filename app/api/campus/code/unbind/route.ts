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

    const bind = await prisma.campusAdminBind.findUnique({
      where: { id: body.bindId },
    })

    if (!bind) {
      return errorResponse('Bind record not found', 404)
    }

    if (bind.classAdminId !== userId && bind.campusAdminId !== userId) {
      return errorResponse('Only the class admin or campus head teacher can unbind', 403)
    }

    await prisma.campusAdminBind.update({
      where: { id: body.bindId },
      data: {
        status: 'unbinded',
        campusAdminId: null,
        bindedAt: null,
      },
    })

    return successResponse({ message: 'Unbound successfully' })
  } catch (error) {
    console.error('Unbind campus admin error:', error)
    return errorResponse('Failed to unbind', 500)
  }
}
