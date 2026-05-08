'use client'

export interface UploadResult {
  fileName: string
  filePath: string
  fileSize: number
}

const SUPPORTED_EXTS = new Set([
  '.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.ods', '.xml',
  '.docx', '.docm', '.dotx',
  '.pptx', '.pptm', '.potx',
  '.pdf', '.doc', '.ppt', '.txt', '.md',
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
])

export function getAllSupportedExtensions(): string[] {
  return Array.from(SUPPORTED_EXTS).sort()
}

export function isExtSupported(ext: string): boolean {
  return SUPPORTED_EXTS.has(ext)
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || '上传失败')
  }

  return {
    fileName: data.fileName,
    filePath: data.filePath,
    fileSize: data.fileSize,
  }
}
