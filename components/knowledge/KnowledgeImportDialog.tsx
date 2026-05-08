'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileSpreadsheet, FileText, FileType, CheckCircle2, Loader2, FileUp, FolderOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllSupportedExtensions, isExtSupported, uploadFile } from '@/lib/knowledge-import/parser'
import type { KnowledgeEntry } from '@/lib/knowledge-base-store'
import type { KnowledgeFolder } from '@/lib/knowledge-folder-store'

interface Props {
  open: boolean
  onClose: () => void
  onImport: (entries: KnowledgeEntry[], folderId?: string) => Promise<boolean>
  folders?: KnowledgeFolder[]
  mode: 'private' | 'public'
}

interface UploadingFile {
  id: string
  name: string
  size: number
  progress: 'uploading' | 'done' | 'error'
  error?: string
  entry?: KnowledgeEntry
}

function generateId(): string {
  return `import-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

function extIcon(ext: string) {
  const e = ext.toLowerCase()
  if (['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.ods', '.xml'].includes(e)) return <FileSpreadsheet className="w-4 h-4" />
  if (['.docx', '.docm', '.dotx', '.doc'].includes(e)) return <FileText className="w-4 h-4" />
  if (['.pptx', '.pptm', '.potx', '.ppt'].includes(e)) return <FileType className="w-4 h-4" />
  return <FileUp className="w-4 h-4" />
}

function extColor(ext: string) {
  const e = ext.toLowerCase()
  if (['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv', '.ods', '.xml'].includes(e)) return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  if (['.docx', '.docm', '.dotx', '.doc'].includes(e)) return 'bg-stone-50 text-stone-600 dark:bg-stone-900/30 dark:text-stone-400'
  if (['.pptx', '.pptm', '.potx', '.ppt'].includes(e)) return 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
  if (['.pdf'].includes(e)) return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
  return 'bg-gray-50 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function KnowledgeImportDialog({ open, onClose, onImport, folders = [] }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [importing, setImporting] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const supportedExts = getAllSupportedExtensions()
  const acceptStr = supportedExts.join(',')

  const addFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList)
    const newFiles: UploadingFile[] = files.map(f => ({
      id: generateId(),
      name: f.name,
      size: f.size,
      progress: 'uploading' as const,
    }))
    setUploadingFiles(prev => [...prev, ...newFiles])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileId = newFiles[i].id
      const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
      if (!isExtSupported(ext)) {
        setUploadingFiles(prev => prev.map(uf =>
          uf.id === fileId ? { ...uf, progress: 'error', error: `不支持格式 ${ext}` } : uf
        ))
        continue
      }

      try {
        const result = await uploadFile(file)
        const title = file.name.replace(/\.[^.]+$/, '')
        const entry: KnowledgeEntry = {
          id: generateId(),
          title,
          content: `上传文件: ${file.name}`,
          keywords: title.split(/[\s\-_]+/).filter(s => s.length >= 2),
          type: 'document',
          url: result.filePath,
          priority: 3,
        }
        setUploadingFiles(prev => prev.map(uf =>
          uf.id === fileId ? { ...uf, progress: 'done', entry } : uf
        ))
      } catch (e: any) {
        setUploadingFiles(prev => prev.map(uf =>
          uf.id === fileId ? { ...uf, progress: 'error', error: e?.message || '上传失败' } : uf
        ))
      }
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files)
    e.target.value = ''
  }, [addFiles])

  const handleImport = async () => {
    const entries = uploadingFiles
      .filter(f => f.progress === 'done' && f.entry)
      .map(f => f.entry!)
    if (entries.length === 0) return

    setImporting(true)
    const ok = await onImport(entries, selectedFolderId || undefined)
    setImporting(false)

    if (ok) {
      setUploadingFiles([])
      setSelectedFolderId('')
      onClose()
    }
  }

  const handleClose = () => {
    if (importing) return
    setUploadingFiles([])
    setSelectedFolderId('')
    onClose()
  }

  const removeFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id))
  }

  const doneCount = uploadingFiles.filter(f => f.progress === 'done').length
  const errorCount = uploadingFiles.filter(f => f.progress === 'error').length

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-background/60 backdrop-blur-sm" onClick={handleClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                上传文件到知识库
              </h2>
              <button onClick={handleClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'relative border-2 border-dashed rounded-xl p-6 text-center transition-all',
                  dragOver
                    ? 'border-primary bg-primary/5 scale-[1.02]'
                    : 'border-border hover:border-primary/40 hover:bg-accent/30'
                )}
              >
                <input
                  type="file"
                  multiple
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
                    支持 Office 文档、PDF、图片等 {supportedExts.length} 种格式
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-1 max-w-sm">
                    {['.xlsx', '.xlsm', '.docx', '.pptx', '.pdf'].map(ext => (
                      <span key={ext} className={cn('text-[10px] px-1.5 py-0.5 rounded-full', extColor(ext))}>
                        {ext}
                      </span>
                    ))}
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent text-muted-foreground">
                      +{supportedExts.length - 5} 种
                    </span>
                  </div>
                </div>
              </div>

              {uploadingFiles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">
                      已添加 {uploadingFiles.length} 个文件
                    </span>
                    {doneCount > 0 && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        {doneCount} 个上传完成
                      </span>
                    )}
                  </div>
                  <div className="border border-border rounded-xl divide-y divide-border max-h-52 overflow-y-auto">
                    {uploadingFiles.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors">
                        <div className={cn('shrink-0 w-7 h-7 rounded-lg flex items-center justify-center', extColor(f.name.match(/\.[^.]+$/)?.[0] || ''))}>
                          {extIcon(f.name.match(/\.[^.]+$/)?.[0] || '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{f.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatSize(f.size)}</p>
                          {f.progress === 'uploading' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              <span className="text-[10px] text-muted-foreground">上传中...</span>
                            </div>
                          )}
                          {f.progress === 'done' && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              <span className="text-[10px] text-green-600 dark:text-green-400">上传完成</span>
                            </div>
                          )}
                          {f.progress === 'error' && (
                            <p className="text-[10px] text-red-500 truncate">{f.error || '上传失败'}</p>
                          )}
                        </div>
                        {f.progress !== 'uploading' && (
                          <button onClick={() => removeFile(f.id)} className="shrink-0 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground mb-1.5">
                      <FolderOpen className="w-3.5 h-3.5 text-muted-foreground" />
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
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-accent/30 rounded-b-2xl">
              {errorCount > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  {errorCount} 个文件上传失败，可重试
                </span>
              )}
              {errorCount === 0 && <span />}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClose}
                  disabled={importing}
                  className="px-4 py-2 text-sm rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-all disabled:opacity-40"
                >
                  取消
                </button>
                <button
                  onClick={handleImport}
                  disabled={doneCount === 0 || importing}
                  className="px-5 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  导入到{importing ? '中...' : `知识库 (${doneCount})`}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
