'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { ClassResource, ResourceType } from '@/lib/store'

const resourceTypeOptions: { value: ResourceType; label: string; icon: string }[] = [
  { value: 'document', label: '文档', icon: '📄' },
  { value: 'link', label: '链接', icon: '🔗' },
  { value: 'image', label: '图片', icon: '🖼️' },
  { value: 'other', label: '其他', icon: '📦' },
]

export default function EditResourceModal({
  resource,
  onClose,
  onSaved,
}: {
  resource: any
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(resource?.title || '')
  const [type, setType] = useState<ResourceType>(resource?.type || 'document')
  const [url, setUrl] = useState(resource?.url || '')
  const [description, setDescription] = useState(resource?.description || '')
  const [saving, setSaving] = useState(false)
  const [isTypeSelectOpen, setIsTypeSelectOpen] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    if ((type === 'link' || type === 'document' || type === 'image') && !url.trim()) return
    if (type === 'other' && !description.trim()) return
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    const { updateResource } = await import('@/lib/store')
    updateResource(resource.id, {
      title: title.trim(),
      type,
      url: url.trim() || '',
      description: description.trim() || undefined,
    })
    setSaving(false)
    onSaved()
  }

  const canSubmit = () => {
    if (!title.trim() || saving) return false
    if (type === 'link' || type === 'document' || type === 'image') return !!url.trim()
    if (type === 'other') return !!description.trim()
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
              编辑资料
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

              {(type === 'document' || type === 'link' || type === 'image') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    {type === 'link' ? '链接地址' : '文件地址'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                      type === 'link'
                        ? 'https://docs.qq.com/doc/xxx 或 https://pan.baidu.com/s/xxx'
                        : '输入文件链接地址'
                    }
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm hover:bg-accent/50 cursor-pointer"
                    required
                  />
                </div>
              )}

              {type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请输入文字内容或备注..."
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[100px] resize-none hover:bg-accent/50 cursor-pointer"
                    required
                  />
                </div>
              )}

              {(type === 'document' || type === 'image') && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">备注说明</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="可选：添加一些说明文字..."
                    className="w-full px-3 py-2 sm:py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[60px] sm:min-h-[80px] resize-none hover:bg-accent/50 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="p-3 sm:p-4 pt-0 w-full flex-shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium shadow-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium shadow-sm"
                >
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
