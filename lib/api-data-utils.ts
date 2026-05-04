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
  let boundTeachers: { id: string; username: string; displayName: string }[] = []
  let assistantIds: string[] = []
  let boundAssistants: { id: string; username: string; displayName: string }[] = []

  if (isAssistant) {
    const binds = await prisma.teacherAssistantBind.findMany({
      where: { assistantId: userId, status: 'active' },
      include: {
        teacher: { select: { id: true, username: true, displayName: true } },
      },
    })
    teacherIds = binds.map(b => b.teacherId)
    boundTeachers = binds.map(b => b.teacher)
  } else {
    const binds = await prisma.teacherAssistantBind.findMany({
      where: { teacherId: userId, status: 'active' },
      include: {
        assistant: { select: { id: true, username: true, displayName: true } },
      },
    })
    assistantIds = binds.map(b => b.assistantId).filter((id): id is string => id !== null)
    boundAssistants = binds.map(b => b.assistant).filter((a): a is { id: string; username: string; displayName: string } => a !== null)
  }

  const allUserIds = isAssistant
    ? Array.from(new Set([...teacherIds, userId]))
    : Array.from(new Set([...assistantIds, userId]))

  const teacherDataFilter = { userId: { in: allUserIds } }

  // 班级管理员只看自己创建的班级
  // 助教端过滤掉同步给老师的班级副本（userId=老师ID 且 createdBy不为空 = 同步副本）
  // 保留助教自己的班级 和 老师自己创建的原始班级（createdBy为空）
  const classFilter = isAssistant
    ? { userId: { in: allUserIds }, OR: [{ userId: userId }, { createdBy: '' }] }
    : { userId: { in: [userId] } }

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
    prisma.class.findMany({ where: classFilter, include: { schedules: true } }),
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

  const studentCountMap = students.reduce((map, s) => {
    if (s.classId) {
      map[s.classId] = (map[s.classId] || 0) + 1
    }
    return map
  }, {} as Record<string, number>)

  const classesWithCount = classes.map(cls => ({
    ...cls,
    studentCount: studentCountMap[cls.id] || 0,
  }))

  return {
    user,
    classes: classesWithCount,
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
    ...(isAssistant && boundTeachers.length > 0 ? { boundTeachers } : {}),
    ...(!isAssistant && boundAssistants.length > 0 ? { boundAssistants } : {}),
  }
}
