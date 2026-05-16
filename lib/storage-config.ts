import path from 'path'
import fs from 'fs'
import { prisma } from './prisma'

export interface StorageConfig {
  baseDir: string
  uploadsDir: string
  pdfDir: string
  maxFileSize: number
  allowedExtensions: string[]
}

const DEFAULT_CONFIG: StorageConfig = {
  baseDir: path.join(process.cwd(), 'public', 'storage'),
  uploadsDir: 'uploads',
  pdfDir: 'pdfs',
  maxFileSize: 100 * 1024 * 1024,
  allowedExtensions: ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf'],
}

let cachedConfig: StorageConfig | null = null

export function getStorageConfig(): StorageConfig {
  if (cachedConfig) return cachedConfig
  cachedConfig = { ...DEFAULT_CONFIG }
  return cachedConfig
}

export function ensureStorageDirs(): { uploadsPath: string; pdfPath: string } {
  const config = getStorageConfig()
  const uploadsPath = path.join(config.baseDir, config.uploadsDir)
  const pdfPath = path.join(config.baseDir, config.pdfDir)
  for (const dir of [config.baseDir, uploadsPath, pdfPath]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
  return { uploadsPath, pdfPath }
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

export function isAllowedFile(filename: string): boolean {
  const ext = getFileExtension(filename)
  return DEFAULT_CONFIG.allowedExtensions.includes(ext)
}

export function getFileCategory(ext: string): string {
  if (['.doc', '.docx'].includes(ext)) return 'word'
  if (['.xls', '.xlsx'].includes(ext)) return 'excel'
  if (['.ppt', '.pptx'].includes(ext)) return 'ppt'
  if (ext === '.pdf') return 'pdf'
  return 'other'
}

export function generateFileName(originalName: string): string {
  const ext = getFileExtension(originalName)
  const timestamp = Date.now()
  const random = Math.random().toString(36).slice(2, 8)
  return `${timestamp}-${random}${ext}`
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}
