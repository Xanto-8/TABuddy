'use client'

export interface KnowledgeFolder {
  id: string
  name: string
  color: string
  createdAt: string
}

const FOLDER_STORAGE_KEY = 'tabuddy_knowledge_folders'

const DEFAULT_FOLDERS: KnowledgeFolder[] = []

const FOLDER_COLORS = [
  '#5227FF', '#FF6B6B', '#4ECDC4', '#FFB347',
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function getStoredFolders(): KnowledgeFolder[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(FOLDER_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { }
  return [...DEFAULT_FOLDERS]
}

function saveFolders(folders: KnowledgeFolder[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(folders))
  } catch { }
}

function broadcastChange(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('knowledgeFoldersChanged'))
  }
}

export function getKnowledgeFolders(): KnowledgeFolder[] {
  return getStoredFolders().map(f => ({ ...f }))
}

export function getFolderById(id: string): KnowledgeFolder | undefined {
  return getStoredFolders().find(f => f.id === id)
}

export function createKnowledgeFolder(name: string, color?: string): KnowledgeFolder {
  const folders = getStoredFolders()
  const folder: KnowledgeFolder = {
    id: generateId(),
    name,
    color: color || FOLDER_COLORS[folders.length % FOLDER_COLORS.length],
    createdAt: new Date().toISOString(),
  }
  folders.push(folder)
  saveFolders(folders)
  broadcastChange()
  return folder
}

export function updateKnowledgeFolder(id: string, updates: Partial<Pick<KnowledgeFolder, 'name' | 'color'>>): void {
  const folders = getStoredFolders()
  const index = folders.findIndex(f => f.id === id)
  if (index === -1) return
  folders[index] = { ...folders[index], ...updates }
  saveFolders(folders)
  broadcastChange()
}

export function deleteKnowledgeFolder(id: string): void {
  const folders = getStoredFolders()
  const index = folders.findIndex(f => f.id === id)
  if (index === -1) return
  folders.splice(index, 1)
  saveFolders(folders)
  broadcastChange()
}

export function getFolderColor(index: number): string {
  return FOLDER_COLORS[index % FOLDER_COLORS.length]
}
