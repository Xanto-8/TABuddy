import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTokenUser, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-guard'

function parseScore(score: string): { score: number; total: number } | null {
  const trimmed = score.trim()
  const fractionMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (fractionMatch) {
    const s = parseFloat(fractionMatch[1])
    const t = parseFloat(fractionMatch[2])
    if (t > 0) return { score: s, total: t }
  }
  const percentMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*%$/)
  if (percentMatch) {
    const p = parseFloat(percentMatch[1])
    return { score: p, total: 100 }
  }
  const numberMatch = trimmed.match(/^(\d+(?:\.\d+)?)$/)
  if (numberMatch) {
    const n = parseFloat(numberMatch[1])
    return { score: n, total: 100 }
  }
  return null
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

    const quizRecords = await prisma.quizRecord.findMany({
      where: { userId: classItem.userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const classQuizRecords = quizRecords.filter(r => r.studentName && r.studentName.trim())

    const quizStats = classQuizRecords.map(r => {
      const parsed = parseScore(r.score)
      return {
        id: r.id,
        studentName: r.studentName,
        courseName: r.courseName,
        score: r.score,
        accuracy: parsed ? Math.round((parsed.score / parsed.total) * 100) : null,
        date: r.date,
        type: r.type,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
      }
    })

    const accuracyValues = quizStats.filter(r => r.accuracy !== null).map(r => r.accuracy as number)
    const avgAccuracy = accuracyValues.length > 0
      ? Math.round(accuracyValues.reduce((a, b) => a + b, 0) / accuracyValues.length)
      : null

    const feedbackRecords = await prisma.feedbackRecord.findMany({
      where: { userId: classItem.userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const classFeedbackRecords = feedbackRecords
      .filter(r => r.studentName && r.studentName.trim())
      .map(r => ({
        id: r.id,
        studentName: r.studentName,
        courseName: r.courseName,
        content: r.content,
        date: r.date,
        type: r.type,
        createdAt: r.createdAt.toISOString(),
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
