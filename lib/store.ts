'use client'

import { Class, Student, ClassType, ClassSchedule, CourseTask, CourseTaskTemplate, HomeworkAssessment, QuizRecord, ClassOverallAccuracy, FeedbackRecord, NotificationItem, PushLogEntry, ReminderSentRecord, ReminderType, PushStatus, UserFeedback, AbsenceRecord, WorkflowTemplate, WorkflowTodo } from '@/types'

export type RecordType = 'homework' | 'quiz' | 'feedback' | 'attendance' | 'other'

export interface ClassRecord {
  id: string
  classId: string
  studentId: string
  type: RecordType
  content: string
  score?: number
  totalScore?: number
  createdAt: Date
  createdBy: string
}

export type ResourceType = 'document' | 'link' | 'file' | 'image' | 'other'

export interface ClassResource {
  id: string
  classId: string
  title: string
  type: ResourceType
  url: string
  description?: string
  fileName?: string
  fileSize?: number
  originalName?: string
  createdAt: Date
  createdBy: string
}

// ========== 内存数据缓存 ==========
interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: 'link' | 'template' | 'document' | 'info'
  url?: string
  priority: number
}

interface DataCache {
  classes: Class[]
  students: Student[]
  records: ClassRecord[]
  resources: ClassResource[]
  schedules: ClassSchedule[]
  courseTasks: CourseTask[]
  templates: CourseTaskTemplate[]
  lessonProgress: Record<string, Record<string, number>>
  homeworkAssessments: HomeworkAssessment[]
  quizRecords: QuizRecord[]
  accuracyRecords: ClassOverallAccuracy[]
  feedbackHistory: FeedbackRecord[]
  notifications: NotificationItem[]
  pushLogs: PushLogEntry[]
  remindersSent: ReminderSentRecord[]
  markedDays: Record<string, Record<string, true>>
  deletedScheduleDates: Record<string, string[]>
  customClassTypes: ClassType[]
  knowledgeEntries: KnowledgeEntry[]
  workflowTemplates: WorkflowTemplate[]
  workflowTodos: WorkflowTodo[]
  absenceRecords: AbsenceRecord[]
  userFeedbacks: UserFeedback[]
  boundTeachers: { id: string; username: string; displayName: string }[]
}

const cache: DataCache = {
  classes: [],
  students: [],
  records: [],
  resources: [],
  schedules: [],
  courseTasks: [],
  templates: [],
  lessonProgress: {},
  homeworkAssessments: [],
  quizRecords: [],
  accuracyRecords: [],
  feedbackHistory: [],
  notifications: [],
  pushLogs: [],
  remindersSent: [],
  markedDays: {},
  deletedScheduleDates: {},
  customClassTypes: [],
  knowledgeEntries: [],
  workflowTemplates: [],
  workflowTodos: [],
  absenceRecords: [],
  userFeedbacks: [],
  boundTeachers: [],
}

let cacheLoaded = false

// 导出缓存访问函数供其他 store 使用
export function getCache(): DataCache {
  return cache
}

export function isCacheLoaded(): boolean {
  return cacheLoaded
}

export function triggerSync(): void {
  debouncedSyncStore()
}

// ========== 认证工具 ==========
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('tabuddy_auth_token')
  } catch {
    return null
  }
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (!token) return {}
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ========== 从 API 加载所有数据 ==========
export async function loadAllDataFromAPI(): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) {
      cacheLoaded = false
      return
    }

    const response = await fetch('/api/data/bulk', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!response.ok) throw new Error(`API error: ${response.status}`)
    const result = await response.json()
    const data = result.data

    cache.classes = data.classes || []
    cache.students = data.students || []
    cache.schedules = data.classSchedules || []
    cache.boundTeachers = data.boundTeachers || []

    const store: Record<string, unknown> = data.storeData || {}
    cache.records = (store.records as ClassRecord[]) || []
    cache.resources = (store.resources as ClassResource[]) || []
    cache.courseTasks = (store.courseTasks as CourseTask[]) || []
    cache.templates = (store.templates as CourseTaskTemplate[]) || []
    cache.lessonProgress = (store.lessonProgress as Record<string, Record<string, number>>) || {}
    cache.homeworkAssessments = (store.homeworkAssessments as HomeworkAssessment[]) || []
    cache.quizRecords = (store.quizRecords as QuizRecord[]) || []
    cache.accuracyRecords = (store.accuracyRecords as ClassOverallAccuracy[]) || []
    cache.feedbackHistory = (store.feedbackHistory as FeedbackRecord[]) || []
    cache.notifications = (store.notifications as NotificationItem[]) || []
    cache.pushLogs = (store.pushLogs as PushLogEntry[]) || []
    cache.remindersSent = (store.remindersSent as ReminderSentRecord[]) || []
    cache.markedDays = (store.markedDays as Record<string, Record<string, true>>) || {}
    cache.deletedScheduleDates = (store.deletedScheduleDates as Record<string, string[]>) || {}
    cache.customClassTypes = (store.customClassTypes as ClassType[]) || []
    cache.knowledgeEntries = (store.knowledgeEntries as KnowledgeEntry[]) || []
    cache.workflowTemplates = (store.workflowTemplates as WorkflowTemplate[]) || []
    cache.workflowTodos = (store.workflowTodos as WorkflowTodo[]) || []
    cache.absenceRecords = (store.absenceRecords as AbsenceRecord[]) || []
    cache.userFeedbacks = (store.userFeedbacks as UserFeedback[]) || []

    cacheLoaded = true
  } catch (error) {
    console.error('loadAllDataFromAPI failed:', error)
    cacheLoaded = false
  }
}

