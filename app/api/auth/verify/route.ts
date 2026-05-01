import { NextRequest } from 'next/server'
import { getUserFromToken } from '@/lib/auth-utils'
import { errorResponse, successResponse } from '@/lib/api-data-utils'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401)
    }

    const token = authHeader.slice(7)
    const user = await getUserFromToken(token)
    if (!user) {
      return errorResponse('Invalid or expired token', 401)
    }

    return successResponse({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (error) {
    console.error('Verify error:', error)
    return errorResponse('Internal server error', 500)
  }
}
