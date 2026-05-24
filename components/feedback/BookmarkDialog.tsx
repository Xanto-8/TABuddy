'use client'

import React, { useState, useCallback, useRef } from 'react'
import {
  Bookmark, Copy, Check, X, Loader2, Star, Info, GripHorizontal, ArrowUp,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useEscapeKey } from '@/lib/use-escape-key'

interface BookmarkStudent {
  name: string
  content: string
}

interface BookmarkDialogProps {
  students: BookmarkStudent[]
  open: boolean
  onClose: () => void
}

export default function BookmarkDialog({ students, open, onClose }: BookmarkDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [bookmarkCode, setBookmarkCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [dragged, setDragged] = useState(false)
  const dragRef = useRef<HTMLAnchorElement>(null)

  useEscapeKey(onClose, open)

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setBookmarkCode('')
    setError('')
    setCopied(false)
    setDragged(false)

    try {
      const res = await fetch('/api/bookmark/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '生成失败')
      }

      setBookmarkCode(data.bookmarklet)
    } catch (err: any) {
      setError(err.message)
      toast.error('书签生成失败: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }, [students])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(bookmarkCode)
      setCopied(true)
      toast.success(`书签代码已复制`)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }, [bookmarkCode])

  const handleDragStart = useCallback(() => {
    setDragged(true)
    setTimeout(() => setDragged(false), 2000)
    toast.success('松手即可创建书签！')
  }, [])

  if (!open) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">生成反馈书签</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {students.length} 位学生的反馈将嵌入书签
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!bookmarkCode && !error && (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                    <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-300">使用方式</p>
                      <ol className="text-xs text-purple-700 dark:text-purple-400 mt-1 space-y-1 list-decimal list-inside">
                        <li>生成后将按钮<strong>拖拽到浏览器书签栏</strong></li>
                        <li>点击书签即出现<strong>浮动面板</strong>，右上角可拖拽/缩放</li>
                        <li>点击 <strong>—</strong> 最小化为右下角悬浮球，Esc 亦可</li>
                        <li>点击 × 彻底关闭</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">包含的学生：</p>
                    <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                      {students.map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-2 bg-background">
                          <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm font-medium text-foreground">{s.name}</span>
                          <span className="text-xs text-muted-foreground truncate flex-1">
                            {s.content.slice(0, 30)}...
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {bookmarkCode && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      书签已生成！
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="relative">
                      <a
                        ref={dragRef}
                        href={bookmarkCode}
                        draggable
                        onDragStart={handleDragStart}
                        onClick={(e) => e.preventDefault()}
                        title="拖我到书签栏"
                        className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all font-semibold text-base shadow-xl shadow-purple-500/30 cursor-grab active:cursor-grabbing select-none"
                        style={{ touchAction: 'none' }}
                      >
                        <Bookmark className="h-5 w-5" />
                        <span>TABuddy 反馈 ({students.length}人)</span>
                        <GripHorizontal className="h-4 w-4 opacity-70" />
                      </a>

                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: dragged ? 1 : 0.7, y: 0 }}
                        className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      >
                        <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                          <ArrowUp className="h-3 w-3" />
                          拖拽到书签栏
                        </span>
                      </motion.div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      用鼠标按住紫色按钮，拖到浏览器的<strong>书签栏</strong>上松手即可
                      <br />浮动面板支持<strong>拖拽移动</strong>、<strong>右下角缩放</strong>、<strong>最小化</strong>
                    </p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      如果拖拽不成功，也可以手动复制代码：
                    </p>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 max-h-32 overflow-y-auto mb-3">
                      <code className="text-[11px] text-foreground break-all font-mono leading-relaxed">
                        {bookmarkCode.slice(0, 300)}
                        {bookmarkCode.length > 300 && '...'}
                      </code>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all text-sm font-semibold shadow-lg shadow-purple-500/20"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          已复制！
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          复制代码 ({students.length} 位学生)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-6 py-4 border-t border-border shrink-0">
              {!bookmarkCode && !error && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all text-sm font-semibold shadow-lg shadow-purple-500/20 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      生成书签
                    </>
                  )}
                </button>
              )}

              {(bookmarkCode || error) && (
                <>
                  {error && (
                    <button
                      onClick={handleGenerate}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all text-sm font-medium"
                    >
                      <Loader2 className="h-4 w-4" />
                      重试
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-border text-foreground hover:bg-accent/50 transition-all text-sm font-medium"
                  >
                    关闭
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