async function syncStoreToAPI(): Promise<void> {
  try {
    const token = getAuthToken()
    if (!token) return

    const storeData = {
      records: cache.records,
      resources: cache.resources,
      courseTasks: cache.courseTasks,
      templates: cache.templates,
      lessonProgress: cache.lessonProgress,
      homeworkAssessments: cache.homeworkAssessments,
      quizRecords: cache.quizRecords,
      accuracyRecords: cache.accuracyRecords,
      feedbackHistory: cache.feedbackHistory,
      notifications: cache.notifications,
      pushLogs: cache.pushLogs,
      remindersSent: cache.remindersSent,
      markedDays: cache.markedDays,
      deletedScheduleDates: cache.deletedScheduleDates,
      customClassTypes: cache.customClassTypes,
      knowledgeEntries: cache.knowledgeEntries,
      workflowTemplates: cache.workflowTemplates,
      workflowTodos: cache.workflowTodos,
      absenceRecords: cache.absenceRecords,
      userFeedbacks: cache.userFeedbacks,
    }

    await fetch('/api/data/store', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ key: 'appStore', value: storeData }),
    })
  } catch (error) {
    console.error('syncStoreToAPI failed:', error)
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
function debouncedSyncStore(): void {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => { syncStoreToAPI() }, 500)
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

// ========== 班级 (Classes) ==========

export function getClasses(): Class[] {
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
  const newClass = result.data as Class
  if (newClass && newClass.id) {
    const existing = cache.classes.find(c => c.id === newClass.id)
    if (!existing) cache.classes.push(newClass)
  }
  return newClass
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
      if (idx !== -1) cache.classes[idx] = serverClass
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

// ========== 学生 (Students) ==========

export function getStudents(): Student[] {
  return cache.students
}

export function getStudentsByClass(classId: string): Student[] {
  return cache.students.filter((s) => s.classId === classId)
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

export function saveStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student {
  const newStudent: Student = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
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

// ========== 班级类型标签/颜色 ==========

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

// ========== 自定义班级类型 ==========

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

// ========== 班级记录 (Records) ==========

export function getRecordsByClass(classId: string): ClassRecord[] {
  return cache.records.filter((r) => r.classId === classId)
}

export function saveRecord(data: Omit<ClassRecord, 'id' | 'createdAt'>): ClassRecord {
  const newRecord: ClassRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  cache.records.push(newRecord)
  debouncedSyncStore()
  return newRecord
}

export function deleteRecord(id: string): boolean {
  const filtered = cache.records.filter((r) => r.id !== id)
  if (filtered.length === cache.records.length) return false
  cache.records = filtered
  debouncedSyncStore()
  return true
}

export function getRecordTypeLabel(type: RecordType): string {
  const labels: Record<RecordType, string> = {
    homework: '作业',
    quiz: '小测',
    feedback: '反馈',
    attendance: '考勤',
    other: '其他',
  }
  return labels[type]
}

export function getRecordTypeIcon(type: RecordType): string {
  const icons: Record<RecordType, string> = {
    homework: '📝',
    quiz: '📊',
    feedback: '💬',
    attendance: '✅',
    other: '📌',
  }
  return icons[type]
}

// ========== 班级资源 (Resources) ==========

export function getResourcesByClass(classId: string): ClassResource[] {
  return cache.resources.filter((r) => r.classId === classId)
}

export function saveResource(data: Omit<ClassResource, 'id' | 'createdAt'>): ClassResource {
  const newResource: ClassResource = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  cache.resources.push(newResource)
  debouncedSyncStore()
  return newResource
}

export function deleteResource(id: string): boolean {
  const filtered = cache.resources.filter((r) => r.id !== id)
  if (filtered.length === cache.resources.length) return false
  cache.resources = filtered
  debouncedSyncStore()
  return true
}

export function updateResource(id: string, data: Partial<Omit<ClassResource, 'id' | 'createdAt' | 'createdBy'>>): ClassResource | null {
  const index = cache.resources.findIndex((r) => r.id === id)
  if (index === -1) return null
  cache.resources[index] = { ...cache.resources[index], ...data }
  debouncedSyncStore()
  return cache.resources[index]
}

export function getResourceTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    document: '文档',
    link: '链接',
    file: '文件',
    image: '图片',
    other: '其他',
  }
  return labels[type]
}

export function getResourceTypeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    document: '📄',
    link: '🔗',
    file: '📎',
    image: '🖼️',
    other: '📌',
  }
  return icons[type]
}

