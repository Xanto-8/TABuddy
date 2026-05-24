'use client'

import { Class, Student, ClassType, ClassSchedule } from '@/types'
import { cache, generateId, authHeaders, debouncedSyncStore } from './cache'
import { getClassSchedules, saveClassScheduleAsync } from './schedules'

export function getClasses(): Class[] {
  const selectedId = cache.selectedTeacherId
  if (selectedId) {
    return cache.classes.filter(c => c.userId === selectedId)
  }
  return cache.classes
}

export async function saveClassAsync(data: Omit<Class, 'id' | 'studentCount' | 'createdAt' | 'updatedAt'>): Promise<Class> {
  const response = await fetch('/api/data/classes', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to save class')
  const result = await response.json()
  return result.data as Class
}

export async function updateClassAsync(id: string, data: Partial<Omit<Class, 'id' | 'createdAt'>>): Promise<Class | null> {
  const response = await fetch(`/api/data/classes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) return null
  const result = await response.json()
  const updated = result.data as Class
  if (updated) {
    const index = cache.classes.findIndex(c => c.id === id)
    if (index !== -1) cache.classes[index] = updated
  }
  return updated
}

export async function deleteClassAsync(id: string): Promise<boolean> {
  const response = await fetch(`/api/data/classes/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!response.ok) return false
  cache.classes = cache.classes.filter(c => c.id !== id)
  cache.students = cache.students.map(s =>
    s.classId === id ? { ...s, classId: undefined } : s
  )
  return true
}

export function saveClass(data: Omit<Class, 'id' | 'studentCount' | 'createdAt' | 'updatedAt'>): Class {
  const newClass: Class = {
    ...data,
    id: generateId(),
    studentCount: 0,
    schedules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  cache.classes.push(newClass)
  saveClassAsync(data).then(serverClass => {
    if (serverClass && serverClass.id) {
      const idx = cache.classes.findIndex(c => c.id === newClass.id)
      if (idx !== -1) {
        cache.classes[idx] = serverClass
      }
      cache.schedules.forEach(s => {
        if (s.classId === newClass.id) {
          s.classId = serverClass.id
          saveClassScheduleAsync({
            classId: serverClass.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
          }).then(serverSchedule => {
            if (serverSchedule && serverSchedule.id) {
              const sIdx = cache.schedules.findIndex(s2 => s2.id === s.id)
              if (sIdx !== -1) {
                cache.schedules[sIdx] = serverSchedule
              }
              const cIdx = cache.classes.findIndex(c => c.id === serverClass.id)
              if (cIdx !== -1) {
                cache.classes[cIdx].schedules = getClassSchedules(serverClass.id)
              }
            }
          }).catch(console.error)
        }
      })
    }
  }).catch(console.error)
  return newClass
}

export function updateClass(id: string, data: Partial<Omit<Class, 'id' | 'createdAt'>>): Class | null {
  const index = cache.classes.findIndex((c) => c.id === id)
  if (index === -1) return null
  cache.classes[index] = { ...cache.classes[index], ...data, updatedAt: new Date() }
  updateClassAsync(id, data).catch(console.error)
  return cache.classes[index]
}

export function deleteClass(id: string): boolean {
  const filtered = cache.classes.filter((c) => c.id !== id)
  if (filtered.length === cache.classes.length) return false
  cache.classes = filtered
  cache.students = cache.students.map((s) =>
    s.classId === id ? { ...s, classId: undefined } : s
  )
  deleteClassAsync(id).catch(console.error)
  return true
}

export async function syncClassToTeachers(data: {
  classId: string
  name: string
  type?: string
  color?: string
  isArchived?: boolean
}): Promise<{ syncedTo: number; teachers: { id: string; displayName: string }[]; classIds: string[] } | null> {
  try {
    const response = await fetch('/api/data/classes/sync', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Sync failed' }))
      console.error('syncClassToTeachers failed:', err)
      return null
    }
    const result = await response.json()
    return result.data
  } catch (error) {
    console.error('syncClassToTeachers error:', error)
    return null
  }
}

export function getClassTypeLabel(type: ClassType): string {
  const labels: Record<string, string> = {
    GY: 'GY',
    KET: 'KET',
    PET: 'PET',
    FCE: 'FCE',
    CAE: 'CAE',
    CPE: 'CPE',
    OTHER: '其他',
  }
  return labels[type] ?? type
}

export function getClassTypeColor(type: ClassType): string {
  const colors: Record<string, string> = {
    GY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    KET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PET: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    FCE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    CAE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CPE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return colors[type] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
}

export const STANDARD_CLASS_TYPES: ClassType[] = ['GY', 'KET', 'PET', 'FCE', 'CAE', 'CPE', 'OTHER']

export function getCustomClassTypes(): ClassType[] {
  return cache.customClassTypes
}

export function addCustomClassType(type: string): void {
  const normalized = type.trim().toUpperCase()
  if (!normalized) return
  if (STANDARD_CLASS_TYPES.includes(normalized as ClassType)) return
  if (cache.customClassTypes.includes(normalized)) return
  cache.customClassTypes.push(normalized)
  debouncedSyncStore()
}

export function getAllClassTypeOptions(): { value: ClassType; label: string }[] {
  const standard = STANDARD_CLASS_TYPES.map(t => ({ value: t, label: getClassTypeLabel(t) }))
  const custom = getCustomClassTypes().map(t => ({ value: t, label: t }))
  return [...standard, ...custom]
}
