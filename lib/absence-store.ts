import { AbsenceRecord } from '@/types'
import { getCache, isCacheLoaded, triggerSync } from './store'

let localFallback: AbsenceRecord[] = []

function getLocalAbsences(): AbsenceRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('tabuddy_absences')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveLocalAbsences(records: AbsenceRecord[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tabuddy_absences', JSON.stringify(records))
  } catch { }
}

export function getAbsenceRecords(): AbsenceRecord[] {
  if (isCacheLoaded()) {
    return getCache().absenceRecords
  }
  const local = getLocalAbsences()
  localFallback = local
  return local
}

export function addAbsenceRecord(record: AbsenceRecord): void {
  if (isCacheLoaded()) {
    getCache().absenceRecords.push(record)
    triggerSync()
  } else {
    localFallback.push(record)
    saveLocalAbsences(localFallback)
  }
}

export function updateAbsenceRecord(updated: AbsenceRecord): void {
  if (isCacheLoaded()) {
    const records = getCache().absenceRecords
    const index = records.findIndex(r => r.classId === updated.classId && r.date === updated.date)
    if (index !== -1) {
      records[index] = updated
      triggerSync()
    }
  } else {
    const index = localFallback.findIndex(r => r.classId === updated.classId && r.date === updated.date)
    if (index !== -1) {
      localFallback[index] = updated
      saveLocalAbsences(localFallback)
    }
  }
}

export function deleteAbsenceRecord(classId: string, date: string): void {
  if (isCacheLoaded()) {
    const records = getCache().absenceRecords
    const index = records.findIndex(r => r.classId === classId && r.date === date)
    if (index !== -1) {
      records.splice(index, 1)
      triggerSync()
    }
  } else {
    const index = localFallback.findIndex(r => r.classId === classId && r.date === date)
    if (index !== -1) {
      localFallback.splice(index, 1)
      saveLocalAbsences(localFallback)
    }
  }
}

export function isStudentAbsent(classId: string, date: string, studentId: string): boolean
export function isStudentAbsent(studentId: string): boolean
export function isStudentAbsent(classIdOrStudent: string, date?: string, studentId?: string): boolean {
  const records = getAbsenceRecords()
  if (date && studentId) {
    const record = records.find(r => r.classId === classIdOrStudent && r.date === date)
    return record ? record.studentIds.includes(studentId) : false
  }
  const sid = classIdOrStudent
  return records.some(r => r.studentIds.includes(sid))
}

export function getAbsentStudentIds(classId: string, date: string): string[] {
  const records = getAbsenceRecords()
  const record = records.find(r => r.classId === classId && r.date === date)
  return record ? record.studentIds : []
}

export function setAbsentStudents(classId: string, date: string, studentIds: string[]): void {
  const records = getAbsenceRecords()
  const existing = records.find(r => r.classId === classId && r.date === date)
  if (existing) {
    existing.studentIds = studentIds
    existing.updatedAt = new Date()
    updateAbsenceRecord(existing)
  } else {
    addAbsenceRecord({ classId, date, studentIds, updatedAt: new Date() })
  }
}