// ========== 班级上课时间 (Schedules) ==========

export function getBoundTeachers(): { id: string; username: string; displayName: string }[] {
  return cache.boundTeachers
}

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
  const newSchedule = result.data as ClassSchedule
  if (newSchedule && newSchedule.id) {
    const existing = cache.schedules.find(s => s.id === newSchedule.id)
    if (!existing) cache.schedules.push(newSchedule)
  }
  return newSchedule
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
  saveClassScheduleAsync(data).catch(console.error)
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

// ========== 课程反馈历史 (FeedbackRecord) ==========

export function getFeedbackHistory(): FeedbackRecord[] {
  return [...cache.feedbackHistory].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getFeedbackHistoryByStudent(studentId: string): FeedbackRecord[] {
  return getFeedbackHistory().filter((r) => r.studentId === studentId)
}

export function saveFeedbackHistory(data: Omit<FeedbackRecord, 'id' | 'createdAt'>): FeedbackRecord {
  const newRecord: FeedbackRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  cache.feedbackHistory.unshift(newRecord)
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return newRecord
}

export function deleteFeedbackHistory(id: string): boolean {
  const filtered = cache.feedbackHistory.filter((r) => r.id !== id)
  if (filtered.length === cache.feedbackHistory.length) return false
  cache.feedbackHistory = filtered
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return true
}

export function clearFeedbackHistory(): boolean {
  cache.feedbackHistory = []
  debouncedSyncStore()
  return true
}

// ========== 打卡提醒通知系统 ==========

export function getNotifications(): NotificationItem[] {
  return cache.notifications
}

export function getUnreadNotifications(): NotificationItem[] {
  return cache.notifications.filter(n => !n.read && !n.dismissed)
}

export function getActiveNotifications(): NotificationItem[] {
  return cache.notifications.filter(n => !n.dismissed && !n.completed)
}

export function addNotification(data: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'dismissed' | 'completed'>): NotificationItem {
  const newNotification: NotificationItem = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    read: false,
    dismissed: false,
    completed: false,
  }
  cache.notifications.unshift(newNotification)
  debouncedSyncStore()
  return newNotification
}

export function markNotificationRead(id: string): void {
  const index = cache.notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    cache.notifications[index].read = true
    debouncedSyncStore()
  }
}

export function markNotificationCompleted(id: string): void {
  const index = cache.notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    cache.notifications[index].completed = true
    cache.notifications[index].read = true
    debouncedSyncStore()
  }
}

export function dismissNotification(id: string): void {
  const index = cache.notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    cache.notifications[index].dismissed = true
    cache.notifications[index].read = true
    debouncedSyncStore()
  }
}

export function dismissAllActiveNotifications(): void {
  let updated = false
  cache.notifications.forEach(n => {
    if (!n.dismissed) {
      n.dismissed = true
      n.read = true
      updated = true
    }
  })
  if (updated) {
    debouncedSyncStore()
  }
}

export function markNotificationsCompletedByClass(classId: string): void {
  let updated = false
  cache.notifications.forEach(n => {
    if (n.classId === classId && !n.completed) {
      n.completed = true
      n.read = true
      updated = true
    }
  })
  if (updated) {
    debouncedSyncStore()
  }
}

// ========== 推送日志 ==========

export function getPushLogs(): PushLogEntry[] {
  return cache.pushLogs
}

export function addPushLog(data: Omit<PushLogEntry, 'id' | 'createdAt'>): PushLogEntry {
  const newLog: PushLogEntry = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  cache.pushLogs.unshift(newLog)
  debouncedSyncStore()
  return newLog
}

export function getTodayPushLogs(): PushLogEntry[] {
  const today = new Date().toISOString().split('T')[0]
  return cache.pushLogs.filter(log => {
    const logDate = new Date(log.createdAt).toISOString().split('T')[0]
    return logDate === today
  })
}

// ========== 提醒去重记录 ==========

export function getRemindersSent(): ReminderSentRecord[] {
  return cache.remindersSent
}

export function hasReminderBeenSent(scheduleId: string, reminderType: ReminderType): boolean {
  const today = new Date().toISOString().split('T')[0]
  return cache.remindersSent.some(
    r => r.scheduleId === scheduleId && r.reminderType === reminderType && r.sentAt === today
  )
}

export function markReminderSent(scheduleId: string, classId: string, reminderType: ReminderType): void {
  const today = new Date().toISOString().split('T')[0]
  cache.remindersSent.push({ scheduleId, classId, reminderType, sentAt: today })
  debouncedSyncStore()
}

export function clearExpiredReminderRecords(): void {
  const today = new Date().toISOString().split('T')[0]
  cache.remindersSent = cache.remindersSent.filter(r => r.sentAt === today)
  debouncedSyncStore()
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
