'use client'

import React from 'react'
import {
  Star, Monitor,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEscapeKey } from '@/lib/use-escape-key'

interface AutoFillConfigPanelProps {
  open: boolean
  onClose: () => void
}

export default function AutoFillConfigPanel({ open, onClose }: AutoFillConfigPanelProps) {
  useEscapeKey(onClose, open)

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
            className="relative w-full max-w-md max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">书签配置</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    通过浏览器书签快速复制反馈
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/30">
                <Monitor className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    书签使用流程
                  </p>
                  <ol className="text-xs text-purple-700 dark:text-purple-400 mt-1 list-decimal list-inside space-y-0.5">
                    <li>在反馈/作业页面为所有学生生成内容</li>
                    <li>点击「生成书签」→ 拖拽按钮到浏览器书签栏</li>
                    <li>在任意页面点击书签打开浮动面板</li>
                    <li>再次点击书签可隐藏/显示面板</li>
                  </ol>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground mb-2">快捷键说明</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>切换学生</span>
                    <kbd className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono">↑ ↓</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>快速选择 (1~9)</span>
                    <kbd className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono">1 ~ 9</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>复制当前反馈</span>
                    <kbd className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono">Ctrl + C</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>最小化/恢复</span>
                    <kbd className="px-2 py-0.5 rounded bg-background border border-border text-xs font-mono">Esc / 再点书签</kbd>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-foreground mb-2">鼠标操作</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>拖拽移动</span>
                    <span className="text-foreground">按住标题栏拖动</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>调整大小</span>
                    <span className="text-foreground">拖拽右下角</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>最小化</span>
                    <span className="text-foreground">点击标题栏 — 按钮</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>彻底关闭</span>
                    <span className="text-foreground">点击标题栏 × 按钮</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30">
                <Star className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">提示</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                    生成书签后才能使用快捷键。每次重新生成反馈后需要重新生成书签以更新数据。
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-border shrink-0">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium shadow-sm"
              >
                知道了
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
