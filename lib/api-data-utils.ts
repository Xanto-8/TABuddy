import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth-utils'
import { prisma } from './prisma'

export function getUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const decoded = verifyToken(token)
  return decoded?.userId || null
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function successResponse(data: unknown, status: number = 200) {
  return NextResponse.json({ data }, { status })
}

export async function getBody<T>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function getAllUserData(userId: string) {
  const [
    classes,
    students,
    classSchedules,
    courseTasks,
    taskTemplates,
    homeworkAssessments,
    quizRecords,
    feedbackRecords,
    feedbackHistory,
    absenceRecords,
    workflowTemplates,
    workflowTodos,
    notifications,
    pushLogs,
    reminderConfigs,
    knowledgeEntries,
    user,
  ] = await Promise.all([
    prisma.class.findMany({ where: { userId } }),
    prisma.student.findMany({ where: { userId } }),
    prisma.classSchedule.findMany({ where: { userId } }),
    prisma.courseTask.findMany({ where: { userId } }),
    prisma.taskTemplate.findMany({ where: { userId } }),
    prisma.homeworkAssessment.findMany({ where: { userId } }),
    prisma.quizRecord.findMany({ where: { userId } }),
    prisma.feedbackRecord.findMany({ where: { userId } }),
    prisma.feedbackHistoryEntry.findMany({ where: { userId } }),
    prisma.absenceRecord.findMany({ where: { userId } }),
    prisma.workflowTemplate.findMany({ where: { userId } }),
    prisma.workflowTodo.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId } }),
    prisma.pushLog.findMany({ where: { userId } }),
    prisma.reminderConfig.findMany({ where: { userId } }),
    prisma.knowledgeBaseEntry.findMany({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { id: true, username: true, displayName: true, role: true, avatar: true, settings: true, createdAt: true } }),
  ])

  return {
    user,
    classes,
    students,
    classSchedules,
    courseTasks,
    taskTemplates,
    homeworkAssessments,
    quizRecords,
    feedbackRecords,
    feedbackHistory,
    absenceRecords,
    workflowTemplates,
    workflowTodos,
    notifications,
    pushLogs,
    reminderConfigs,
    knowledgeEntries,
  }
}
