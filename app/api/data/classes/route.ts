import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const classes = await prisma.class.findMany({
      where: { userId },
      include: {
        schedules: true,
        students: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(classes)
  } catch (error) {
    console.error('Classes GET error:', error)
    return errorResponse('Failed to fetch classes', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      name: string
      type?: string
      studentCount?: number
      color?: string
      isArchived?: boolean
    }>(request)

    if (!body || !body.name) {
      return errorResponse('Name is required', 400)
    }

    const classItem = await prisma.class.create({
      data: {
        name: body.name,
        type: body.type ?? '',
        studentCount: body.studentCount ?? 0,
        color: body.color ?? '',
        isArchived: body.isArchived ?? false,
        userId,
      },
      include: { schedules: true },
    })

    return successResponse(classItem, 201)
  } catch (error) {
    console.error('Classes POST error:', error)
    return errorResponse('Failed to create class', 500)
  }
}
