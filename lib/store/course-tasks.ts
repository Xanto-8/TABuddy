'use client'

import { CourseTask, CourseTaskTemplate } from '@/types'
import { cache, generateId, debouncedSyncStore } from './cache'
import { getStudentsByClass } from './students'
import { getClassSchedules } from './schedules'

// ========== 班级课时任务 (CourseTask) ==========

export function getCourseTasks(): CourseTask[] {
  return cache.courseTasks
}

export function getCourseTasksByClass(classId: string): CourseTask[] {
  return cache.courseTasks.filter((t) => t.classId === classId)
}

export function getCourseTasksByDate(date: string): CourseTask[] {
  return cache.courseTasks.filter((t) => t.date === date)
}

export function saveCourseTask(data: Omit<CourseTask, 'id' | 'createdAt' | 'updatedAt'>): CourseTask {
  const newTask: CourseTask = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  cache.courseTasks.push(newTask)
  debouncedSyncStore()
  return newTask
}

export function updateCourseTask(id: string, data: Partial<Omit<CourseTask, 'id' | 'createdAt'>>): CourseTask | null {
  const index = cache.courseTasks.findIndex((t) => t.id === id)
  if (index === -1) return null
  cache.courseTasks[index] = { ...cache.courseTasks[index], ...data, updatedAt: new Date() }
  debouncedSyncStore()
  return cache.courseTasks[index]
}

export function deleteCourseTask(id: string): boolean {
  const filtered = cache.courseTasks.filter((t) => t.id !== id)
  if (filtered.length === cache.courseTasks.length) return false
  cache.courseTasks = filtered
  debouncedSyncStore()
  return true
}

export function getTodayTaskStats(
  classId?: string,
  date?: string
): { total: number; completed: number; incomplete: number } {
  const dateStr = date || new Date().toISOString().split('T')[0]
  let todayTasks = getCourseTasksByDate(dateStr)
  if (classId) {
    todayTasks = todayTasks.filter((t) => t.classId === classId)
  }
  const completed = todayTasks.filter((t) => t.completed).length
  return {
    total: todayTasks.length,
    completed,
    incomplete: todayTasks.length - completed,
  }
}

// ========== 班级课时任务模板 (CourseTaskTemplate) ==========

export function getCourseTaskTemplates(): CourseTaskTemplate[] {
  return cache.templates
}

export function getCourseTaskTemplatesByClass(classId: string): CourseTaskTemplate[] {
  return cache.templates
    .filter((t) => t.classId === classId)
    .sort((a, b) => a.order - b.order)
}

export function saveCourseTaskTemplate(data: Omit<CourseTaskTemplate, 'id' | 'createdAt' | 'updatedAt'>): CourseTaskTemplate {
  const newTemplate: CourseTaskTemplate = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  cache.templates.push(newTemplate)
  debouncedSyncStore()
  return newTemplate
}

export function updateCourseTaskTemplate(id: string, data: Partial<Omit<CourseTaskTemplate, 'id' | 'createdAt'>>): CourseTaskTemplate | null {
  const index = cache.templates.findIndex((t) => t.id === id)
  if (index === -1) return null
  cache.templates[index] = { ...cache.templates[index], ...data, updatedAt: new Date() }
  debouncedSyncStore()
  return cache.templates[index]
}

export function deleteCourseTaskTemplate(id: string): boolean {
  const filtered = cache.templates.filter((t) => t.id !== id)
  if (filtered.length === cache.templates.length) return false
  cache.templates = filtered
  debouncedSyncStore()
  return true
}

// ========== 课时自动递增逻辑 ==========

export function initializeLessonProgress(): void {
  cache.courseTasks.forEach((t) => {
    if (!t.lesson) return
    if (!cache.lessonProgress[t.classId]) cache.lessonProgress[t.classId] = {}
    if (!(t.date in cache.lessonProgress[t.classId])) {
      const match = t.lesson.match(/(\d+)/)
      if (match) {
        cache.lessonProgress[t.classId][t.date] = parseInt(match[1], 10)
      }
    }
  })
}

export function getLessonForClassDate(classId: string, date: string): { number: number; label: string } {
  if (!cache.lessonProgress[classId]) cache.lessonProgress[classId] = {}
  if (!(date in cache.lessonProgress[classId])) {
    const existingNumbers = Object.values(cache.lessonProgress[classId])
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
    cache.lessonProgress[classId][date] = maxNumber + 1
    debouncedSyncStore()
  }
  const lessonNumber = cache.lessonProgress[classId][date]
  return {
    number: lessonNumber,
    label: `第${lessonNumber}课`,
  }
}

export function updateLessonProgress(classId: string, date: string, lessonNumber: number): { number: number; label: string } {
  if (!cache.lessonProgress[classId]) cache.lessonProgress[classId] = {}
  cache.lessonProgress[classId][date] = lessonNumber
  debouncedSyncStore()
  return {
    number: lessonNumber,
    label: `第${lessonNumber}课`,
  }
}

// ========== 任务实例生成与同步 ==========

export function getCourseTasksByClassAndDate(classId: string, date: string): CourseTask[] {
  return cache.courseTasks.filter((t) => t.classId === classId && t.date === date)
}

export function generateDailyInstances(classId: string, date: string): CourseTask[] {
  const templates = getCourseTaskTemplatesByClass(classId)
  if (templates.length === 0) {
    return getCourseTasksByClassAndDate(classId, date)
  }

  const existingTasks = getCourseTasksByClassAndDate(classId, date)
  const existingTemplateIds = new Set(
    existingTasks.filter((t) => t.templateId).map((t) => t.templateId)
  )

  const needsNew = templates.some((t) => !existingTemplateIds.has(t.id))
  if (!needsNew) {
    return getCourseTasksByClassAndDate(classId, date)
  }

  const lessonInfo = getLessonForClassDate(classId, date)
  let hasNew = false

  templates.forEach((template) => {
    if (!existingTemplateIds.has(template.id)) {
      cache.courseTasks.push({
        id: generateId(),
        classId,
        templateId: template.id,
        lesson: lessonInfo.label,
        title: template.title,
        content: template.content,
        date,
        completed: false,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      hasNew = true
    }
  })

  if (hasNew) {
    debouncedSyncStore()
  }

  return getCourseTasksByClassAndDate(classId, date)
}

export function ensureTodayInstancesForAllClasses(): void {
  initializeLessonProgress()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dayOfWeek = today.getDay()

  cache.classes.forEach((cls) => {
    const schedules = getClassSchedules(cls.id)
    if (schedules.some((s) => s.dayOfWeek === dayOfWeek)) {
      generateDailyInstances(cls.id, todayStr)
    }
  })
}

export function syncTemplateToFutureInstances(templateId: string): void {
  const template = cache.templates.find((t) => t.id === templateId)
  if (!template) return

  const todayStr = new Date().toISOString().split('T')[0]
  let hasUpdates = false

  cache.courseTasks = cache.courseTasks.map((t) => {
    if (t.templateId === templateId && t.date >= todayStr) {
      hasUpdates = true
      return { ...t, title: template.title, content: template.content, updatedAt: new Date() }
    }
    return t
  })

  if (hasUpdates) {
    debouncedSyncStore()
  }
}
