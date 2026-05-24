'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, X, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useEscapeKey } from '@/lib/use-escape-key'
import { importStudentsFromRows, ImportResult } from '@/lib/import-students'

interface BatchImportDialogProps {
  classId: string
  onClose: () => void
  onImported: () => void
}

const NAME_COLUMN_KEYWORDS = ['姓名', '名字', '学生', 'name', '学生姓名', '名称']

function detectNameColumn(headers: string[]): string | null {
  for (const kw of NAME_COLUMN_KEYWORDS) {
    const found = headers.find((h) => h.trim().toLowerCase() === kw.toLowerCase())
    if (found) return found
  }
  for (const kw of NAME_COLUMN_KEYWORDS) {
    const found = headers.find((h) => h.trim().toLowerCase().includes(kw.toLowerCase()))
    if (found) return found
  }
  return headers.length > 0 ? headers[0] : null
}

function detectNotesColumn(headers: string[]): string | null {
  const keywords = ['备注', 'notes', 'note', '说明', '描述', 'remark']
  for (const kw of keywords) {
    const found = headers.find((h) => h.trim().toLowerCase() === kw.toLowerCase())
    if (found) return found
  }
  for (const kw of keywords) {
    const found = headers.find((h) => h.trim().toLowerCase().includes(kw.toLowerCase()))
    if (found) return found
  }
  return null
}

