'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  GraduationCap, Plus, Pencil, Trash2, ChevronDown,
  BookOpen, Users, Target, Sparkles, RefreshCw, Copy, Download,
  Save, Loader2, AlertCircle, X, Check,
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatFileSize } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FeedbackRecord,
  Student,
  Class,
} from '@/types'
import {
  getClasses,
  getStudentsByClass,
  getFeedbackHistoryByStudent,
  saveFeedbackHistory,
  deleteFeedbackHistory,
} from '@/lib/store'
import { useAutoClass, getAutoSelectedClassId } from '@/lib/use-auto-class'
import { PageContainer } from '@/components/ui/page-container'
import { useCopyShortcut } from '@/lib/copy-shortcut'

export default function FeedbackPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClassLoading, setIsClassLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const classSelectRef = useRef<HTMLDivElement>(null)
  const studentListRef = useRef<HTMLDivElement>(null)
  const { teachingClassId, isTeachingClass, saveManualSelection } = useAutoClass(classes)

  const [keywords, setKeywords] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null)
  const [usedAI, setUsedAI] = useState(false)
  const [classContent, setClassContent] = useState('')

  useEffect(() => {
    const saved = sessionStorage.getItem('tabuddy_class_content')
    if (saved) setClassContent(saved)
  }, [])

  useEffect(() => {
    if (classContent) {
      sessionStorage.setItem('tabuddy_class_content', classContent)
    } else {
      sessionStorage.removeItem('tabuddy_class_content')
    }
  }, [classContent])

  useEffect(() => {
    const loadedClasses = getClasses()
    setClasses(loadedClasses)
    if (loadedClasses.length > 0) {
      const initialId = getAutoSelectedClassId(loadedClasses) || loadedClasses[0].id
      setSelectedClassId(initialId)
      const classStudents = getStudentsByClass(initialId)
      setStudents(classStudents)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classSelectRef.current && !classSelectRef.current.contains(event.target as Node)) {
        setIsClassSelectOpen(false)
      }
    }
    if (isClassSelectOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isClassSelectOpen])

  useEffect(() => {
    if (selectedStudentId) {
      setFeedbacks(getFeedbackHistoryByStudent(selectedStudentId))
    } else {
      setFeedbacks([])
    }
  }, [selectedStudentId])

  const refreshFeedbacks = useCallback(() => {
    if (selectedStudentId) {
      setFeedbacks(getFeedbackHistoryByStudent(selectedStudentId))
    }
  }, [selectedStudentId])

  const handleDelete = (id: string) => {
    deleteFeedbackHistory(id)
    refreshFeedbacks()
    toast.success('反馈已删除')
  }

  const handleStudentClick = useCallback((studentId: string) => {
    if (studentId === selectedStudentId) return
    setGeneratedContent('')
    setEditingContent('')
    setIsEditing(false)
    setEditingFeedbackId(null)
    setKeywords('')
    setIsTransitioning(true)
    setTimeout(() => {
      try {
        setSelectedStudentId(studentId)
      } catch {
        toast.error('加载反馈记录失败')
      }
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 150)
  }, [selectedStudentId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      const currentIndex = students.findIndex(s => s.id === selectedStudentId)
      let nextIndex: number
      if (currentIndex === -1) {
        nextIndex = e.key === 'ArrowDown' ? 0 : students.length - 1
      } else {
        nextIndex = e.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, students.length - 1)
          : Math.max(currentIndex - 1, 0)
      }
      if (nextIndex >= 0 && nextIndex < students.length && students[nextIndex]?.id !== selectedStudentId) {
        handleStudentClick(students[nextIndex].id)
      }
    }
    if (students.length > 0) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [students, selectedStudentId, handleStudentClick])

  const handleClassSwitch = useCallback((classId: string) => {
    if (classId === selectedClassId) {
      setIsClassSelectOpen(false)
      return
    }
    setIsClassLoading(true)
    setIsClassSelectOpen(false)
    setTimeout(() => {
      try {
        const classStudents = getStudentsByClass(classId)
        setStudents(classStudents)
        setSelectedClassId(classId)
        saveManualSelection(classId)
        setSelectedStudentId('')
        setFeedbacks([])
        setGeneratedContent('')
        setEditingContent('')
        setIsEditing(false)
        setEditingFeedbackId(null)
        setKeywords('')
      } catch {
        toast.error('班级数据加载失败，请重试')
      }
      setTimeout(() => {
        setIsClassLoading(false)
      }, 100)
    }, 200)
  }, [selectedClassId, saveManualSelection])

  const selectedClass = classes.find((c) => c.id === selectedClassId)
  const selectedStudent = students.find((s) => s.id === selectedStudentId)

  const totalFeedbacksInClass = React.useMemo(() => {
    if (!selectedClassId) return 0
    return students.reduce((sum, s) => sum + getFeedbackHistoryByStudent(s.id).length, 0)
  }, [selectedClassId, students])

  const handleGenerate = async () => {
    if (!selectedStudent || !keywords.trim()) {
      toast.error(selectedStudent ? '请输入关键词' : '请先选择学生')
      return
    }

    if (!classContent.trim()) {
      toast.warning('请先填写本节课课堂内容，再生成学情反馈，反馈会更加精准贴合课堂情况', {
        duration: 4000,
      })
      return
    }

    setGenerating(true)
    setGeneratedContent('')
    setEditingContent('')
    setIsEditing(false)
    setEditingFeedbackId(null)

    const toastId = toast.loading('AI 正在生成反馈...')

    try {
      const res = await fetch('/api/feedback/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keywords: keywords.trim(),
          studentName: selectedStudent.name,
          studentId: selectedStudent.id,
          history: getFeedbackHistoryByStudent(selectedStudent.id)
            .slice(0, 10)
            .map((r) => r.generatedContent)
            .filter(Boolean),
          classContent: classContent.trim(),
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `请求失败 (${res.status})`)
      }

      const data = await res.json()
      setGeneratedContent(data.content)
      setEditingContent(data.content)
      setUsedAI(data.usedAI)

      toast.dismiss(toastId)
      if (data.usedAI) {
        toast.success('AI 反馈生成完成')
      } else {
        toast.success('已使用本地话术库生成反馈', {
          description: 'AI 服务暂不可用，已自动降级为本地话术库生成',
          duration: 5000,
        })
      }
    } catch (err) {
      toast.dismiss(toastId)
      console.error('Generate error:', err)
      toast.error('生成失败，请稍后重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleRegenerate = () => {
    if (generating) return
    handleGenerate()
  }

  const handleSaveFeedback = () => {
    if (!selectedStudent || !selectedClassId || !editingContent.trim()) {
      toast.error('反馈内容不能为空')
      return
    }

    saveFeedbackHistory({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: selectedClass?.name,
      inputKeywords: keywords.trim() ? [keywords.trim()] : [],
      generatedContent: editingContent.trim(),
    })

    setGeneratedContent('')
    setEditingContent('')
    setIsEditing(false)
    setEditingFeedbackId(null)
    setKeywords('')
    refreshFeedbacks()
    toast.success('反馈已保存')
  }

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  useCopyShortcut('feedback-page', useCallback(() => {
    const content = editingContent || generatedContent
    if (content) {
      handleCopyText(content)
    } else if (feedbacks.length > 0) {
      handleCopyText(feedbacks[0].generatedContent)
    } else {
      toast.error('当前没有可复制的内容')
    }
  }, [editingContent, generatedContent, feedbacks]))

  const handleExport = async () => {
    if (!selectedClass) return

    const allFeedbacks = students.map((s) => ({
      student: s,
      records: getFeedbackHistoryByStudent(s.id),
    }))

    const hasAny = allFeedbacks.some((f) => f.records.length > 0)
    if (!hasAny) {
      toast.error('当前班级暂无任何反馈记录，无法导出')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('正在生成导出文件...')
    try {
      const { exportFeedbackDocx } = await import('@/lib/export-feedback')
      const studentData = new Map<string, { name: string; feedbacks: { content: string; keywords: string; createdAt: Date }[] }>()
      for (const { student, records } of allFeedbacks) {
        if (records.length === 0) continue
        studentData.set(student.id, {
          name: student.name,
          feedbacks: records.map((r) => ({
            content: r.generatedContent,
            keywords: r.inputKeywords?.join('、') || '通用',
            createdAt: r.createdAt,
          })),
        })
      }
      const result = await exportFeedbackDocx({ className: selectedClass.name, studentData })
      toast.dismiss(toastId)
      if (result.usedFallback) {
        toast.success(
          <div>
            <p className="font-medium">导出成功，文件已开始下载</p>
            <p className="text-xs text-amber-700 mt-1">Word生成异常，已自动降级为TXT文件</p>
          </div>,
          { duration: 6000 }
        )
      } else {
        toast.success('导出成功，文件已开始下载')
      }
    } catch (e) {
      toast.dismiss(toastId)
      toast.error('导出失败，请重试')
      console.error(e)
    } finally {
      setIsExporting(false)
    }
  }

  if (classes.length === 0) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">学情反馈</h1>
            <p className="text-muted-foreground mt-1">AI 自动分析学情数据，生成专业学生反馈</p>
          </div>
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <GraduationCap className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">请先添加班级</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              还没有创建任何班级，请先前往班级管理系统添加班级和学生，然后生成学情反馈。
            </p>
            <Link
              href="/classes"
              className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
            >
              <Users className="h-4 w-4 mr-2" />
              前往班级管理
            </Link>
          </div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center flex-wrap gap-3 justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">学情反馈</h1>
            <p className="text-muted-foreground mt-1">AI 自动分析学情数据，生成专业学生反馈</p>
          </div>
        </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="relative" ref={classSelectRef}>
            <button
              type="button"
              onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
              className="inline-flex items-center px-4 py-3 rounded-lg border border-border bg-background text-foreground hover:bg-accent/50 transition-all text-sm font-medium cursor-pointer shrink-0"
            >
              <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>
                {selectedClass ? selectedClass.name : '选择班级'}
                {selectedClass && isTeachingClass(selectedClass.id) && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正在上课</span>
                )}
              </span>
              <ChevronDown className={`h-4 w-4 ml-2 text-muted-foreground transition-transform ${isClassSelectOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isClassSelectOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 z-50 min-w-[200px]"
                >
                  <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                    <div className="max-h-60 overflow-y-auto">
                      {classes.map((cls) => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handleClassSwitch(cls.id)}
                          className={cn(
                            'w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent flex items-center justify-between',
                            selectedClassId === cls.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                          )}
                        >
                          <span>
                            {cls.name}
                            {isTeachingClass(cls.id) && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">正在上课</span>
                            )}
                          </span>
                          {selectedClassId === cls.id && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {selectedClassId && (
            <div className="flex items-center gap-3 flex-1 max-w-[340px]">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">班级人数</p>
                  <p className="text-lg font-bold leading-tight mt-0.5 text-foreground">
                    {students.length}
                  </p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 shrink-0">
                  <GraduationCap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">反馈总数</p>
                  <p className="text-lg font-bold leading-tight mt-0.5 text-foreground">
                    {totalFeedbacksInClass}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedClassId && (
          <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleExport}
                disabled={isExporting || totalFeedbacksInClass === 0}
                title={totalFeedbacksInClass === 0 ? '暂无反馈记录，无法导出' : '一键导出'}
                className={cn(
                  'inline-flex items-center px-5 py-3 rounded-lg border border-border transition-all text-sm font-medium',
                  totalFeedbacksInClass === 0
                    ? 'text-muted-foreground cursor-not-allowed bg-muted/30'
                    : 'text-foreground hover:bg-accent/50 bg-background hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                )}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isExporting ? '正在导出...' : '一键导出'}
              </button>
            </div>
          )}
      </div>

      {!selectedClassId ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">请选择一个班级</h3>
          <p className="text-muted-foreground mt-1">从上方选择班级以查看学生和反馈记录</p>
        </div>
      ) : (
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-6">
          {isClassLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-20">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">切换班级中...</span>
              </div>
            </div>
          )}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="rounded-xl border border-border bg-card flex flex-col flex-1 min-h-0 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0">
                <h3 className="text-sm font-medium text-foreground flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  学生列表
                  <span className="ml-2 text-xs text-muted-foreground">({students.length})</span>
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[560px]">
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">该班级暂无学生</p>
                    <Link
                      href={`/classes/${selectedClassId}`}
                      className="inline-flex items-center text-xs text-primary hover:underline mt-2"
                    >
                      前往添加学生
                    </Link>
                  </div>
                ) : (
                  students.map((student) => {
                    const studentFeedbacks = getFeedbackHistoryByStudent(student.id)
                    const latest = studentFeedbacks.length > 0
                      ? studentFeedbacks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
                      : null
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleStudentClick(student.id)}
                        className={cn(
                          'w-full px-4 py-3.5 text-left transition-all hover:bg-accent/50 flex items-center gap-3 border-b border-border/50 last:border-b-0',
                          selectedStudentId === student.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                          {latest && (
                            <p className="text-xs text-muted-foreground truncate">
                              最近反馈: {new Date(latest.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </div>
                        {studentFeedbacks.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {studentFeedbacks.length}
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 flex flex-col min-h-0 relative">
            <div className={cn(
              'flex flex-col flex-1 min-h-0 transition-all duration-[400ms]',
              isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
            )}>
              {!selectedStudentId ? (
                <div className="relative flex-1 text-center rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                    <div className="grid grid-cols-5 gap-8 rotate-12 scale-150">
                      {Array.from({ length: 15 }).map((_, i) => (
                        <BookOpen key={i} className="h-14 w-14 text-foreground" />
                      ))}
                    </div>
                  </div>
                  <div className="relative flex flex-col items-center justify-center h-full px-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-5">
                      <GraduationCap className="h-8 w-8 text-muted-foreground" />
                    </div>
                    {students.length === 0 && selectedClassId ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">该班级暂无学生</h3>
                        <p className="text-muted-foreground/80 mt-2 text-sm">请先添加学生后再生成学情反馈</p>
                        <Link
                          href={`/classes/${selectedClassId}`}
                          className="inline-flex items-center px-4 py-2 mt-6 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                        >
                          前往添加学生
                        </Link>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">请选择一名学生</h3>
                        <p className="text-muted-foreground/80 mt-2 text-sm">点击左侧学生查看或生成学情反馈</p>
                        <p className="text-muted-foreground/60 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                          支持关键词生成和图片自动分析两种方式，AI 自动生成专业学情反馈
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                  <div className="shrink-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium text-foreground flex items-center gap-2">
                        {selectedStudent?.name}
                        <span className="text-xs text-muted-foreground font-normal">
                          {feedbacks.length > 0 ? `${feedbacks.length} 条历史反馈` : '暂无反馈记录'}
                        </span>
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        今日课堂内容
                      </label>
                      {classContent && (
                        <button
                          onClick={() => setClassContent('')}
                          className="inline-flex items-center px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          清空
                        </button>
                      )}
                    </div>
                    <textarea
                      value={classContent}
                      onChange={(e) => setClassContent(e.target.value)}
                      placeholder="填写本节课知识点、课堂任务、学习重点、课堂活动等内容，帮助 AI 生成更精准贴合课堂实际的学情反馈..."
                      className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none min-h-[80px] leading-relaxed"
                      disabled={generating}
                      rows={3}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 shadow-sm shrink-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 relative min-w-[200px]">
                        <input
                          type="text"
                          value={keywords}
                          onChange={(e) => setKeywords(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !generating) {
                              handleGenerate()
                            }
                          }}
                          placeholder="输入课堂关键词，如：专注、认真、课堂分心、积极、调皮..."
                          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          disabled={generating}
                        />
                      </div>
                      <button
                        onClick={handleGenerate}
                        disabled={generating || !keywords.trim()}
                        className={cn(
                          'inline-flex items-center px-4 py-2.5 rounded-lg transition-all text-sm font-medium shrink-0',
                          generating || !keywords.trim()
                            ? 'bg-muted text-muted-foreground cursor-not-allowed'
                            : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md cursor-pointer'
                        )}
                      >
                        {generating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            生成中...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            AI 生成
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      支持关键词：专注、认真、课堂分心、内向、积极、调皮、进步、努力、自信、害羞等
                    </p>
                  </div>

                  {generating && (
                    <div className="flex-1 rounded-xl border border-border bg-card p-10 shadow-sm flex items-center justify-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                          <Loader2 className="h-10 w-10 text-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary/60" />
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground">
                            AI 正在生成反馈...
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            根据关键词和话术库智能创作中
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!generating && generatedContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-1 flex flex-col min-h-0 space-y-4"
                    >
                      <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <div className="px-4 py-3 border-b border-border bg-muted/30 shrink-0 flex items-center justify-between">
                          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Sparkles className={cn('h-4 w-4', usedAI ? 'text-primary' : 'text-amber-500')} />
                            生成的反馈
                            {usedAI ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-normal">AI</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-normal">本地</span>
                            )}
                          </h4>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyText(editingContent || generatedContent)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              title="复制文本"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleRegenerate}
                              disabled={generating}
                              className={cn(
                                'p-1.5 rounded-lg transition-all',
                                generating
                                  ? 'text-muted-foreground/30 cursor-not-allowed'
                                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                              )}
                              title="重新生成"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                            <span className="text-muted-foreground/20">|</span>
                            <button
                              onClick={handleSaveFeedback}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-xs font-medium"
                            >
                              <Save className="h-3.5 w-3.5 mr-1.5" />
                              保存反馈
                            </button>
                          </div>
                        </div>
                        <div className="p-5 overflow-y-auto max-h-[300px]">
                          {isEditing ? (
                            <textarea
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full min-h-[200px] px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            />
                          ) : (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {editingContent || generatedContent}
                            </p>
                          )}
                        </div>
                        {isEditing && (
                          <div className="px-4 py-3 border-t border-border bg-muted/20 flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setIsEditing(false)
                                setEditingContent(generatedContent)
                              }}
                              className="px-3 py-1.5 rounded-lg border border-border text-foreground text-xs hover:bg-accent transition-all"
                            >
                              取消编辑
                            </button>
                            <button
                              onClick={() => {
                                setIsEditing(false)
                                toast.success('修改已应用')
                              }}
                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs hover:bg-primary/90 transition-all"
                            >
                              确认修改
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-center gap-3">
                        {!isEditing && (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent/50 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            手动编辑
                          </button>
                        )}
                        <button
                          onClick={handleRegenerate}
                          disabled={generating}
                          className={cn(
                            'inline-flex items-center px-4 py-2 rounded-lg border border-border transition-all text-sm font-medium',
                            generating
                              ? 'text-muted-foreground cursor-not-allowed bg-muted/30'
                              : 'text-foreground hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-md'
                          )}
                        >
                          <RefreshCw className={cn('h-4 w-4 mr-2', generating ? 'animate-spin' : '')} />
                          重新生成
                        </button>
                        <button
                          onClick={() => handleCopyText(editingContent || generatedContent)}
                          className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-foreground hover:bg-accent/50 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          复制文本
                        </button>
                        <button
                          onClick={handleSaveFeedback}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          保存反馈
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {!generating && !generatedContent && feedbacks.length > 0 && (
                    <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="h-full overflow-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border bg-muted/50">
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[100px]">日期</th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[120px]">关键词</th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">反馈内容</th>
                              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[90px]">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {[...feedbacks]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .map((record) => (
                                <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                  <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                    {new Date(record.createdAt).toLocaleDateString('zh-CN')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary whitespace-nowrap">
                                      {record.inputKeywords?.join('、') || '通用'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-muted-foreground max-w-[240px] truncate">
                                    {record.generatedContent}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleCopyText(record.generatedContent)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                                        title="复制反馈"
                                      >
                                        <Copy className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(record.id)}
                                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                        title="删除"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {!generating && !generatedContent && feedbacks.length === 0 && (
                    <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm flex items-center justify-center">
                      <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted mb-4">
                          <GraduationCap className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-base font-medium text-foreground mb-1">暂无反馈记录</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          为 {selectedStudent?.name} 生成学情反馈
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xs mx-auto">
                          {['专注', '认真', '积极', '课堂分心', '内向', '调皮'].map((kw) => (
                            <button
                              key={kw}
                              onClick={() => {
                                setKeywords(kw)
                              }}
                              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-all"
                            >
                              {kw}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {isTransitioning && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">切换中...</span>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </PageContainer>
  )
}
