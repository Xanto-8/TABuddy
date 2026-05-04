'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  ClipboardCheck, Plus, Pencil, Trash2, ChevronDown,
  BookOpen, Users, Target, FileText, Clock, AlertCircle,
  Sparkles, RefreshCw, Copy, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CompletionStatus,
  HandwritingQuality,
  HomeworkAssessment,
  Student,
  Class,
} from '@/types'
import {
  getClasses,
  getStudentsByClass,
  getHomeworkAssessmentsByStudent,
  saveHomeworkAssessment,
  updateHomeworkAssessment,
  deleteHomeworkAssessment,
} from '@/lib/store'
import { useAutoClass, getAutoSelectedClassId } from '@/lib/use-auto-class'
import { isStudentAbsent } from '@/lib/absence-store'
import { generateHomeworkFeedback } from '@/utils'
import { PageContainer } from '@/components/ui/page-container'
import { useCopyShortcut } from '@/lib/copy-shortcut'

const completionLabels: Record<CompletionStatus, string> = {
  completed: '已完成',
  partial: '部分完成',
  not_done: '未完成',
}

const completionColors: Record<CompletionStatus, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  not_done: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const handwritingLabels: Record<HandwritingQuality, string> = {
  excellent: '非常工整',
  good: '清晰',
  fair: '一般',
  poor: '需改进',
}

