'use client'

import { FeedbackRecord, NotificationItem, PushLogEntry, ReminderSentRecord, ReminderType, ObservationRecord } from '@/types'
import { cache, generateId, debouncedSyncStore } from './cache'
import { getStudentsByClass } from './students'

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

// ========== 随堂记录 (ObservationRecord) ==========

export function getObservationRecords(classId?: string, studentId?: string): ObservationRecord[] {
  let records = [...cache.observations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  if (classId) {
    const students = getStudentsByClass(classId)
    const studentIds = new Set(students.map(s => s.id))
    records = records.filter(r => studentIds.has(r.studentId))
  }
  if (studentId) {
    records = records.filter(r => r.studentId === studentId)
  }
  return records
}

export function saveObservationRecord(data: Omit<ObservationRecord, 'id' | 'createdAt'>): ObservationRecord {
  const newRecord: ObservationRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  cache.observations.push(newRecord)
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return newRecord
}

export function deleteObservationRecord(id: string): void {
  cache.observations = cache.observations.filter(r => r.id !== id)
  debouncedSyncStore()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
}
