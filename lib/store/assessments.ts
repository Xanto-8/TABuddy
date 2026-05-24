'use client'

import { HomeworkAssessment, QuizRecord, ClassOverallAccuracy } from '@/types'
import { cache, generateId, debouncedSyncStore } from './cache'

// ========== 作业评估 (HomeworkAssessment) ==========

export function getHomeworkAssessments(): HomeworkAssessment[] {
  return cache.homeworkAssessments
}

export function getHomeworkAssessmentsByStudent(studentId: string): HomeworkAssessment[] {
  return cache.homeworkAssessments.filter((a) => a.studentId === studentId)
}

export function getHomeworkAssessmentsByClass(classId: string): HomeworkAssessment[] {
  const studentIds = new Set(cache.students.filter((s) => s.classId === classId).map((s) => s.id))
  return cache.homeworkAssessments.filter((a) => studentIds.has(a.studentId))
}

export function saveHomeworkAssessment(data: Omit<HomeworkAssessment, 'id' | 'assessedAt'>): HomeworkAssessment {
  const newAssessment: HomeworkAssessment = {
    ...data,
    id: generateId(),
    assessedAt: new Date(),
  }
  cache.homeworkAssessments.push(newAssessment)
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return newAssessment
}

export function updateHomeworkAssessment(id: string, data: Partial<Omit<HomeworkAssessment, 'id'>>): HomeworkAssessment | null {
  const index = cache.homeworkAssessments.findIndex((a) => a.id === id)
  if (index === -1) return null
  cache.homeworkAssessments[index] = { ...cache.homeworkAssessments[index], ...data, assessedAt: new Date() }
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return cache.homeworkAssessments[index]
}

export function deleteHomeworkAssessment(id: string): boolean {
  const filtered = cache.homeworkAssessments.filter((a) => a.id !== id)
  if (filtered.length === cache.homeworkAssessments.length) return false
  cache.homeworkAssessments = filtered
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return true
}

// ========== 小测记录 (QuizRecord) ==========

export function getQuizRecords(): QuizRecord[] {
  return cache.quizRecords
}

export function getQuizRecordsByStudent(studentId: string): QuizRecord[] {
  return cache.quizRecords.filter((r) => r.studentId === studentId)
}

export function getQuizRecordsByClass(classId: string): QuizRecord[] {
  return cache.quizRecords.filter((r) => r.classId === classId)
}

export function saveQuizRecord(data: Omit<QuizRecord, 'id' | 'uploadedAt' | 'assessedAt'>): QuizRecord {
  const now = new Date()
  const newRecord: QuizRecord = {
    ...data,
    id: generateId(),
    uploadedAt: now,
    assessedAt: now,
  }
  cache.quizRecords.push(newRecord)
  debouncedSyncStore()
  return newRecord
}

export function updateQuizRecord(id: string, data: Partial<Omit<QuizRecord, 'id'>>): QuizRecord | null {
  const index = cache.quizRecords.findIndex((r) => r.id === id)
  if (index === -1) return null
  cache.quizRecords[index] = { ...cache.quizRecords[index], ...data, assessedAt: new Date() }
  debouncedSyncStore()
  return cache.quizRecords[index]
}

export function deleteQuizRecord(id: string): boolean {
  const filtered = cache.quizRecords.filter((r) => r.id !== id)
  if (filtered.length === cache.quizRecords.length) return false
  cache.quizRecords = filtered
  debouncedSyncStore()
  return true
}

// ========== 班级总正确率 (ClassOverallAccuracy) ==========

export function getAllOverallAccuracyRecords(): ClassOverallAccuracy[] {
  return cache.accuracyRecords
}

export function getClassOverallAccuracyRecords(classId: string): ClassOverallAccuracy[] {
  return cache.accuracyRecords
    .filter((r) => r.classId === classId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function computeAndSaveClassAccuracy(classId: string): void {
  const records = getQuizRecordsByClass(classId)
  let totalScoreSum = 0
  let totalSum = 0
  for (const r of records) {
    if (r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
      totalScoreSum += r.wordScore
      totalSum += r.wordTotal
    }
    if (r.grammarScore != null && r.grammarTotal != null && r.grammarTotal > 0) {
      totalScoreSum += r.grammarScore
      totalSum += r.grammarTotal
    }
  }
  if (totalSum === 0) return
  const overallAccuracy = Math.round((totalScoreSum / totalSum) * 1000) / 10

  const date = new Date().toISOString().split('T')[0]
  const existingIndex = cache.accuracyRecords.findIndex(
    (r) => r.classId === classId && r.date === date
  )
  const newRecord: ClassOverallAccuracy = {
    id: existingIndex >= 0 ? cache.accuracyRecords[existingIndex].id : (Date.now().toString(36) + Math.random().toString(36).substring(2, 8)),
    classId,
    date,
    overallAccuracy,
  }
  if (existingIndex >= 0) {
    cache.accuracyRecords[existingIndex] = newRecord
  } else {
    cache.accuracyRecords.push(newRecord)
  }
  debouncedSyncStore()
}
