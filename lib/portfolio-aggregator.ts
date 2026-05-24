'use client'

import {
  getHomeworkAssessmentsByStudent,
  getQuizRecordsByStudent,
} from './store/assessments'
import { getFeedbackHistoryByStudent, getObservationRecords } from './store/feedback'
import { getStudentsByClass } from './store/students'
import { getClasses } from './store/classes'
import { getCourseTasksByClass } from './store/course-tasks'
import { getClassSchedules } from './store/schedules'
import { getAbsenceRecords } from './absence-store'
import type { ClassType, HandwritingQuality, Class, FeedbackRecord } from '@/types'

export interface PortfolioQuizDetail {
  id: string
  date: string
  lessonLabel: string
  wordScore: number | null
  wordTotal: number | null
  wordAccuracy: number | null
  grammarScore: number | null
  grammarTotal: number | null
  grammarAccuracy: number | null
  overallAccuracy: number | null
  completion: string
  isAbsent: boolean
  notes?: string
}

export interface PortfolioData {
  studentName: string
  className: string
  classType: ClassType
  stats: {
    homeworkCount: number
    quizCount: number
    feedbackCount: number
    avgHomeworkAccuracy: number
    avgQuizWordAccuracy: number
    absenceCount: number
    totalLessons: number
  }
  quizDetails: PortfolioQuizDetail[]
  homeworkSummary: {
    total: number
    avgAccuracy: number
    latestAccuracy: number
    handwritingDistribution: Record<string, number>
  }
  quizSummary: {
    total: number
    avgWordAccuracy: number
    latestWordAccuracy: number
    wordScoreHistory: { date: string; score: number; total: number; accuracy: number }[]
  }
  allFeedbackContents: string[]
  observationContents: string[]
  courseTasks: { lesson: string; title: string; content: string }[]
}

function getLessonLabelForDate(classId: string, date: string): string {
  const tasks = getCourseTasksByClass(classId)
  const task = tasks.find(t => t.date === date)
  return task?.lesson || ''
}

function getStudentClasses(studentId: string): Class[] {
  const allClasses: Class[] = getClasses()
  return allClasses.filter((cls: Class) => {
    const students = getStudentsByClass(cls.id)
    return students.some(s => s.id === studentId)
  })
}

function getAbsenceDatesForStudent(studentId: string): string[] {
  const records = getAbsenceRecords()
  const dates: string[] = []
  for (const r of records) {
    if (r.studentIds.includes(studentId)) {
      dates.push(r.date)
    }
  }
  return dates.sort()
}

function countLessonsFromTasks(classId: string): number {
  const tasks = getCourseTasksByClass(classId)
  const lessons = new Set(tasks.map(t => t.lesson).filter(Boolean))
  return lessons.size || tasks.filter(t => t.lesson).length
}

function countTotalLessons(studentId: string): number {
  const studentClasses = getStudentClasses(studentId)
  let total = 0
  for (const cls of studentClasses) {
    total += countLessonsFromTasks(cls.id)
  }
  return total
}

