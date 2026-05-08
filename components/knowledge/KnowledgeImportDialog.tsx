'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileSpreadsheet, FileText, FileType, AlertCircle, CheckCircle2, ChevronDown, ChevronRight, BookOpen, Link as LinkIcon, FileText as FileTextIcon, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseFile, isExtSupported, getAllSupportedExtensions, type ImportResult } from '@/lib/knowledge-import/parser'
import type { KnowledgeEntry } from '@/lib/knowledge-base-store'
import type { KnowledgeFolder } from '@/lib/knowledge-folder-store'

interface Props {
  open: boolean
  onClose: () => void
  onImport: (entries: KnowledgeEntry[], folderId?: string) => Promise<boolean>
  folders?: KnowledgeFolder[]
  mode: 'private' | 'public'
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  link: <LinkIcon className="w-3 h-3" />,
  template: <FileTextIcon className="w-3 h-3" />,
  document: <BookOpen className="w-3 h-3" />,
  info: <Info className="w-3 h-3" />,
}

const TYPE_LABELS: Record<string, string> = {
  link: '链接',
  template: '模板',
  document: '文档',
  info: '信息',
}

export default function KnowledgeImportDialog({ open, onClose, onImport, folders = [], mode }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('')
  const [showPreview, setShowPreview] = useState(true)

  const allowedExts = getAllSupportedExtensions()
  const acceptStr = allowedExts.join(',')

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    if (!isExtSupported(ext)) {
      alert(`不支持的文件格式: ${ext}\n\n支持的格式:\n${allowedExts.join(' / ')}`)
      return
    }

    setImporting(true)
    setResult(null)
    try {
      const parsed = await parseFile(file)
      setResult(parsed)
    } catch (e: any) {
      alert(`解析失败: ${e?.message || e}`)
    } finally {
      setImporting(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  const handleImport = async () => {
    if (!result || result.entries.length === 0) return
    const ok = await onImport(result.entries, selectedFolderId || undefined)
    if (ok) {
      setResult(null)
      setSelectedFolderId('')
      onClose()
    }
  }

  const handleClose = () => {
    setResult(null)
    setSelectedFolderId('')
    setImporting(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-background/60 backdrop-blur-sm" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-2xl mx-4 rounded-2xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                导入知识条目
              </h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
              {!result && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
                    dragOver
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-border hover:border-primary/40 hover:bg-accent/30'
                  )}
                >
                  <input
                    type="file"
                    accept={acceptStr}
                    onChange={handleFileSelect}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      拖拽文件到此处，或点击选择文件
                    </p>
                    <p className="text-xs text-muted-foreground">
                      支持 Excel 电子表格、Word 文档、PPT 演示等格式
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap justify-center">
                      <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        .xlsx .xlsm .xlsb .xls
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <FileText className="w-3.5 h-3.5" />
                        .csv .ods .xml
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-stone-50 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400">
                        <FileText className="w-3.5 h-3.5" />
                        .docx .docm .dotx
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                        <FileType className="w-3.5 h-3.5" />
                        .pptx .pptm .potx
                      </div>
                    </div>
                    <div className="mt-2 text-[11px] text-muted-foreground bg-accent/50 px-3 py-1.5 rounded-lg leading-relaxed">
                      <p className="font-medium mb-0.5">Excel 格式要求：</p>
                      <p>表头需包含：title(标题)、content(内容)、keywords(关键词)、type(类型)、priority(优先级)、url(链接)</p>
                    </div>
                  </div>
                </div>
              )}

              {importing && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">正在解析文件...</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="space-y-4">
                  {result.errors.length > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-600 dark:text-red-400">
                        <p className="font-medium mb-1">解析警告（{result.errors.length} 条）</p>
                        {result.errors.map((err, i) => (
                          <p key={i} className="opacity-80">第 {err.row} 行：{err.message}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="text-foreground font-medium">{result.fileName}</span>
                      <span className="text-muted-foreground">
                        成功解析 {result.successRows} / {result.totalRows} 条
                      </span>
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPreview ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      {showPreview ? '收起预览' : '展开预览'}
                    </button>
                  </div>

                  {result.entries.length > 0 && (
                    <div>
                      <div className="mb-3">
                        <label className="block text-xs font-medium text-foreground mb-1.5">
                          导入到文件夹（选填）
                        </label>
                        <select
                          value={selectedFolderId}
                          onChange={e => setSelectedFolderId(e.target.value)}
                          className="w-full h-9 px-3 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                        >
                          <option value="">未分类</option>
                          {folders.map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>

                      {showPreview && (
                        <div className="border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
                          {result.entries.map((entry, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 hover:bg-accent/30 transition-colors">
                              <div className={cn(
                                'shrink-0 w-6 h-6 rounded flex items-center justify-center text-[10px]',
                                entry.type === 'link' ? 'bg-slate-100 text-slate-600 dark:bg-orange-900/30 dark:text-orange-300' :
                                entry.type === 'template' ? 'bg-stone-100 text-stone-600 dark:bg-orange-900/30 dark:text-orange-300' :
                                entry.type === 'document' ? 'bg-gray-100 text-gray-600 dark:bg-orange-900/30 dark:text-orange-300' :
                                'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300'
                              )}>
                                {TYPE_ICONS[entry.type] || <Info className="w-3 h-3" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground truncate">{entry.title}</span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground shrink-0">
                                    {TYPE_LABELS[entry.type] || entry.type}
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{entry.content}</p>
                                {entry.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {entry.keywords.slice(0, 5).map(kw => (
                                      <span key={kw} className="text-[10px] px-1 py-0.5 rounded bg-accent/50 text-muted-foreground">
                                        {kw}
                                      </span>
                                    ))}
                                    {entry.keywords.length > 5 && (
                                      <span className="text-[10px] text-muted-foreground">+{entry.keywords.length - 5}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => {
                  setResult(null)
                  setSelectedFolderId('')
                }}
                className="px-3 py-2 text-xs rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                重新选择
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={!result || result.entries.length === 0}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40"
                >
                  导入 {result ? `${result.entries.length} 条` : ''}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
