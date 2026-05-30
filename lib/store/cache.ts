'use client'

import { Class, Student, ClassType, ClassSchedule, CourseTask, CourseTaskTemplate, HomeworkAssessment, QuizRecord, ClassOverallAccuracy, FeedbackRecord, NotificationItem, PushLogEntry, ReminderSentRecord, UserFeedback, AbsenceRecord, WorkflowTemplate, WorkflowTodo, ObservationRecord } from '@/types'

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
  folderId?: string
}

export interface DataCache {
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
  selectedTeacherId: string | null
  observations: ObservationRecord[]
}

export const cache: DataCache = {
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
  selectedTeacherId: null,
  observations: [],
}

let cacheLoaded = false
let cacheLoading = false

// 导出缓存访问函数供其他 store 使用
export function getCache(): DataCache {
  return cache
}

export function isCacheLoaded(): boolean {
  return cacheLoaded
}

export function isCacheLoading(): boolean {
  return cacheLoading
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

export function authHeaders(): Record<string, string> {
  const token = getAuthToken()
  if (!token) return {}
  return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
}

// ========== 从 API 加载所有数据 ==========
export async function loadAllDataFromAPI(): Promise<void> {
  cacheLoading = true
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
    cache.observations = (store.observations as ObservationRecord[]) || []

    cacheLoaded = true

    restoreFromLocalBackup()
    startAutoRefresh()
  } catch (error) {
    console.error('loadAllDataFromAPI failed:', error)
    cacheLoaded = false
  } finally {
    cacheLoading = false
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('appDataReady'))
    }
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
      observations: cache.observations,
    }

    await fetch('/api/data/store', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ key: 'appStore', value: storeData }),
      keepalive: true,
    })
  } catch (error) {
    console.error('syncStoreToAPI failed:', error)
  }
}

const LOCAL_BACKUP_KEY = 'tabuddy_store_backup'

function saveLocalBackup(): void {
  try {
    const backup = {
      timestamp: Date.now(),
      data: {
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
        observations: cache.observations,
      },
    }
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(backup))
  } catch {
    // localStorage might be full or unavailable; silently ignore
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
export function debouncedSyncStore(): void {
  saveLocalBackup()
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => { syncStoreToAPI() }, 500)
}

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null
let lastSaveTime = 0

export function markSaveInProgress(): void {
  lastSaveTime = Date.now()
}

export function startAutoRefresh(intervalMs: number = 30000): void {
  if (autoRefreshTimer) return
  autoRefreshTimer = setInterval(() => {
    if (Date.now() - lastSaveTime < 5000) return
    loadAllDataFromAPI()
  }, intervalMs)
}

export function stopAutoRefresh(): void {
  if (autoRefreshTimer) {
    clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }
}

function restoreFromLocalBackup(): void {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY)
    if (!raw) return

    const backup = JSON.parse(raw)
    if (!backup || !backup.data || typeof backup.timestamp !== 'number') {
      localStorage.removeItem(LOCAL_BACKUP_KEY)
      return
    }

    const saved = backup.data as Record<string, unknown>

    ;(Object.keys(saved) as Array<keyof typeof cache>).forEach((key) => {
      if (key === 'boundTeachers') return
      const savedVal = saved[key]
      if (Array.isArray(savedVal) && savedVal.length > 0 && Array.isArray(cache[key]) && (cache[key] as unknown[]).length === 0) {
        (cache as unknown as Record<string, unknown>)[key] = savedVal
      }
      if (!Array.isArray(savedVal) && typeof savedVal === 'object' && savedVal !== null && Object.keys(savedVal).length > 0
        && typeof cache[key] === 'object' && cache[key] !== null && Object.keys(cache[key] as unknown as Record<string, unknown>).length === 0) {
        (cache as unknown as Record<string, unknown>)[key] = savedVal
      }
    })

    localStorage.removeItem(LOCAL_BACKUP_KEY)
    debouncedSyncStore()
  } catch {
    localStorage.removeItem(LOCAL_BACKUP_KEY)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}
