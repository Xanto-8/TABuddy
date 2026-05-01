import { getCache, isCacheLoaded, triggerSync } from './store'

export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: 'link' | 'template' | 'document' | 'info'
  url?: string
  priority: number
}

const STORAGE_KEY = 'tabuddy_knowledge_base'
const VERSION_KEY = 'tabuddy_knowledge_base_ver'
const CURRENT_VERSION = 2
let syncedOnceFromServer = false

const oldDefaultIds = new Set(['kb-1','kb-2','kb-3','kb-4','kb-5','kb-6','kb-7','kb-8','kb-9','kb-10','kb-11','kb-12'])

function migrateIfNeeded(): void {
  if (typeof window === 'undefined') return
  const ver = localStorage.getItem(VERSION_KEY)
  if (ver === String(CURRENT_VERSION)) return
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const entries: KnowledgeEntry[] = JSON.parse(raw)
      const allOldDefaults = entries.length > 0 && entries.every(e => oldDefaultIds.has(e.id))
      if (allOldDefaults) {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {}
  }
  localStorage.setItem(VERSION_KEY, String(CURRENT_VERSION))
}

migrateIfNeeded()

function getStoredEntries(): KnowledgeEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { }
  return []
}

function saveEntries(entries: KnowledgeEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { }
}

function syncCache(data: KnowledgeEntry[]): void {
  if (!isCacheLoaded()) return
  const cache = getCache()
  const cacheEntries = cache.knowledgeEntries as unknown as KnowledgeEntry[]
  cacheEntries.length = 0
  cacheEntries.push(...data.map(e => ({ ...e })))
}

function broadcastChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('knowledgeBaseChanged'))
  }
}

export function syncCacheFromServer(): boolean {
  if (!isCacheLoaded() || syncedOnceFromServer) return false
  const cache = getCache()
  const cacheEntries = cache.knowledgeEntries as unknown as KnowledgeEntry[]
  const stored = getStoredEntries()
  const cacheIds = new Set(cacheEntries.map(e => e.id))
  const localOnly = stored.filter(e => !cacheIds.has(e.id))
  if (cacheEntries.length > 0 || localOnly.length > 0) {
    const merged = [...cacheEntries.map(e => ({ ...e })), ...localOnly]
    saveEntries(merged)
    syncCache(merged)
  }
  syncedOnceFromServer = true
  return true
}

export function getKnowledgeBase(): KnowledgeEntry[] {
  const stored = getStoredEntries()
  if (stored.length > 0) {
    syncCache(stored)
    return stored.map(e => ({ ...e }))
  }
  if (isCacheLoaded()) {
    const cache = getCache()
    const cacheEntries = cache.knowledgeEntries as unknown as KnowledgeEntry[]
    if (cacheEntries.length > 0) {
      saveEntries(cacheEntries)
      return cacheEntries.map(e => ({ ...e }))
    }
    return []
  }
  return []
}

export function addKnowledgeEntry(entry: KnowledgeEntry): void {
  const entries = getStoredEntries()
  entries.push(entry)
  saveEntries(entries)
  syncCache(entries)
  triggerSync()
  broadcastChange()
}

export function updateKnowledgeEntry(updated: KnowledgeEntry): void {
  const entries = getStoredEntries()
  const index = entries.findIndex(e => e.id === updated.id)
  if (index === -1) return
  entries[index] = updated
  saveEntries(entries)
  syncCache(entries)
  triggerSync()
  broadcastChange()
}

export function deleteKnowledgeEntry(id: string): void {
  const entries = getStoredEntries()
  const index = entries.findIndex(e => e.id === id)
  if (index === -1) return
  entries.splice(index, 1)
  saveEntries(entries)
  syncCache(entries)
  triggerSync()
  broadcastChange()
}

export function getEntryById(id: string): KnowledgeEntry | undefined {
  return getStoredEntries().find(e => e.id === id)
}

export function saveKnowledgeEntry(entry: KnowledgeEntry): void {
  const entries = getStoredEntries()
  const index = entries.findIndex(e => e.id === entry.id)
  if (index !== -1) {
    entries[index] = entry
    saveEntries(entries)
    syncCache(entries)
    triggerSync()
    broadcastChange()
  } else {
    addKnowledgeEntry(entry)
  }
}

export function createKnowledgeEntry(entry: KnowledgeEntry): void {
  addKnowledgeEntry(entry)
}

export function resetKnowledgeBase(): void {
  saveEntries([])
  syncCache([])
  triggerSync()
  broadcastChange()
}

export function matchKnowledgeBase(query: string): KnowledgeEntry[] {
  if (!query) return []
  const q = query.toLowerCase()
  return getKnowledgeBase().filter(entry =>
    entry.keywords.some(k => k.toLowerCase().includes(q)) ||
    entry.title.toLowerCase().includes(q) ||
    entry.content.toLowerCase().includes(q)
  )
}
