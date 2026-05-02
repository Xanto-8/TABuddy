import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

function computeAccuracy(record: {
  wordScore?: number
  wordTotal?: number
  grammarScore?: number
  grammarTotal?: number
  grammarAccuracy?: number
  overallAccuracy?: number
}): number | null {
  if (record.overallAccuracy != null) return Math.round(record.overallAccuracy)
  if (record.grammarAccuracy != null) return Math.round(record.grammarAccuracy)
  const ws = record.wordScore
  const wt = record.wordTotal
  const gs = record.grammarScore
  const gt = record.grammarTotal
  let totalScore = 0
  let totalMax = 0
  if (ws != null && wt != null && wt > 0) { totalScore += ws; totalMax += wt }
  if (gs != null && gt != null && gt > 0) { totalScore += gs; totalMax += gt }
  if (totalMax > 0) return Math.round((totalScore / totalMax) * 100)
  return null
}

function formatScore(record: {
  wordScore?: number
  wordTotal?: number
  grammarScore?: number
  grammarTotal?: number
}): string {
  const parts: string[] = []
  if (record.wordScore != null && record.wordTotal != null) {
    parts.push(`词汇:${record.wordScore}/${record.wordTotal}`)
  }
  if (record.grammarScore != null && record.grammarTotal != null) {
    parts.push(`语法:${record.grammarScore}/${record.grammarTotal}`)
  }
  return parts.join(' ') || ''
}

function toDateStr(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenUser = getTokenUser(request)
    if (!tokenUser) return unauthorizedResponse()
    if (tokenUser.role !== 'campusadmin') return forbiddenResponse('仅校区班主任可访问')

    const classId = params.id

    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        user: { select: { id: true, displayName: true, username: true } },
        students: { select: { id: true, name: true, notes: true, createdAt: true } },
        schedules: { select: { id: true, dayOfWeek: true, startTime: true, endTime: true } },
      },
    })

    if (!classItem) {
      return NextResponse.json({ error: '班级不存在' }, { status: 404 })
    }

    const binds = await prisma.campusAdminBind.findMany({
      where: { campusAdminId: tokenUser.userId, status: 'active' },
      select: { classAdminId: true },
    })
    const boundClassAdminIds = binds.map(b => b.classAdminId)
    if (!boundClassAdminIds.includes(classItem.userId)) {
      return forbiddenResponse('您无权查看此班级的数据')
    }

    const studentMap = new Map(classItem.students.map(s => [s.id, s.name]))

    const classAdminStore = await prisma.userStore.findUnique({
      where: { userId_key: { userId: classItem.userId, key: 'appStore' } },
    })

    let storeQuizRecords: any[] = []
    let storeFeedbackHistory: any[] = []
    if (classAdminStore && classAdminStore.value) {
      try {
        const parsed = JSON.parse(classAdminStore.value)
        storeQuizRecords = parsed.quizRecords || []
        storeFeedbackHistory = parsed.feedbackHistory || []
      } catch {}
    }

    const filteredQuizRecords = storeQuizRecords
      .filter((r: any) => r && r.studentId && (r.completion || r.notes))
      .slice(0, 200)

    const quizStats = filteredQuizRecords.map((r: any) => {
      const accuracy = computeAccuracy(r)
      return {
        id: r.id,
        studentName: studentMap.get(r.studentId) || r.studentId,
        courseName: '',
        score: formatScore(r),
        accuracy,
        date: toDateStr(r.assessedAt || r.uploadedAt),
        type: r.completion || '',
        notes: r.notes || '',
        createdAt: typeof r.assessedAt === 'string' ? r.assessedAt : r.assessedAt?.toISOString?.() || new Date().toISOString(),
      }
    })

    const accuracyValues = quizStats.filter(r => r.accuracy !== null).map(r => r.accuracy as number)
    const avgAccuracy = accuracyValues.length > 0
      ? Math.round(accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length)
      : null

    const filteredFeedbackRecords = storeFeedbackHistory
      .filter((r: any) => r && r.studentName && r.generatedContent)
      .slice(0, 200)

    const classFeedbackRecords = filteredFeedbackRecords.map((r: any) => ({
      id: r.id,
      studentName: r.studentName,
      courseName: r.lesson || '',
      content: r.generatedContent,
      date: toDateStr(r.createdAt),
      type: r.overallGrade || '',
      createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.createdAt?.toISOString?.() || new Date().toISOString(),
    }))

    return NextResponse.json({
      data: {
        class: {
          id: classItem.id,
          name: classItem.name,
          type: classItem.type,
          studentCount: classItem.studentCount,
          color: classItem.color,
          createdAt: classItem.createdAt.toISOString(),
          description: classItem.courseTasks,
          classAdmin: {
            id: classItem.user.id,
            displayName: classItem.user.displayName,
            username: classItem.user.username,
          },
        },
        students: classItem.students.map(s => ({
          id: s.id,
          name: s.name,
          notes: s.notes,
          createdAt: s.createdAt.toISOString(),
        })),
        schedules: classItem.schedules.map(s => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
        quizRecords: quizStats,
        quizStats: {
          totalRecords: quizStats.length,
          avgAccuracy,
          highestAccuracy: accuracyValues.length > 0 ? Math.max(...accuracyValues) : null,
          lowestAccuracy: accuracyValues.length > 0 ? Math.min(...accuracyValues) : null,
        },
        feedbackRecords: classFeedbackRecords,
        feedbackStats: {
          totalRecords: classFeedbackRecords.length,
        },
      },
    })
  } catch (error) {
    console.error('[campus/class/[id]] error:', error)
    return NextResponse.json({ error: '获取班级详情失败' }, { status: 500 })
  }
}
