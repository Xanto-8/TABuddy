import { NextRequest } from 'next/server'
import { getUserIdFromRequest, errorResponse, successResponse, getBody } from '@/lib/api-data-utils'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { id } = params
    const student = await prisma.student.findFirst({ where: { id, userId } })
    if (!student) return errorResponse('Student not found', 404)
    return successResponse(student)
  } catch (error) {
    console.error('Student GET error:', error)
    return errorResponse('Failed to fetch student', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { id } = params
    const existing = await prisma.student.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Student not found', 404)

    const body = await getBody<{
      name?: string; classId?: string; isKeyStudent?: boolean
      retestList?: string; testAccuracy?: string; quizCompletion?: string
      notes?: string; assessments?: string; quizzes?: string; isArchived?: boolean
    }>(request)
    if (!body) return errorResponse('Request body is required', 400)

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.classId !== undefined && { classId: body.classId }),
        ...(body.isKeyStudent !== undefined && { isKeyStudent: body.isKeyStudent }),
        ...(body.retestList !== undefined && { retestList: body.retestList }),
        ...(body.testAccuracy !== undefined && { testAccuracy: body.testAccuracy }),
        ...(body.quizCompletion !== undefined && { quizCompletion: body.quizCompletion }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.assessments !== undefined && { assessments: body.assessments }),
        ...(body.quizzes !== undefined && { quizzes: body.quizzes }),
        ...(body.isArchived !== undefined && { isArchived: body.isArchived }),
      },
    })

    return successResponse(student)
  } catch (error) {
    console.error('Student PUT error:', error)
    return errorResponse('Failed to update student', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest(request)
    if (!userId) return errorResponse('Unauthorized', 401)

    const { id } = params
    const existing = await prisma.student.findFirst({ where: { id, userId } })
    if (!existing) return errorResponse('Student not found', 404)

    await prisma.student.delete({ where: { id } })
    return successResponse({ id, deleted: true })
  } catch (error) {
    console.error('Student DELETE error:', error)
    return errorResponse('Failed to delete student', 500)
  }
}
