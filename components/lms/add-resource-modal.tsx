'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Trash2, ChevronDown, Image } from 'lucide-react'
import { ClassResource, ResourceType } from '@/lib/store'

const resourceTypeOptions: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'document', label: '文档', icon: '📄' },
  { value: 'link', label: '链接', icon: '🔗' },
  { value: 'image', label: '图片', icon: '🖼️' },
  { value: 'other', label: '其他', icon: '📦' },
]

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function AddResourceModal({
  classId,
  onClose,
  onSaved,
}: {
  classId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState<ResourceType>('document')
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(false)
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [otherContent, setOtherContent] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const typeSelectRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeSelectRef.current && !typeSelectRef.current.contains(event.target as Node)) setIsTypeSelectOpen(false)
    }
    if (isTypeSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isTypeSelectOpen])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File): Promise<{ filePath: string; fileName: string; fileSize: number }> => {
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })
    if (!uploadRes.ok) {
      const errData = await uploadRes.json()
      throw new Error(errData.error || '上传失败')
    }
    return await uploadRes.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (type === 'document' && (!title.trim() || !selectedFile)) return
    if (type === 'link' && (!title.trim() || !linkUrl.trim())) return
    if (type === 'image' && (!title.trim() || !selectedImage)) return
    if (type === 'other' && (!title.trim() || !otherContent.trim())) return

    setSaving(true)
    setUploadProgress(true)

    try {
      let url = ''
      let fileName = ''
      let fileSize = 0
      let originalName = ''
      let description = ''

      if (type === 'document' && selectedFile) {
        const uploadData = await uploadFile(selectedFile)
        url = uploadData.filePath
        fileName = uploadData.fileName
        fileSize = uploadData.fileSize
        originalName = selectedFile.name
      } else if (type === 'link') {
        url = linkUrl.trim()
        description = linkUrl.trim()
      } else if (type === 'image' && selectedImage) {
        const uploadData = await uploadFile(selectedImage)
        url = uploadData.filePath
        fileName = uploadData.fileName
        fileSize = uploadData.fileSize
        originalName = selectedImage.name
      } else if (type === 'other') {
        description = otherContent.trim()
      }

      const { saveResource } = await import('@/lib/store')
      saveResource({
        classId,
        title: title.trim(),
        type,
        url: url || '',
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
        originalName: originalName || undefined,
        description: description || undefined,
        createdBy: '助教',
      })

      onSaved()
    } catch (error: any) {
      alert(error.message || '操作失败，请重试')
    } finally {
      setSaving(false)
      setUploadProgress(false)
    }
  }

  const canSubmit = () => {
    if (!title.trim() || saving) return false
    if (type === 'document') return !!selectedFile
    if (type === 'link') return !!linkUrl.trim()
    if (type === 'image') return !!selectedImage
    if (type === 'other') return !!otherContent.trim()
    return false
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 lg:left-64 lg:w-[calc(100%-256px)] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 lg:left-64 lg:w-[calc(100%-256px)] flex items-center justify-center p-6">
        <div
          className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[600px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-3 sm:p-4 pb-0 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
              添加资料
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 w-full">
            <div className="flex-1 overflow-y-auto scrollbar-thin pt-2 pb-3 sm:pt-3 sm:pb-4 px-3 sm:px-4 space-y-2 sm:space-y-3 w-full min-h-0">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例如：KET 春季班第3单元作业答案"
                  className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">资料类型</label>
                <div className="relative" ref={typeSelectRef}>
                  <button
                    type="button"
                    onClick={() => setIsTypeSelectOpen(!isTypeSelectOpen)}
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm flex items-center justify-between cursor-pointer hover:bg-accent/50"
                  >
                    <span className="flex items-center gap-2">
                      <span>{resourceTypeOptions.find(opt => opt.value === type)?.icon}</span>
                      <span>{resourceTypeOptions.find(opt => opt.value === type)?.label || '选择类型'}</span>
                    </span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isTypeSelectOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isTypeSelectOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-50">
                      <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                        <div className="max-h-48 overflow-y-auto">
                          {resourceTypeOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setType(option.value)
                                setIsTypeSelectOpen(false)
                              }}
                              className={`w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent flex items-center gap-2 ${type === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                            >
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {type === 'document' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    上传文件 <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center w-full py-6 px-4 rounded-lg border-2 border-dashed border-border bg-background hover:bg-accent/50 hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    {selectedFile ? (
                      <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 rounded-lg bg-primary/5 shrink-0">
                          <span className="text-lg">📄</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile()
                          }}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          点击选择文件，支持 PDF、Word、Excel、TXT 格式
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {type === 'link' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    链接地址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://docs.qq.com/doc/xxx 或 https://pan.baidu.com/s/xxx"
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
                    required
                  />
                </div>
              )}

              {type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    上传图片 <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="relative flex flex-col items-center justify-center w-full py-6 px-4 rounded-lg border-2 border-dashed border-border bg-background hover:bg-accent/50 hover:border-primary/40 transition-all cursor-pointer"
                  >
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    {selectedImage ? (
                      <div className="flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-2 rounded-lg bg-primary/5 shrink-0">
                          <span className="text-lg">🖼️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{selectedImage.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(selectedImage.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeImage()
                          }}
                          className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          点击选择图片，支持 JPG、PNG、GIF、WebP 等格式
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={otherContent}
                    onChange={(e) => setOtherContent(e.target.value)}
                    placeholder="请输入文字内容或备注..."
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[80px] sm:min-h-[100px] resize-none hover:bg-accent/50 cursor-pointer"
                    required
                  />
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 pt-0 w-full flex-shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {uploadProgress ? '上传中...' : '保存中...'}
                    </>
                  ) : (
                    '添加资料'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
