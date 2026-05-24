'use client'

import { Student, ClassType } from '@/types'
import { cache, generateId, authHeaders } from './cache'

export type StudentSortBy = 'createdAt' | 'name_asc' | 'name_desc' | 'custom'
let _studentSortBy: StudentSortBy = 'createdAt'

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('tabuddy_student_sort_by') as StudentSortBy | null
  if (saved) _studentSortBy = saved
}

export function getStudentSortBy(): StudentSortBy {
  return _studentSortBy
}

export function setStudentSortBy(sortBy: StudentSortBy): void {
  _studentSortBy = sortBy
  if (typeof window !== 'undefined') {
    localStorage.setItem('tabuddy_student_sort_by', sortBy)
    window.dispatchEvent(new Event('studentSortChanged'))
  }
}

export function getStudentCustomOrder(classId: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(`tabuddy_student_order_${classId}`)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function setStudentCustomOrder(classId: string, studentIds: string[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`tabuddy_student_order_${classId}`, JSON.stringify(studentIds))
  }
}

function sortStudentsList(students: Student[], sortBy: StudentSortBy): Student[] {
  const sorted = [...students]
  switch (sortBy) {
    case 'createdAt':
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    case 'name_asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    case 'name_desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'))
    case 'custom': {
      const classId = sorted.length > 0 ? sorted[0].classId : ''
      const order = classId ? getStudentCustomOrder(classId) : []
      if (order.length === 0) return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      const orderMap = new Map(order.map((id, i) => [id, i]))
      return sorted.sort((a, b) => {
        const ai = orderMap.get(a.id)
        const bi = orderMap.get(b.id)
        if (ai === undefined && bi === undefined) return 0
        if (ai === undefined) return 1
        if (bi === undefined) return -1
        return ai - bi
      })
    }
    default:
      return sorted
  }
}

export function sortStudents(students: Student[], sortBy?: StudentSortBy): Student[] {
  return sortStudentsList(students, sortBy ?? _studentSortBy)
}

export function getStudents(): Student[] {
  return sortStudentsList(cache.students, _studentSortBy)
}

export function getStudentsByClass(classId: string): Student[] {
  return sortStudentsList(
    cache.students.filter((s) => s.classId === classId),
    _studentSortBy
  )
}

export async function saveStudentAsync(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<Student> {
  const response = await fetch('/api/data/students', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to save student')
  const result = await response.json()
  const newStudent = result.data as Student
  if (newStudent && newStudent.id) {
    const existing = cache.students.find(s => s.id === newStudent.id)
    if (!existing) cache.students.push(newStudent)
    if (newStudent.classId) {
      const classIndex = cache.classes.findIndex(c => c.id === newStudent.classId)
      if (classIndex !== -1) {
        cache.classes[classIndex].studentCount = cache.students.filter(s => s.classId === newStudent.classId).length
      }
    }
  }
  return newStudent
}

let _studentCreatedAtSeq = 0

export function saveStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student {
  _studentCreatedAtSeq++
  const newStudent: Student = {
    ...data,
    id: generateId(),
    createdAt: new Date(Date.now() + _studentCreatedAtSeq),
    updatedAt: new Date(),
  }
  cache.students.push(newStudent)
  if (data.classId) {
    const classIndex = cache.classes.findIndex((c) => c.id === data.classId)
    if (classIndex !== -1) {
      cache.classes[classIndex].studentCount = cache.students.filter((s) => s.classId === data.classId).length
      cache.classes[classIndex].updatedAt = new Date()
    }
  }
  saveStudentAsync(data).catch(console.error)
  return newStudent
}

export function updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'createdAt'>>): Student | null {
  const index = cache.students.findIndex((s) => s.id === id)
  if (index === -1) return null
  const oldClassId = cache.students[index].classId
  cache.students[index] = { ...cache.students[index], ...data, updatedAt: new Date() }
  const affectedClassIds = new Set([oldClassId, data.classId].filter(Boolean))
  affectedClassIds.forEach((classId) => {
    if (!classId) return
    const classIndex = cache.classes.findIndex((c) => c.id === classId)
    if (classIndex !== -1) {
      cache.classes[classIndex].studentCount = cache.students.filter((s) => s.classId === classId).length
      cache.classes[classIndex].updatedAt = new Date()
    }
  })
  fetch(`/api/data/students/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).catch(console.error)
  return cache.students[index]
}

export function addStudentToClass(studentId: string, classId: string, className: string): Student | null {
  return updateStudent(studentId, { classId, class: className })
}

export function deleteStudent(id: string): boolean {
  const student = cache.students.find((s) => s.id === id)
  const filtered = cache.students.filter((s) => s.id !== id)
  if (filtered.length === cache.students.length) return false
  cache.students = filtered
  if (student?.classId) {
    const classIndex = cache.classes.findIndex((c) => c.id === student.classId)
    if (classIndex !== -1) {
      cache.classes[classIndex].studentCount = cache.students.filter((s) => s.classId === student.classId).length
      cache.classes[classIndex].updatedAt = new Date()
    }
  }
  fetch(`/api/data/students/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).catch(console.error)
  return true
}