export function aggregateStudentPortfolio(studentId: string): PortfolioData | null {
  const studentClasses = getStudentClasses(studentId)
  if (studentClasses.length === 0) return null

  const primaryClass = studentClasses[0]
  const students = getStudentsByClass(primaryClass.id)
  const student = students.find(s => s.id === studentId)
  if (!student) return null

  const homework = getHomeworkAssessmentsByStudent(studentId).filter(h => h.accuracy !== undefined)
  const quizzes = getQuizRecordsByStudent(studentId)
  const feedbacks = getFeedbackHistoryByStudent(studentId)
  const observations = getObservationRecords(undefined, studentId)
  const absenceDates = getAbsenceDatesForStudent(studentId)
  const totalLessons = countTotalLessons(studentId)

  const quizDetails: PortfolioQuizDetail[] = []
  const allDates = new Set<string>()
  for (const cls of studentClasses) {
    for (const t of getCourseTasksByClass(cls.id)) {
      if (t.date) allDates.add(t.date)
    }
  }

  for (const q of quizzes) {
    const date = q.assessedAt ? new Date(q.assessedAt).toISOString().slice(0, 10) : ''
    const wordAcc = q.wordScore != null && q.wordTotal != null && q.wordTotal > 0
      ? Math.round((q.wordScore / q.wordTotal) * 100)
      : null
    quizDetails.push({
      id: q.id,
      date,
      lessonLabel: getLessonLabelForDate(q.classId, date),
      wordScore: q.wordScore ?? null,
      wordTotal: q.wordTotal ?? null,
      wordAccuracy: wordAcc,
      grammarScore: q.grammarScore ?? null,
      grammarTotal: q.grammarTotal ?? null,
      grammarAccuracy: q.grammarAccuracy ?? null,
      overallAccuracy: q.overallAccuracy ?? null,
      completion: q.completion,
      isAbsent: absenceDates.includes(date),
      notes: q.notes,
    })
  }

  const absentDateSet = new Set(absenceDates)
  for (const d of absenceDates) {
    if (!quizDetails.some(q => q.date === d)) {
      quizDetails.push({
        id: `absent-${d}`,
        date: d,
        lessonLabel: '',
        wordScore: null,
        wordTotal: null,
        wordAccuracy: null,
        grammarScore: null,
        grammarTotal: null,
        grammarAccuracy: null,
        overallAccuracy: null,
        completion: 'not_done',
        isAbsent: true,
      })
    }
  }

  quizDetails.sort((a, b) => b.date.localeCompare(a.date))

  const validHomework = homework.filter(h => h.accuracy > 0 || h.completion !== 'not_done')
  const validQuizzes = quizzes.filter(q =>
    q.wordScore != null || q.grammarScore != null || q.overallAccuracy != null
  )

  const handwritingDist: Record<string, number> = {}
  for (const h of homework) {
    const q = h.handwriting || 'fair'
    handwritingDist[q] = (handwritingDist[q] || 0) + 1
  }

  const wordScoreHistory = quizzes
    .filter(q => q.wordScore != null && q.wordTotal != null && q.wordTotal > 0)
    .map(q => ({
      date: q.assessedAt ? new Date(q.assessedAt).toISOString().slice(0, 10) : '',
      score: q.wordScore!,
      total: q.wordTotal!,
      accuracy: Math.round((q.wordScore! / q.wordTotal!) * 100),
    }))
    .filter(h => h.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    studentName: student.name,
    className: primaryClass.name,
    classType: primaryClass.type as ClassType || 'OTHER',
    stats: {
      homeworkCount: validHomework.length,
      quizCount: validQuizzes.length,
      feedbackCount: feedbacks.length,
      avgHomeworkAccuracy: validHomework.length > 0
        ? Math.round(validHomework.reduce((s, h) => s + h.accuracy, 0) / validHomework.length)
        : 0,
      avgQuizWordAccuracy: wordScoreHistory.length > 0
        ? Math.round(wordScoreHistory.reduce((s, h) => s + h.accuracy, 0) / wordScoreHistory.length)
        : 0,
      absenceCount: absenceDates.length,
      totalLessons: Math.max(totalLessons, validQuizzes.length + absenceDates.length),
    },
    quizDetails,
    homeworkSummary: {
      total: validHomework.length,
      avgAccuracy: validHomework.length > 0
        ? Math.round(validHomework.reduce((s, h) => s + h.accuracy, 0) / validHomework.length)
        : 0,
      latestAccuracy: validHomework.length > 0
        ? validHomework[validHomework.length - 1].accuracy
        : 0,
      handwritingDistribution: handwritingDist,
    },
    quizSummary: {
      total: validQuizzes.length,
      avgWordAccuracy: wordScoreHistory.length > 0
        ? Math.round(wordScoreHistory.reduce((s, h) => s + h.accuracy, 0) / wordScoreHistory.length)
        : 0,
      latestWordAccuracy: wordScoreHistory.length > 0
        ? wordScoreHistory[wordScoreHistory.length - 1].accuracy
        : 0,
      wordScoreHistory,
    },
    allFeedbackContents: feedbacks.map(f => f.generatedContent || '').filter(Boolean),
    observationContents: observations.map(o => o.content).filter(Boolean),
    courseTasks: studentClasses.flatMap(cls =>
      getCourseTasksByClass(cls.id)
        .filter(t => t.lesson)
        .map(t => ({ lesson: t.lesson, title: t.title, content: t.content }))
    ),
  }
}
