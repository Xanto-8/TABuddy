import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const includeArchived = searchParams.get('includeArchived') === 'true'

    const where: Record<string, unknown> = { userId }
    if (classId) where.classId = classId
    if (!includeArchived) where.isArchived = false

    const students = await prisma.student.findMany({
      where,
      include: { class: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    })

    return successResponse(students)
  } catch (error) {
    console.error('Students GET error:', error)
    return errorResponse('Failed to fetch students', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const body = await getBody<{
      name: string; classId: string
      isKeyStudent?: boolean; retestList?: string; testAccuracy?: string
      quizCompletion?: string; notes?: string; assessments?: string
      quizzes?: string; isArchived?: boolean
    }>(request)

    if (!body || !body.name) return errorResponse('Name is required', 400)
    if (!body.classId) return errorResponse('classId is required', 400)

    const classItem = await prisma.class.findFirst({ where: { id: body.classId, userId } })
    if (!classItem) return errorResponse('Class not found', 404)

    const student = await prisma.student.create({
      data: {
        name: body.name, classId: body.classId,
        isKeyStudent: body.isKeyStudent ?? false, retestList: body.retestList ?? '[]',
        testAccuracy: body.testAccuracy ?? '', quizCompletion: body.quizCompletion ?? '[]',
        notes: body.notes ?? '', assessments: body.assessments ?? '[]',
        quizzes: body.quizzes ?? '[]', isArchived: body.isArchived ?? false, userId,
      },
      include: { class: { select: { id: true, name: true } } },
    })

    return successResponse(student, 201)
  } catch (error) {
    console.error('Students POST error:', error)
    return errorResponse('Failed to create student', 500)
  }
}