export default function BatchImportDialog({ classId, onClose, onImported }: BatchImportDialogProps) {
  const [headers, setHeaders] = useState<string[]>([])
  const [allRows, setAllRows] = useState<Record<string, string>[]>([])
  const [nameColumn, setNameColumn] = useState<string>('')
  const [notesColumn, setNotesColumn] = useState<string>('')
  const [isNameSelectOpen, setIsNameSelectOpen] = useState(false)
  const [isNotesSelectOpen, setIsNotesSelectOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const nameSelectRef = useRef<HTMLDivElement>(null)
  const notesSelectRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEscapeKey(() => onClose())

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nameSelectRef.current && !nameSelectRef.current.contains(event.target as Node)) {
        setIsNameSelectOpen(false)
      }
      if (notesSelectRef.current && !notesSelectRef.current.contains(event.target as Node)) {
        setIsNotesSelectOpen(false)
      }
    }
    if (isNameSelectOpen || isNotesSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isNameSelectOpen, isNotesSelectOpen])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        if (!firstSheetName) {
          toast.error('文件中没有找到工作表')
          return
        }
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' })

        if (jsonData.length === 0) {
          toast.error('文件中没有数据行')
          return
        }

        const detectedHeaders = Object.keys(jsonData[0])
        setHeaders(detectedHeaders)
        setAllRows(jsonData)

        const detectedName = detectNameColumn(detectedHeaders)
        const detectedNotes = detectNotesColumn(detectedHeaders)
        if (detectedName) setNameColumn(detectedName)
        if (detectedNotes) setNotesColumn(detectedNotes)
      } catch {
        toast.error('文件解析失败，请确认文件格式正确')
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const previewRows = allRows.slice(0, 5)

  const handleImport = async () => {
    if (!nameColumn) {
      toast.error('请先选择姓名列')
      return
    }

    setImporting(true)
    setProgress(0)

    const mappedRows = allRows.map((row) => ({
      name: row[nameColumn] || '',
      notes: notesColumn ? row[notesColumn] : undefined,
    }))

    const total = mappedRows.length
    let current = 0

    const interval = setInterval(() => {
      current = Math.min(current + Math.max(1, Math.floor(total / 20)), total - 1)
      setProgress(Math.round((current / total) * 100))
    }, 100)

    await new Promise((resolve) => setTimeout(resolve, 300))

    const result: ImportResult = importStudentsFromRows(mappedRows, classId)

    clearInterval(interval)
    setProgress(100)

    await new Promise((resolve) => setTimeout(resolve, 300))

    setImporting(false)

    if (result.success > 0) {
      toast.success(`成功导入 ${result.success} 名学生`)
    }
    if (result.skipped > 0) {
      toast.warning(`跳过 ${result.skipped} 名（重复或无效）`)
    }
    if (result.errors.length > 0) {
      const detail = result.errors.slice(0, 5).join('\n')
      const more = result.errors.length > 5 ? `\n...还有 ${result.errors.length - 5} 条` : ''
      toast.error(`导入问题:\n${detail}${more}`)
    }

    if (result.success > 0) {
      onImported()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl mx-4 p-6 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">批量导入学生</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              上传 Excel (.xlsx) 或 CSV 文件，批量导入学生
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          {headers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-2">选择文件</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center max-w-xs">
                支持 .xlsx 和 .csv 格式，第一行应为列标题
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.csv,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Upload className="h-4 w-4 mr-2" />
                选择文件
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileSpreadsheet className="h-4 w-4" />
                    已加载 {allRows.length} 行数据
                  </div>
                  <button
                    onClick={() => {
                      setHeaders([])
                      setAllRows([])
                      setNameColumn('')
                      setNotesColumn('')
                      setProgress(0)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    重新选择
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    姓名列 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={nameSelectRef}>
                    <button
                      type="button"
                      onClick={() => setIsNameSelectOpen(!isNameSelectOpen)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between transition-all',
                        nameColumn
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-background text-foreground hover:bg-accent/50'
                      )}
                    >
                      <span>{nameColumn || '选择姓名列...'}</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isNameSelectOpen && 'rotate-180')} />
                    </button>
                    {isNameSelectOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50">
                        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            {headers.map((header) => (
                              <button
                                key={header}
                                type="button"
                                onClick={() => { setNameColumn(header); setIsNameSelectOpen(false) }}
                                className={cn(
                                  'w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-accent flex items-center justify-between',
                                  nameColumn === header ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                )}
                              >
                                <span>{header}</span>
                                {nameColumn === header && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    备注列 <span className="text-xs text-muted-foreground">(可选)</span>
                  </label>
                  <div className="relative" ref={notesSelectRef}>
                    <button
                      type="button"
                      onClick={() => setIsNotesSelectOpen(!isNotesSelectOpen)}
                      className={cn(
                        'w-full px-3 py-2.5 rounded-lg border text-sm flex items-center justify-between transition-all',
                        notesColumn
                          ? 'border-primary/50 bg-background text-primary'
                          : 'border-border bg-background text-foreground hover:bg-accent/50'
                      )}
                    >
                      <span>{notesColumn || '无需备注'}</span>
                      <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isNotesSelectOpen && 'rotate-180')} />
                    </button>
                    {isNotesSelectOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50">
                        <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                          <div className="max-h-48 overflow-y-auto">
                            <button
                              type="button"
                              onClick={() => { setNotesColumn(''); setIsNotesSelectOpen(false) }}
                              className={cn(
                                'w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-accent flex items-center justify-between',
                                !notesColumn ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground'
                              )}
                            >
                              <span>无需备注</span>
                              {!notesColumn && <Check className="h-4 w-4 text-primary" />}
                            </button>
                            {headers.map((header) => (
                              <button
                                key={header}
                                type="button"
                                onClick={() => { setNotesColumn(header); setIsNotesSelectOpen(false) }}
                                className={cn(
                                  'w-full px-4 py-2.5 text-left text-sm transition-all hover:bg-accent flex items-center justify-between',
                                  notesColumn === header ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                )}
                              >
                                <span>{header}</span>
                                {notesColumn === header && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">
                  预览（前 {Math.min(5, allRows.length)} 行）
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">#</th>
                          {headers.map((header) => (
                            <th
                              key={header}
                              className={cn(
                                'text-left px-3 py-2 text-xs font-medium whitespace-nowrap',
                                header === nameColumn && 'text-primary',
                                header === notesColumn && 'text-primary/70'
                              )}
                            >
                              {header}
                              {header === nameColumn && (
                                <span className="ml-1 text-[10px]">(姓名)</span>
                              )}
                              {header === notesColumn && (
                                <span className="ml-1 text-[10px]">(备注)</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {previewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{idx + 1}</td>
                            {headers.map((header) => (
                              <td
                                key={header}
                                className={cn(
                                  'px-3 py-2 text-xs max-w-[150px] truncate',
                                  header === nameColumn && 'font-medium text-primary',
                                  header === notesColumn && 'text-muted-foreground'
                                )}
                              >
                                {row[header] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {importing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">正在导入...</span>
                    <span className="font-medium text-foreground">{progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
          <div className="text-sm text-muted-foreground">
            {headers.length > 0 && `共 ${allRows.length} 条记录`}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              disabled={importing}
              className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
            >
              取消
            </button>
            {headers.length > 0 && (
              <button
                onClick={handleImport}
                disabled={!nameColumn || importing}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    开始导入
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
