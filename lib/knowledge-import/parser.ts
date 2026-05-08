'use client'

import type { KnowledgeEntry } from '@/lib/knowledge-base-store'
import type { PublicKnowledgeEntry } from '@/lib/public-knowledge-store'
import * as XLSX from 'xlsx'

export interface ImportResult {
  entries: KnowledgeEntry[]
  fileName: string
  totalRows: number
  successRows: number
  errors: { row: number; message: string }[]
}

const TYPE_MAP: Record<string, KnowledgeEntry['type']> = {
  link: 'link',
  l: 'link',
  链接: 'link',
  template: 'template',
  t: 'template',
  模板: 'template',
  document: 'document',
  d: 'document',
  文档: 'document',
  info: 'info',
  i: 'info',
  信息: 'info',
}

function normalizeType(val: string): KnowledgeEntry['type'] {
  const lower = val.trim().toLowerCase()
  return TYPE_MAP[lower] || 'document'
}

function parseKeywords(val: string): string[] {
  return val
    .split(/[,，、;；\n\r]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function generateId(): string {
  return `import-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

function getFileExt(name: string): string {
  return name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
}

const EXCEL_EXTS = new Set(['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.ods', '.xml'])
const WORD_EXTS = new Set(['.docx', '.docm', '.dotx'])
const PPT_EXTS = new Set(['.pptx', '.pptm', '.potx'])

const ALL_EXTS = new Set(Array.from(EXCEL_EXTS).concat(Array.from(WORD_EXTS)).concat(Array.from(PPT_EXTS)))

export function getAllSupportedExtensions(): string[] {
  const all = Array.from(EXCEL_EXTS).concat(Array.from(WORD_EXTS)).concat(Array.from(PPT_EXTS))
  return all.sort()
}

export function isExtSupported(ext: string): boolean {
  return ALL_EXTS.has(ext)
}

export async function parseFile(
  file: File
): Promise<ImportResult> {
  const ext = getFileExt(file.name)

  if (EXCEL_EXTS.has(ext)) {
    return parseExcel(file)
  }
  if (WORD_EXTS.has(ext)) {
    return parseWord(file)
  }
  if (PPT_EXTS.has(ext)) {
    return parsePowerPoint(file)
  }
  throw new Error(`不支持的文件格式: ${ext}`)
}

async function parseExcel(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    entries: [],
    fileName: file.name,
    totalRows: 0,
    successRows: 0,
    errors: [],
  }

  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) {
    throw new Error('Excel 文件没有工作表')
  }
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

  result.totalRows = rows.length

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const title =
      (row['title'] || row['Title'] || row['标题'] || row['名称'] || row['name'] || '').toString().trim()
    const content =
      (row['content'] || row['Content'] || row['内容'] || row['描述'] || row['description'] || '').toString().trim()
    const keywordsRaw =
      (row['keywords'] || row['Keywords'] || row['关键词'] || row['标签'] || row['tags'] || '').toString().trim()
    const typeRaw =
      (row['type'] || row['Type'] || row['类型'] || '').toString().trim()
    const urlRaw =
      (row['url'] || row['URL'] || row['Url'] || row['链接'] || '').toString().trim()
    const priorityRaw =
      (row['priority'] || row['Priority'] || row['优先级'] || '3').toString().trim()

    if (!title) {
      result.errors.push({ row: rowNum, message: '缺少标题，已跳过' })
      continue
    }

    const priority = Math.min(10, Math.max(1, parseInt(priorityRaw) || 3))

    result.entries.push({
      id: generateId(),
      title,
      content: content || title,
      keywords: parseKeywords(keywordsRaw),
      type: normalizeType(typeRaw),
      url: urlRaw || undefined,
      priority,
    })
    result.successRows++
  }

  return result
}

async function parseWord(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    entries: [],
    fileName: file.name,
    totalRows: 1,
    successRows: 0,
    errors: [],
  }

  try {
    const mammoth = await import('mammoth')
    const buffer = await file.arrayBuffer()
    const { value } = await mammoth.extractRawText({ arrayBuffer: buffer })
    const text = value.trim()

    if (!text) {
      result.errors.push({ row: 1, message: 'Word 文档内容为空' })
      return result
    }

    const title = file.name.replace(/\.docx$/i, '').replace(/\.doc$/i, '')

    result.entries.push({
      id: generateId(),
      title,
      content: text,
      keywords: extractKeywords(text),
      type: 'document',
      priority: 3,
    })
    result.successRows = 1
  } catch (e: any) {
    result.errors.push({ row: 1, message: `解析失败: ${e?.message || e}` })
  }

  return result
}

async function parsePowerPoint(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    entries: [],
    fileName: file.name,
    totalRows: 1,
    successRows: 0,
    errors: [],
  }

  try {
    const JSZip = (await import('jszip')).default
    const buffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(buffer)

    const slideFiles = Object.keys(zip.files)
      .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
      .sort()

    if (slideFiles.length === 0) {
      result.errors.push({ row: 1, message: '未找到幻灯片内容' })
      return result
    }

    let fullText = ''
    for (const slideFile of slideFiles) {
      const content = await zip.files[slideFile].async('string')
      const textMatches = content.match(/<a:t[^>]*>([^<]+)<\/a:t>/g) || []
      for (const match of textMatches) {
        const text = match.replace(/<\/?a:t[^>]*>/g, '')
        if (text.trim()) {
          fullText += text.trim() + '\n'
        }
      }
      fullText += '\n---\n\n'
    }

    const text = fullText.trim()
    if (!text) {
      result.errors.push({ row: 1, message: 'PPT 内容为空' })
      return result
    }

    const title = file.name.replace(/\.pptx$/i, '')

    result.entries.push({
      id: generateId(),
      title,
      content: text,
      keywords: extractKeywords(text),
      type: 'document',
      priority: 3,
    })
    result.successRows = 1
  } catch (e: any) {
    result.errors.push({ row: 1, message: `解析失败: ${e?.message || e}` })
  }

  return result
}

function extractKeywords(text: string): string[] {
  const common = text
    .split(/[\n\r\s,，、。.；;：:！!？?（）()【】\[\]{}]+/)
    .map(s => s.trim())
    .filter(s => s.length >= 2 && s.length <= 20)
  const unique = Array.from(new Set(common))
  return unique.slice(0, 20)
}
