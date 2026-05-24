'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Copy, ChevronLeft, ChevronRight, Check, X, ClipboardCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useEscapeKey } from '@/lib/use-escape-key'

interface CopyGuideEntry {
  studentId: string
  studentName: string
  content: string
}

interface CopyGuideDialogProps {
  entries: CopyGuideEntry[]
  onClose: () => void
  open: boolean
}

export default function CopyGuideDialog({ entries, onClose, open }: CopyGuideDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

  const total = entries.length
  const current = entries[currentIndex]
  const isFirst = currentIndex === 0
  const isLast = currentIndex === total - 1
  const allCopied = copiedIds.size === total

  useEffect(() => {
    setCurrentIndex(0)
    setCopiedIds(new Set())
  }, [open])

  useEscapeKey(onClose, open)

  const goNext = useCallback(() => {
    if (!isLast) {
      setCurrentIndex((prev) => prev + 1)
    }
  }, [isLast])

  const goPrev = useCallback(() => {
    if (!isFirst) {
      setCurrentIndex((prev) => prev - 1)
    }
  }, [isFirst])

  const handleCopy = useCallback(async () => {
    if (!current) return
    try {
      await navigator.clipboard.writeText(current.content)
      const newCopied = new Set(copiedIds)
      newCopied.add(current.studentId)
      setCopiedIds(newCopied)
      toast.success(`已复制 ${current.studentName} 的反馈，共 ${newCopied.size}/${total}`)
      if (!isLast) {
        setTimeout(() => goNext(), 150)
      }
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }, [current, copiedIds, total, isLast, goNext])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        if (!isLast) goNext()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        if (!isFirst) goPrev()
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        handleCopy()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, isLast, isFirst, goNext, goPrev, handleCopy])

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
            className="relative w-full max-w-2xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-foreground">逐条复制反馈</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  按 Ctrl+C 快速复制并自动跳转下一位
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(copiedIds.size / total) * 100}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 200 }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  已复制 {copiedIds.size}/{total}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {allCopied ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <ClipboardCheck className="h-8 w-8 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold text-foreground mb-2">全部完成！</h4>
                  <p className="text-sm text-muted-foreground">
                    已成功复制全部 {total} 位学生的反馈
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {current.studentName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">
                          {current.studentName}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          第 {currentIndex + 1} 位 / 共 {total} 位
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/30 p-5 mb-6">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {current.content}
                      </p>
                    </div>

                    <motion.button
                      onClick={handleCopy}
                      className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 hover:shadow-xl transition-all"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Copy className="h-5 w-5" />
                      复制当前
                    </motion.button>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={goPrev}
                disabled={isFirst}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                上一位
              </button>

              <div className="flex items-center gap-1.5">
                {entries.map((entry, idx) => (
                  <button
                    key={entry.studentId}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-7 h-7 rounded-full text-xs font-medium transition-all flex items-center justify-center ${
                      idx === currentIndex
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : copiedIds.has(entry.studentId)
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-muted text-muted-foreground hover:bg-accent'
                    }`}
                    title={entry.studentName}
                  >
                    {copiedIds.has(entry.studentId) ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      idx + 1
                    )}
                  </button>
                ))}
              </div>

              {isLast && !allCopied ? (
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium shadow-sm"
                >
                  <Check className="h-4 w-4" />
                  完成
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={isLast}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  下一位
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
