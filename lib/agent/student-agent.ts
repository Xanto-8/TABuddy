import type { AgentAction, AgentResult, AgentHandler } from './types'
import { getStudents, updateStudent } from '@/lib/store'

const KEY_STUDENTS_KEY = 'tabuddy_key_students'

function getKeyStudents(): Record<string, { markedAt: string; reason?: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const data = localStorage.getItem(KEY_STUDENTS_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

function saveKeyStudents(data: Record<string, { markedAt: string; reason?: string }>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY_STUDENTS_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save key students:', e)
  }
}

function findStudentByName(name: string) {
  const students = getStudents()
  return students.find(s => s.name.includes(name.trim()))
}

export const handleMarkKeyStudent: AgentHandler = (action: AgentAction) => {
  const { studentName, reason } = action.params
  if (!studentName) {
    return { success: false, message: '请告诉我需要标记为重点关注的学生姓名', syncTo: '', needMoreInfo: true, followUpQuestion: '您想标记哪位学生呢？' }
  }
  const student = findStudentByName(studentName)
  if (!student) {
    return { success: false, message: `未找到学生「${studentName}」，请先确认学生姓名是否正确`, syncTo: '学生管理' }
  }
  const keyStudents = getKeyStudents()
  if (keyStudents[student.id]) {
    return { success: true, message: `学生「${student.name}」已被标记为重点关注学生，无需重复标记`, syncTo: '学生管理' }
  }
  keyStudents[student.id] = {
    markedAt: new Date().toISOString(),
    reason: reason || undefined,
  }
  saveKeyStudents(keyStudents)
  const existingNotes = student.notes || ''
  const markNote = existingNotes.includes('【重点关注】')
    ? existingNotes
    : existingNotes
      ? `${existingNotes}\n【重点关注】${reason ? `原因：${reason}` : ''}`
      : `【重点关注】${reason ? `原因：${reason}` : ''}`
  updateStudent(student.id, { notes: markNote })
  window.dispatchEvent(new Event('classDataChanged'))
  const reasonText = reason ? `（原因：${reason}）` : ''
  return {
    success: true,
    message: `已标记学生「${student.name}」为重点关注学生${reasonText}`,
    syncTo: '学生管理',
  }
}

export const handleUnmarkKeyStudent: AgentHandler = (action: AgentAction) => {
  const { studentName } = action.params
  if (!studentName) {
    return { success: false, message: '请告诉我需要取消重点标记的学生姓名', syncTo: '', needMoreInfo: true, followUpQuestion: '您想取消哪位学生的重点标记呢？' }
  }
  const student = findStudentByName(studentName)
  if (!student) {
    return { success: false, message: `未找到学生「${studentName}」`, syncTo: '学生管理' }
  }
  const keyStudents = getKeyStudents()
  if (!keyStudents[student.id]) {
    return { success: true, message: `学生「${student.name}」当前未被标记为重点关注学生`, syncTo: '学生管理' }
  }
  delete keyStudents[student.id]
  saveKeyStudents(keyStudents)
  const existingNotes = student.notes || ''
  const updatedNotes = existingNotes
    .split('\n')
    .filter(line => !line.includes('【重点关注】'))
    .join('\n')
  updateStudent(student.id, { notes: updatedNotes || undefined })
  window.dispatchEvent(new Event('classDataChanged'))
  return {
    success: true,
    message: `已取消学生「${student.name}」的重点关注标记`,
    syncTo: '学生管理',
  }
}

export function getKeyStudentsList() {
  const keyStudents = getKeyStudents()
  const students = getStudents()
  return Object.entries(keyStudents)
    .map(([studentId, data]) => {
      const student = students.find(s => s.id === studentId)
      if (!student) return null
      return {
        student,
        markedAt: data.markedAt,
        reason: data.reason,
      }
    })
    .filter(Boolean)
}
