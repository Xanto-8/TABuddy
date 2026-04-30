'use client'

import type { AbsenceRecord } from '@/types'

const ABSENCE_KEY = 'tabuddy_absences'

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    return JSON.parse(stored, (_, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }
      return value
    })
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function getAbsenceRecords(): AbsenceRecord[] {
  return getFromStorage<AbsenceRecord[]>(ABSENCE_KEY, [])
}

export function getAbsentStudentIds(classId: string, date?: string): string[] {
  const records = getAbsenceRecords()
  const dateStr = date || new Date().toISOString().split('T')[0]
  const record = records.find((r) => r.classId === classId && r.date === dateStr)
  return record ? record.studentIds : []
}

export function isStudentAbsent(studentId: string, date?: string): boolean {
  const dateStr = date || new Date().toISOString().split('T')[0]
  const records = getAbsenceRecords()
  return records.some((r) => r.date === dateStr && r.studentIds.includes(studentId))
}

export function setAbsentStudents(
  classId: string,
  studentIds: string[],
  date?: string
): void {
  const dateStr = date || new Date().toISOString().split('T')[0]
  const records = getAbsenceRecords()
  const existingIndex = records.findIndex(
    (r) => r.classId === classId && r.date === dateStr
  )

  if (existingIndex !== -1) {
    if (studentIds.length === 0) {
      records.splice(existingIndex, 1)
    } else {
      records[existingIndex] = {
        ...records[existingIndex],
        studentIds,
        updatedAt: new Date(),
      }
    }
  } else if (studentIds.length > 0) {
    records.push({
      classId,
      date: dateStr,
      studentIds,
      updatedAt: new Date(),
    })
  }

  saveToStorage(ABSENCE_KEY, records)
  window.dispatchEvent(new Event('classDataChanged'))
  window.dispatchEvent(new Event('absenceChanged'))
}
