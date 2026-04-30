import type { AgentAction, AgentResult, AgentHandler } from './types'
import { getStudents, getStudentsByClass, getClasses, getQuizRecords, saveQuizRecord, updateQuizRecord } from '@/lib/store'
import { getCurrentClassByTime } from '@/lib/store'
import type { CompletionStatus } from '@/types'

const RETEST_LIST_KEY = 'tabuddy_retest_list'

interface RetestEntry {
  id: string
  classId: string
  studentId: string
  studentName: string
  date: string
  notes?: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function getRetestEntries(): RetestEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(RETEST_LIST_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveRetestEntries(entries: RetestEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RETEST_LIST_KEY, JSON.stringify(entries))
  } catch (e) {
    console.error('Failed to save retest list:', e)
  }
}

function findClassByName(name: string) {
  const classes = getClasses()
  return classes.find(c => c.name.includes(name.trim()) || name.trim().includes(c.name))
}

function getTodayDateString(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const handleUpdateRetestList: AgentHandler = (action: AgentAction) => {
  const { retestStudents, className } = action.params
  const cls = className
    ? findClassByName(className)
    : getCurrentClassByTime()
  if (!cls) {
    return { success: false, message: '未找到对应的班级，请指定班级名称', syncTo: '', needMoreInfo: true, followUpQuestion: '您想为哪个班级录入重测名单呢？' }
  }
  if (!retestStudents || retestStudents.length === 0) {
    return { success: false, message: '请告诉我需要加入重测名单的学生姓名', syncTo: '', needMoreInfo: true, followUpQuestion: '哪些学生需要加入重测名单？请告知学生姓名' }
  }
  const todayStr = getTodayDateString()
  const existingEntries = getRetestEntries()
  const classStudents = getStudentsByClass(cls.id)
  const addedStudents: string[] = []
  const notFoundStudents: string[] = []
  for (const name of retestStudents) {
    const trimmedName = name.trim()
    if (!trimmedName) continue
    const student = classStudents.find(s => s.name.includes(trimmedName))
    if (student) {
      const alreadyExists = existingEntries.some(
        e => e.studentId === student.id && e.classId === cls.id && e.date === todayStr
      )
      if (!alreadyExists) {
        existingEntries.push({
          id: generateId(),
          classId: cls.id,
          studentId: student.id,
          studentName: student.name,
          date: todayStr,
        })
        addedStudents.push(student.name)
      }
    } else {
      notFoundStudents.push(trimmedName)
    }
  }
  if (addedStudents.length > 0) {
    saveRetestEntries(existingEntries)
    window.dispatchEvent(new Event('classDataChanged'))
  }
  let message = ''
  if (addedStudents.length > 0) {
    message = `已将 ${addedStudents.join('、')} 加入「${cls.name}」今日重测名单`
  }
  if (notFoundStudents.length > 0) {
    message += (message ? '\n' : '') + `未在班级中找到学生：${notFoundStudents.join('、')}`
  }
  if (!message) {
    message = `所选学生已在「${cls.name}」今日重测名单中，无需重复添加`
  }
  return {
    success: addedStudents.length > 0,
    message,
    syncTo: '重测名单',
  }
}

export const handleUpdateQuizCompletion: AgentHandler = (action: AgentAction) => {
  const { studentName, quizCompletion, className } = action.params
  if (!studentName) {
    const cls = className ? findClassByName(className) : getCurrentClassByTime()
    if (cls) {
      const todayStr = getTodayDateString()
      const todayRecords = getQuizRecords().filter(
        r => r.classId === cls.id && new Date(r.assessedAt).toISOString().split('T')[0] === todayStr
      )
      const completionSummary = todayRecords.map(r => {
        const student = getStudents().find(s => s.id === r.studentId)
        const statusMap: Record<string, string> = { completed: '已完成', partial: '部分完成', not_done: '未完成' }
        return `${student?.name || '未知'}: ${statusMap[r.completion] || r.completion}`
      }).join('\n')
      return {
        success: true,
        message: completionSummary
          ? `「${cls.name}」今日小测完成情况：\n${completionSummary}`
          : `「${cls.name}」今日暂无小测记录`,
        syncTo: '小测管理',
      }
    }
    return { success: false, message: '请指定需要更新小测状态的学生姓名', syncTo: '', needMoreInfo: true, followUpQuestion: '您想更新哪位学生的小测完成情况？' }
  }
  if (!quizCompletion) {
    return { success: false, message: '请告知小测完成状态（已完成/部分完成/未完成）', syncTo: '', needMoreInfo: true, followUpQuestion: '该学生的小测完成状态是？' }
  }
  const statusMap: Record<string, CompletionStatus> = {
    '已完成': 'completed',
    '完成': 'completed',
    '部分完成': 'partial',
    '部分': 'partial',
    '未完成': 'not_done',
    '没完成': 'not_done',
    '未做': 'not_done',
  }
  const status = statusMap[quizCompletion.trim()]
  if (!status) {
    return { success: false, message: `不支持的状态「${quizCompletion}」，请使用：已完成、部分完成、未完成`, syncTo: '' }
  }
  const student = getStudents().find(s => s.name.includes(studentName.trim()))
  if (!student) {
    return { success: false, message: `未找到学生「${studentName}」`, syncTo: '学生管理' }
  }
  const cls = className ? findClassByName(className) : getCurrentClassByTime()
  const classId = cls?.id || student.classId
  if (!classId) {
    return { success: false, message: '未找到对应的班级信息', syncTo: '' }
  }
  const todayStr = getTodayDateString()
  const existingRecords = getQuizRecords()
  const existingRecord = existingRecords.find(
    r => r.studentId === student.id && r.classId === classId && new Date(r.assessedAt).toISOString().split('T')[0] === todayStr
  )
  if (existingRecord) {
    updateQuizRecord(existingRecord.id, { completion: status })
  } else {
    saveQuizRecord({
      studentId: student.id,
      classId,
      completion: status,
      photos: [],
    })
  }
  window.dispatchEvent(new Event('classDataChanged'))
  const statusLabel = quizCompletion.trim()
  return {
    success: true,
    message: `已更新学生「${student.name}」今日小测状态为「${statusLabel}」`,
    syncTo: '小测管理',
  }
}

export const handleAddQuizNotes: AgentHandler = (action: AgentAction) => {
  const { quizNotes, className } = action.params
  if (!quizNotes) {
    return { success: false, message: '请告诉我需要备注的小测表现内容', syncTo: '', needMoreInfo: true, followUpQuestion: '您想备注什么内容呢？' }
  }
  const cls = className ? findClassByName(className) : getCurrentClassByTime()
  if (!cls) {
    return { success: false, message: '未找到对应的班级', syncTo: '' }
  }
  const todayStr = getTodayDateString()
  const todayRecords = getQuizRecords().filter(
    r => r.classId === cls.id && new Date(r.assessedAt).toISOString().split('T')[0] === todayStr
  )
  if (todayRecords.length === 0) {
    const students = getStudentsByClass(cls.id)
    if (students.length === 0) {
      return { success: false, message: `「${cls.name}」暂无学生数据`, syncTo: '小测管理' }
    }
    for (const student of students) {
      saveQuizRecord({
        studentId: student.id,
        classId: cls.id,
        completion: 'not_done',
        photos: [],
        notes: quizNotes.trim(),
      })
    }
  } else {
    for (const record of todayRecords) {
      const existingNotes = record.notes || ''
      const updatedNotes = existingNotes
        ? `${existingNotes}\n${quizNotes.trim()}`
        : quizNotes.trim()
      updateQuizRecord(record.id, { notes: updatedNotes })
    }
  }
  window.dispatchEvent(new Event('classDataChanged'))
  return {
    success: true,
    message: `已为「${cls.name}」今日小测添加备注：${quizNotes.trim()}`,
    syncTo: '小测管理',
  }
}

export function getRetestListByClass(classId: string): RetestEntry[] {
  return getRetestEntries().filter(e => e.classId === classId)
}
