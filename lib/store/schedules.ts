'use client'

import { Class, ClassSchedule } from '@/types'
import { cache, authHeaders, debouncedSyncStore, generateId } from './cache'

// ========== 绑定老师与切换 ==========

export function getBoundTeachers(): { id: string; username: string; displayName: string }[] {
  return cache.boundTeachers
}

export function getSelectedTeacherId(): string | null {
  return cache.selectedTeacherId
}

export function setSelectedTeacherId(teacherId: string | null): void {
  cache.selectedTeacherId = teacherId
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('classDataChanged'))
  }
}

export function getAllClasses(): Class[] {
  return cache.classes
}

// ========== 班级上课时间 (Schedules) ==========

export function getClassSchedules(classId: string): ClassSchedule[] {
  return cache.schedules.filter((s) => s.classId === classId)
}

export async function saveClassScheduleAsync(data: Omit<ClassSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ClassSchedule> {
  const response = await fetch('/api/data/class-schedules', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to save schedule')
  const result = await response.json()
  return result.data as ClassSchedule
}

export function saveClassSchedule(data: Omit<ClassSchedule, 'id' | 'createdAt' | 'updatedAt'>): ClassSchedule {
  const newSchedule: ClassSchedule = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  cache.schedules.push(newSchedule)
  const classIndex = cache.classes.findIndex((c) => c.id === data.classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(data.classId)
    cache.classes[classIndex] = { ...cache.classes[classIndex], schedules: classSchedules, updatedAt: new Date() }
  }
  saveClassScheduleAsync(data).then(serverSchedule => {
    if (serverSchedule && serverSchedule.id) {
      const idx = cache.schedules.findIndex(s => s.id === newSchedule.id)
      if (idx !== -1) {
        cache.schedules[idx] = serverSchedule
      }
    }
  }).catch(console.error)
  return newSchedule
}

export function updateClassSchedule(id: string, data: Partial<Omit<ClassSchedule, 'id' | 'createdAt'>>): ClassSchedule | null {
  const index = cache.schedules.findIndex((s) => s.id === id)
  if (index === -1) return null
  const updatedSchedule = { ...cache.schedules[index], ...data, updatedAt: new Date() }
  cache.schedules[index] = updatedSchedule
  const classId = cache.schedules[index].classId
  const classIndex = cache.classes.findIndex((c) => c.id === classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(classId)
    cache.classes[classIndex] = { ...cache.classes[classIndex], schedules: classSchedules, updatedAt: new Date() }
  }
  fetch(`/api/data/class-schedules/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  }).catch(console.error)
  return updatedSchedule
}

export function deleteClassSchedule(id: string): boolean {
  const scheduleIndex = cache.schedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return false
  const classId = cache.schedules[scheduleIndex].classId
  cache.schedules = cache.schedules.filter((s) => s.id !== id)
  const classIndex = cache.classes.findIndex((c) => c.id === classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(classId)
    cache.classes[classIndex] = { ...cache.classes[classIndex], schedules: classSchedules, updatedAt: new Date() }
  }
  fetch(`/api/data/class-schedules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  }).catch(console.error)
  return true
}

export function getCurrentClassByTime(): Class | null {
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const classes = cache.classes

  for (const classItem of classes) {
    const schedules = getClassSchedules(classItem.id)
    for (const schedule of schedules) {
      if (schedule.dayOfWeek === currentDay) {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
        const startTimeInMinutes = startHour * 60 + startMinute
        const endTimeInMinutes = endHour * 60 + endMinute
        if (currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes) {
          return classItem
        }
      }
    }
  }

  for (const classItem of classes) {
    const schedules = getClassSchedules(classItem.id)
    for (const schedule of schedules) {
      if (schedule.dayOfWeek === currentDay) {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
        const startTimeInMinutes = startHour * 60 + startMinute
        if (currentTime >= startTimeInMinutes - 10 && currentTime < startTimeInMinutes) {
          return classItem
        }
      }
    }
  }

  return null
}

export function getTodayClasses(): Class[] {
  const today = new Date().getDay()
  return cache.classes.filter((classItem) => {
    const schedules = getClassSchedules(classItem.id)
    return schedules.some((schedule) => schedule.dayOfWeek === today)
  }).sort((a, b) => {
    const aSchedules = getClassSchedules(a.id).filter(s => s.dayOfWeek === today)
    const bSchedules = getClassSchedules(b.id).filter(s => s.dayOfWeek === today)
    const aEarliest = aSchedules.sort((x, y) => x.startTime.localeCompare(y.startTime))[0]
    const bEarliest = bSchedules.sort((x, y) => x.startTime.localeCompare(y.startTime))[0]
    if (!aEarliest) return 1
    if (!bEarliest) return -1
    return aEarliest.startTime.localeCompare(bEarliest.startTime)
  })
}

// ========== 调课/补课标记 ==========

export function getMarkedDays(): Record<string, Record<string, true>> {
  return cache.markedDays
}

export function setMarkedDay(classId: string, date: string, isMarked: boolean): void {
  if (!cache.markedDays[classId]) cache.markedDays[classId] = {}
  if (isMarked) {
    cache.markedDays[classId][date] = true
  } else {
    delete cache.markedDays[classId][date]
    if (Object.keys(cache.markedDays[classId]).length === 0) {
      delete cache.markedDays[classId]
    }
  }
  debouncedSyncStore()
}

export function isMarkedDay(classId: string, date: string): boolean {
  return !!cache.markedDays[classId]?.[date]
}

export function isScheduleDayForClass(classId: string, date: string): boolean {
  const dateObj = new Date(date + 'T00:00:00')
  const dayOfWeek = dateObj.getDay()
  const schedules = getClassSchedules(classId)
  if (schedules.some((s) => s.dayOfWeek === dayOfWeek)) return true
  const cls = cache.classes.find((c) => c.id === classId)
  if (cls?.schedules && cls.schedules.length > 0) {
    return cls.schedules.some((s) => s.dayOfWeek === dayOfWeek)
  }
  return false
}

// ========== 已删除的课程安排日期追踪 ==========

export function getDeletedScheduleDates(classId: string): string[] {
  return cache.deletedScheduleDates[classId] || []
}

export function addDeletedScheduleDate(classId: string, date: string): void {
  if (!cache.deletedScheduleDates[classId]) cache.deletedScheduleDates[classId] = []
  if (!cache.deletedScheduleDates[classId].includes(date)) {
    cache.deletedScheduleDates[classId].push(date)
    debouncedSyncStore()
  }
}

export function removeDeletedScheduleDate(classId: string, date: string): void {
  if (cache.deletedScheduleDates[classId]) {
    cache.deletedScheduleDates[classId] = cache.deletedScheduleDates[classId].filter(d => d !== date)
    if (cache.deletedScheduleDates[classId].length === 0) delete cache.deletedScheduleDates[classId]
    debouncedSyncStore()
  }
}
