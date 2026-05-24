'use client'

import React, { useState, useCallback } from 'react'
import {
  CheckSquare, Square, Sparkles, Save, Copy, Download,
  Loader2, ChevronDown, ChevronUp, X, Check, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Student, Class } from '@/types'
import { saveFeedbackHistory, sortStudents, getObservationRecords } from '@/lib/store'

interface BatchGenerateResult {
  success: boolean
  studentId: string
  studentName: string
  content?: string
  usedAI?: boolean
  error?: string
}

interface BatchFeedbackPanelProps {
  students: Student[]
  selectedClass: Class | undefined
  classContent: string
  onClose: () => void
}

export default function BatchFeedbackPanel({ students, selectedClass, classContent, onClose }: BatchFeedbackPanelProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [globalKeywords, setGlobalKeywords] = useState('')
  const [customKeywords, setCustomKeywords] = useState<Record<string, string>>({})
  const [isExpanded, setIsExpanded] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<BatchGenerateResult[]>([])
  const [generationProgress, setGenerationProgress] = useState(0)

  const sortedStudents = sortStudents(students)

  const toggleSelectAll = useCallback(() => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s) => s.id))
    }
  }, [selectedStudents.length, students])

  const toggleSelectStudent = useCallback((studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }, [])

  const handleGenerate = useCallback(async () => {
    if (selectedStudents.length === 0) {
      toast.error('请先选择要生成反馈的学生')
      return
    }

    if (!globalKeywords.trim() && !Object.keys(customKeywords).some((k) => customKeywords[k]?.trim())) {
      toast.error('请输入关键词或为学生设置自定义关键词')
      return
    }

    setIsGenerating(true)
    setResults([])
    setGenerationProgress(0)

    const toastId = toast.loading('正在批量生成反馈...')

    const studentsToGenerate = sortedStudents.filter((s) => selectedStudents.includes(s.id)).map((s) => {
      const obsRecords = getObservationRecords(undefined, s.id)
      return {
        id: s.id,
        name: s.name,
        keywords: customKeywords[s.id]?.trim() || globalKeywords.trim(),
        observations: obsRecords.length > 0 ? obsRecords.map(r => r.content) : undefined,
      }
    })

    try {
      const savedWordCount = localStorage.getItem('tabuddy_feedback_word_count')
      const wordCount = savedWordCount ? parseInt(savedWordCount, 10) : undefined

      const res = await fetch('/api/feedback/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: selectedClass?.id || '',
          students: studentsToGenerate,
          classContent: classContent.trim(),
          wordCount,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `请求失败 (${res.status})`)
      }

      const data = await res.json()
      setResults(data.data || [])
      setGenerationProgress(100)

      toast.dismiss(toastId)
      toast.success(data.message || '批量生成完成')
    } catch (err) {
      toast.dismiss(toastId)
      console.error('Batch generate error:', err)
      toast.error('批量生成失败，请稍后重试')
    } finally {
      setIsGenerating(false)
    }
  }, [selectedStudents, globalKeywords, customKeywords, selectedClass?.id, classContent, sortedStudents])

  const handleSaveAll = useCallback(() => {
    const successfulResults = results.filter((r) => r.success && r.content)
    if (successfulResults.length === 0) {
      toast.error('没有可保存的反馈')
      return
    }

    successfulResults.forEach((result) => {
      const keyword = customKeywords[result.studentId]?.trim() || globalKeywords.trim()
      saveFeedbackHistory({
        studentId: result.studentId,
        studentName: result.studentName,
        className: selectedClass?.name,
        inputKeywords: keyword ? [keyword] : [],
        generatedContent: result.content || '',
      })
    })

    toast.success(`已保存 ${successfulResults.length} 条反馈`)
    setResults([])
    setSelectedStudents([])
  }, [results, selectedClass?.name, customKeywords, globalKeywords])

  const handleCopyAll = useCallback(async () => {
    const successfulResults = results.filter((r) => r.success && r.content)
    if (successfulResults.length === 0) {
      toast.error('没有可复制的反馈')
      return
    }

    const text = successfulResults
      .map((r) => `【${r.studentName}】\n${r.content}\n`)
      .join('\n---\n\n')

    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制所有反馈到剪贴板')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }, [results])

  const handleExport = useCallback(() => {
    const successfulResults = results.filter((r) => r.success && r.content)
    if (successfulResults.length === 0) {
      toast.error('没有可导出的反馈')
      return
    }

    const text = successfulResults
      .map((r) => `【${r.studentName}】\n${r.content}\n`)
      .join('\n---\n\n')

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `批量反馈_${selectedClass?.name}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('导出成功')
  }, [results, selectedClass?.name])

  const handleCopySingle = useCallback(async (content: string, studentName: string) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success(`已复制 ${studentName} 的反馈`)
    } catch {
      toast.error('复制失败')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="rounded-xl border border-border bg-card shadow-lg overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">批量生成反馈</h3>
            <p className="text-xs text-muted-foreground">
              已选择 {selectedStudents.length} / {students.length} 名学生
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSelectAll}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border transition-all text-sm font-medium',
              selectedStudents.length === students.length
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-background text-foreground hover:bg-accent/50'
            )}
          >
            {selectedStudents.length === students.length ? (
              <CheckSquare className="h-4 w-4" />
            ) : (
              <Square className="h-4 w-4" />
            )}
            {selectedStudents.length === students.length ? '取消全选' : '全选'}
          </button>
          <span className="text-xs text-muted-foreground">
            {selectedStudents.length === 0 && '点击选择学生'}
            {selectedStudents.length > 0 && selectedStudents.length < students.length && `已选择 ${selectedStudents.length} 名学生`}
            {selectedStudents.length === students.length && '已选择全部学生'}
          </span>
        </div>

        <div className="rounded-lg border border-border bg-background p-4">
          <label className="text-sm font-medium text-foreground mb-2 block">全局关键词</label>
          <input
            type="text"
            value={globalKeywords}
            onChange={(e) => setGlobalKeywords(e.target.value)}
            placeholder="输入关键词，如：专注、认真、积极..."
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          <p className="text-xs text-muted-foreground/60 mt-2">
            设置后将应用到所有选中的学生，个别学生可设置自定义关键词
          </p>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>为学生设置自定义关键词</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2">
                {sortedStudents
                  .filter((s) => selectedStudents.includes(s.id))
                  .map((student) => (
                    <div key={student.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {student.name.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-foreground w-16">{student.name}</span>
                      <input
                        type="text"
                        value={customKeywords[student.id] || ''}
                        onChange={(e) =>
                          setCustomKeywords((prev) => ({
                            ...prev,
                            [student.id]: e.target.value,
                          }))
                        }
                        placeholder="自定义关键词（可选）"
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground/40 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedStudents.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all text-sm font-medium',
            isGenerating || selectedStudents.length === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md shadow-lg shadow-primary/20'
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              正在生成... ({generationProgress}%)
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              批量生成反馈 ({selectedStudents.length} 名学生)
            </>
          )}
        </button>

        {isGenerating && generationProgress < 100 && (
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              animate={{ width: `${generationProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border"
          >
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-foreground">
                  生成结果：
                </span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  ✓ 成功 {results.filter((r) => r.success).length}
                </span>
                <span className="text-xs text-red-500">
                  ✗ 失败 {results.filter((r) => !r.success).length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent/50 transition-all"
                >
                  <Copy className="h-3.5 w-3.5" />
                  复制全部
                </button>
                <button
                  onClick={handleExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent/50 transition-all"
                >
                  <Download className="h-3.5 w-3.5" />
                  导出
                </button>
                <button
                  onClick={handleSaveAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  保存全部
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {results.map((result, index) => (
                <motion.div
                  key={result.studentId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'px-5 py-4 border-b border-border/50 last:border-b-0',
                    result.success ? 'bg-background' : 'bg-red-50/50 dark:bg-red-900/10'
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          result.success ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                        )}
                      >
                        {result.success ? (
                          <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{result.studentName}</p>
                        {result.error && (
                          <p className="text-xs text-red-500 mt-0.5">{result.error}</p>
                        )}
                      </div>
                    </div>
                    {result.success && result.content && (
                      <button
                        onClick={() => handleCopySingle(result.content!, result.studentName)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                        title="复制反馈"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {result.success && result.content && (
                    <div className="mt-3 pl-11">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {result.content}
                      </p>
                      {result.usedAI !== undefined && (
                        <span
                          className={cn(
                            'inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded-full',
                            result.usedAI
                              ? 'bg-primary/10 text-primary'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                          )}
                        >
                          {result.usedAI ? 'AI生成' : '本地话术'}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}