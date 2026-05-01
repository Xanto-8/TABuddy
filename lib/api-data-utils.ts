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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, displayName: true, role: true, avatar: true, settings: true, createdAt: true },
  })

  if (!user) {
    return {
      user: null,
      classes: [],
      students: [],
      classSchedules: [],
      courseTasks: [],
      taskTemplates: [],
      homeworkAssessments: [],
      quizRecords: [],
      feedbackRecords: [],
      feedbackHistory: [],
      absenceRecords: [],
      workflowTemplates: [],
      workflowTodos: [],
      notifications: [],
      pushLogs: [],
      reminderConfigs: [],
      knowledgeEntries: [],
    }
  }

  const isAssistant = user.role === 'assistant'
  let teacherIds: string[] = []

  if (isAssistant) {
    const binds = await prisma.teacherAssistantBind.findMany({
      where: { assistantId: userId, status: 'active' },
      select: { teacherId: true },
    })
    teacherIds = binds.map(b => b.teacherId)
  }

  const dataUserId = isAssistant && teacherIds.length > 0 ? undefined : userId
  const userIdFilter = dataUserId ? { userId: dataUserId } : undefined

  const teacherDataFilter = isAssistant && teacherIds.length > 0
    ? { userId: { in: teacherIds } }
    : (userIdFilter || { userId })

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
  ] = await Promise.all([
    prisma.class.findMany({ where: teacherDataFilter }),
    prisma.student.findMany({ where: teacherDataFilter }),
    prisma.classSchedule.findMany({ where: teacherDataFilter }),
    prisma.courseTask.findMany({ where: teacherDataFilter }),
    prisma.taskTemplate.findMany({ where: teacherDataFilter }),
    prisma.homeworkAssessment.findMany({ where: teacherDataFilter }),
    prisma.quizRecord.findMany({ where: teacherDataFilter }),
    prisma.feedbackRecord.findMany({ where: teacherDataFilter }),
    prisma.feedbackHistoryEntry.findMany({ where: teacherDataFilter }),
    prisma.absenceRecord.findMany({ where: teacherDataFilter }),
    prisma.workflowTemplate.findMany({ where: teacherDataFilter }),
    prisma.workflowTodo.findMany({ where: teacherDataFilter }),
    prisma.notification.findMany({ where: teacherDataFilter }),
    prisma.pushLog.findMany({ where: teacherDataFilter }),
    prisma.reminderConfig.findMany({ where: teacherDataFilter }),
    prisma.knowledgeBaseEntry.findMany({ where: teacherDataFilter }),
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