const handwritingColors: Record<HandwritingQuality, string> = {
  excellent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  good: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  fair: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  poor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export default function HomeworkPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [assessments, setAssessments] = useState<HomeworkAssessment[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [isClassSelectOpen, setIsClassSelectOpen] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClassLoading, setIsClassLoading] = useState(false)
  const classSelectRef = useRef<HTMLDivElement>(null)
  const studentListRef = useRef<HTMLDivElement>(null)
  const { teachingClassId, isTeachingClass, saveManualSelection } = useAutoClass(classes)

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
    if (selectedClassId) {
      setStudents(getStudentsByClass(selectedClassId))
      setSelectedStudentId('')
      setAssessments([])
    } else {
      setStudents([])
      setSelectedStudentId('')
      setAssessments([])
    }
  }, [selectedClassId])

  useEffect(() => {
    if (selectedStudentId) {
      setAssessments(getHomeworkAssessmentsByStudent(selectedStudentId))
    } else {
      setAssessments([])
    }
  }, [selectedStudentId])

  const refreshAssessments = () => {
    if (selectedStudentId) {
      setAssessments(getHomeworkAssessmentsByStudent(selectedStudentId))
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条评估记录吗？')) {
      deleteHomeworkAssessment(id)
      refreshAssessments()
      toast.success('评估记录已删除')
    }
  }

  const handleSaved = () => {
    setShowModal(false)
    refreshAssessments()
  }

  const handleStudentClick = useCallback((studentId: string) => {
    if (studentId === selectedStudentId) return
    setIsTransitioning(true)
    setTimeout(() => {
      try {
        setSelectedStudentId(studentId)
      } catch {
        toast.error('加载评估记录失败')
      }
      setTimeout(() => {
        setIsTransitioning(false)
      }, 50)
    }, 150)
  }, [selectedStudentId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) return
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
  }, [students, selectedStudentId, showModal, handleStudentClick])

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
        setAssessments([])
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

  const avgAccuracy = assessments.length > 0
    ? Math.round(assessments.reduce((sum, a) => sum + a.accuracy, 0) / assessments.length)
    : 0

  const recentAssessment = assessments.length > 0
    ? assessments.sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
    : null

  if (classes.length === 0) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">作业评估</h1>
            <p className="text-muted-foreground mt-1">记录和评估学生的作业完成情况</p>
          </div>
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">请先添加班级</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            还没有创建任何班级，请先前往班级管理系统添加班级和学生，然后进行作业评估。
          </p>
          <Link
            href="/classes"
            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
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
          <h1 className="text-2xl font-bold text-foreground">作业评估</h1>
          <p className="text-muted-foreground mt-1">记录和评估学生的作业完成情况</p>
        </div>
      </div>

      <div className="relative" ref={classSelectRef}>
        <button
          type="button"
          onClick={() => setIsClassSelectOpen(!isClassSelectOpen)}
          className="inline-flex items-center px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent/50 transition-all text-sm font-medium cursor-pointer"
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

      {!selectedClassId ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">请选择一个班级</h3>
          <p className="text-muted-foreground mt-1">从上方选择班级以查看学生和评估记录</p>
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
                    const studentAssessments = getHomeworkAssessmentsByStudent(student.id)
                    const latest = studentAssessments.length > 0
                      ? studentAssessments.sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
                      : null
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleStudentClick(student.id)}
                        className={cn(
                          'w-full px-4 py-3 text-left transition-all hover:bg-accent/50 flex items-center gap-3 border-b border-border/50 last:border-b-0',
                          selectedStudentId === student.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'
                        )}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-primary">{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                            {isStudentAbsent(student.id) && (
                              <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-400 font-medium shrink-0">
                                已请假
                              </span>
                            )}
                          </div>
                          {latest && (
                            <p className="text-xs text-muted-foreground truncate">
                              最近评估: {new Date(latest.assessedAt).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </div>
                        {studentAssessments.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {studentAssessments.length}
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
                      <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                    </div>
                    {students.length === 0 && selectedClassId ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">该班级暂无学生</h3>
                        <p className="text-muted-foreground/80 mt-2 text-sm">请先添加学生后再进行作业评估</p>
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
                        <p className="text-muted-foreground/80 mt-2 text-sm">点击左侧学生查看或添加作业评估记录</p>
                        <p className="text-muted-foreground/60 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                          记录学生的作业完成度、字迹质量和正确率，并自动生成评语反馈
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                  <div className="grid grid-cols-3 gap-3 shrink-0">
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">评估次数</p>
                          <p className="text-2xl font-bold text-foreground">{assessments.length}</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-primary/10">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">平均正确率</p>
                          <p className="text-2xl font-bold text-foreground">
                            {assessments.length > 0 ? `${avgAccuracy}%` : '-'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">最近评估</p>
                          <p className="text-lg font-bold text-foreground">
                            {recentAssessment ? new Date(recentAssessment.assessedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '-'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                          <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between shrink-0 flex-wrap gap-3">
                    <div>
                      <h3 className="text-base font-medium text-foreground">
                        {selectedStudent?.name} 的评估记录
                      </h3>
                    </div>
                    <button
                      onClick={() => setShowModal(true)}
                      className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md whitespace-nowrap"
                    >
                      <Plus className="h-4 w-4 mr-2 shrink-0" />
                      新增评估
                    </button>
                  </div>

                  {assessments.length === 0 ? (
                    <div className="relative flex-1 text-center rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                        <div className="grid grid-cols-5 gap-6 scale-125">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <ClipboardCheck key={i} className="h-11 w-11 text-foreground" />
                          ))}
                        </div>
                      </div>
                      <div className="relative flex flex-col items-center justify-center h-full px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-5">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">暂无评估记录</h3>
                        <p className="text-muted-foreground/80 mb-6">
                          还没有为 {selectedStudent?.name} 记录过作业评估
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setShowModal(true)}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            新增评估
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="h-full overflow-auto">
                        <table className="w-full">
                        <thead>
                          <tr className="border-b border-border bg-muted/50">
                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">评估日期</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">完成度</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">字迹</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">正确率</th>
                            <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">反馈</th>
                            <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {[...assessments]
                            .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
                            .map((assessment) => (
                              <tr key={assessment.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                  {new Date(assessment.assessedAt).toLocaleDateString('zh-CN')}
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap hover:brightness-110 transition-all', completionColors[assessment.completion])}>
                                    {completionLabels[assessment.completion]}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap', handwritingColors[assessment.handwriting])}>
                                    {handwritingLabels[assessment.handwriting]}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 max-w-[80px] h-1.5 rounded-full bg-muted overflow-hidden">
                                      <div
                                        className={cn(
                                          'h-full rounded-full transition-all',
                                          assessment.accuracy >= 80 ? 'bg-green-500' :
                                          assessment.accuracy >= 60 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        )}
                                        style={{ width: `${assessment.accuracy}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground min-w-[32px]">
                                      {assessment.accuracy}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-muted-foreground max-w-[180px] truncate">
                                  {assessment.generatedFeedback || assessment.feedback || '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        const feedbackText = assessment.generatedFeedback || assessment.feedback
                                        if (!feedbackText) return
                                        navigator.clipboard.writeText(feedbackText)
                                          .then(() => toast.success('反馈已复制到剪贴板'))
                                          .catch(() => toast.error('复制失败，请手动复制'))
                                      }}
                                      className={cn(
                                        'p-1.5 rounded-lg transition-all',
                                        (assessment.generatedFeedback || assessment.feedback)
                                          ? 'text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                          : 'text-muted-foreground/30 cursor-not-allowed'
                                      )}
                                      title="复制反馈"
                                      disabled={!(assessment.generatedFeedback || assessment.feedback)}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(assessment.id)}
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

      <AnimatePresence>
        {showModal && selectedStudentId && (
          <AddAssessmentModal
            student={selectedStudent!}
            onClose={() => setShowModal(false)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
      </div>
    </PageContainer>
  )
}

function AddAssessmentModal({
  student,
  onClose,
  onSaved,
}: {
  student: Student
  onClose: () => void
  onSaved: () => void
}) {
  const [completion, setCompletion] = useState<CompletionStatus>('completed')
  const [handwriting, setHandwriting] = useState<HandwritingQuality>('good')
  const [accuracy, setAccuracy] = useState(80)
  const [feedback, setFeedback] = useState('')
  const [generatedFeedback, setGeneratedFeedback] = useState('')
  const [saving, setSaving] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const accuracyRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const handleEnterKey = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  useEffect(() => {
    setGeneratedFeedback(generateHomeworkFeedback(completion, handwriting, accuracy, feedback, student.name))
  }, [completion, handwriting, accuracy, feedback, student.name])

  const handleRegenerate = () => {
    setGeneratedFeedback(generateHomeworkFeedback(completion, handwriting, accuracy, feedback, student.name))
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedFeedback)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  useCopyShortcut('homework-assessment-form', useCallback(() => {
    if (generatedFeedback) {
      navigator.clipboard.writeText(generatedFeedback)
        .then(() => {
          setCopySuccess(true)
          setTimeout(() => setCopySuccess(false), 2000)
        })
        .catch(() => toast.error('复制失败，请手动复制'))
    } else {
      toast.error('当前没有可复制的内容')
    }
  }, [generatedFeedback]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    saveHomeworkAssessment({
      studentId: student.id,
      completion,
      handwriting,
      accuracy,
      feedback,
      generatedFeedback,
      submittedAt: new Date(),
    })
    setSaving(false)
    toast.success('评估记录已保存')
    onSaved()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <div
          className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-[560px] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 pb-0 flex-shrink-0">
            <h2 className="text-base sm:text-lg font-semibold text-foreground mb-1">
              新增作业评估
            </h2>
            <p className="text-sm text-muted-foreground">
              正在评估: <span className="font-medium text-foreground">{student.name}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 w-full">
            <div className="flex-1 overflow-y-auto scrollbar-thin pt-4 pb-3 px-4 space-y-4 w-full min-h-0">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  完成度 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['completed', 'partial', 'not_done'] as CompletionStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setCompletion(status)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        completion === status
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent/50'
                      )}
                    >
                      {completionLabels[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  字迹质量 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['excellent', 'good', 'fair', 'poor'] as HandwritingQuality[]).map((quality) => (
                    <button
                      key={quality}
                      type="button"
                      onClick={() => setHandwriting(quality)}
                      className={cn(
                        'px-3 py-2.5 rounded-lg border text-sm font-medium transition-all',
                        handwriting === quality
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background text-muted-foreground hover:bg-accent/50'
                      )}
                    >
                      {handwritingLabels[quality]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  正确率: <span className="text-primary font-bold">{accuracy}%</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={accuracy}
                    onChange={(e) => setAccuracy(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={accuracy}
                    onChange={(e) => setAccuracy(Math.min(100, Math.max(0, Number(e.target.value))))}
                    ref={accuracyRef}
                    onKeyDown={(e) => handleEnterKey(e, feedbackRef)}
                    className="w-16 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">教师备注</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  ref={feedbackRef}
                  onKeyDown={(e) => handleEnterKey(e, submitRef)}
                  placeholder="可补充教师的主观评价或批改意见..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm min-h-[60px] resize-none hover:bg-accent/50 cursor-pointer"
                  rows={3}
                />
              </div>

              <div className="rounded-xl bg-muted/30 border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground flex items-center">
                    <Sparkles className="h-4 w-4 mr-1.5 text-primary" />
                    自动生成反馈
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={cn(
                        'inline-flex items-center text-xs transition-colors',
                        copySuccess ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {copySuccess ? '已复制' : '复制'}
                    </button>
                    <span className="text-muted-foreground/30">|</span>
                    <button
                      type="button"
                      onClick={handleRegenerate}
                      className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1" />
                      重新生成
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{generatedFeedback}</p>
              </div>
            </div>

            <div className="p-4 pt-0 w-full flex-shrink-0 border-t border-border/50 bg-card/95 backdrop-blur-sm">
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  ref={submitRef}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  {saving ? '保存中...' : (
                    <>
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      保存评估
                    </>
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
