'use client'

import { getCache, generateId, debouncedSyncStore } from '../store'

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

// ========== 班级记录 (Records) ==========

export function getRecordsByClass(classId: string): ClassRecord[] {
  const cache = getCache()
  return cache.records.filter((r) => r.classId === classId)
}

export function saveRecord(data: Omit<ClassRecord, 'id' | 'createdAt'>): ClassRecord {
  const cache = getCache()
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
  const cache = getCache()
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
  const cache = getCache()
  return cache.resources.filter((r) => r.classId === classId)
}

export function saveResource(data: Omit<ClassResource, 'id' | 'createdAt'>): ClassResource {
  const cache = getCache()
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
  const cache = getCache()
  const filtered = cache.resources.filter((r) => r.id !== id)
  if (filtered.length === cache.resources.length) return false
  cache.resources = filtered
  debouncedSyncStore()
  return true
}

export function updateResource(id: string, data: Partial<Omit<ClassResource, 'id' | 'createdAt' | 'createdBy'>>): ClassResource | null {
  const cache = getCache()
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
