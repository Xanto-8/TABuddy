﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Camera, Plus, Pencil, Trash2, ChevronDown, Download,
  BookOpen, Users, Target, Clock, AlertCircle,
  X, Loader2, RefreshCw, UserCheck, UserX,
  AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { downloadCSV } from '@/lib/export-csv'
import StudentSortDropdown from '@/components/student-sort-dropdown'
import { motion, AnimatePresence } from 'framer-motion'
import { ClassSelector } from '@/components/ui/class-selector'
import {
  CompletionStatus,
  QuizRecord,
  Student,
  Class,
} from '@/types'
import {
  getClasses,
  getStudentsByClass,
  getQuizRecordsByStudent,
  getQuizRecordsByClass,
  saveQuizRecord,
  updateQuizRecord,
  deleteQuizRecord,
  computeAndSaveClassAccuracy,
} from '@/lib/store'
import { useAutoClass, getAutoSelectedClassId } from '@/lib/use-auto-class'
import { getAbsentStudentIds, setAbsentStudents, isStudentAbsent } from '@/lib/absence-store'
import { PageContainer } from '@/components/ui/page-container'
import { useCopyShortcut } from '@/lib/copy-shortcut'
import { getLocalDateString } from '@/lib/utils'
import { completionLabels, completionColors, accuracyColor } from '@/lib/constants'
import ScoreGridTable, { GridColumn, GridRow } from '@/components/dashboard/score-grid-table'

export default function QuizzesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [records, setRecords] = useState<QuizRecord[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [selectedStudentId, setSelectedStudentId] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<QuizRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isClassLoading, setIsClassLoading] = useState(false)
  const [absentIds, setAbsentIds] = useState<string[]>([])
  const studentListRef = useRef<HTMLDivElement>(null)
  const { teachingClassId, isTeachingClass, saveManualSelection } = useAutoClass(classes)
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false)
  const exportDropdownRef = useRef<HTMLDivElement>(null)
  const buttonGroupRef = useRef<HTMLDivElement>(null)
  const portalMenuRef = useRef<HTMLDivElement>(null)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const [refreshKey, setRefreshKey] = useState(0)
  const [gridMode, setGridMode] = useState(false)
  const [gridDirty, setGridDirty] = useState<Set<string>>(new Set())
  const [exportRange, setExportRange] = useState<'today' | 'all'>('today')

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
    if (selectedClassId) {
      setAbsentIds(getAbsentStudentIds(selectedClassId, getLocalDateString()))
    }
  }, [selectedClassId])

  useEffect(() => {
    const handleSortChange = () => {
      if (selectedClassId) {
        setStudents(getStudentsByClass(selectedClassId))
      }
    }
    window.addEventListener('studentSortChanged', handleSortChange)
    return () => window.removeEventListener('studentSortChanged', handleSortChange)
  }, [selectedClassId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isOutsideArrow = exportDropdownRef.current && !exportDropdownRef.current.contains(target)
      const isOutsideMenu = portalMenuRef.current && !portalMenuRef.current.contains(target)
      if (isOutsideArrow && isOutsideMenu) {
        setIsExportDropdownOpen(false)
      }
    }
    if (isExportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => { document.removeEventListener('mousedown', handleClickOutside) }
  }, [isExportDropdownOpen])

  useEffect(() => {
    if (selectedStudentId) {
      setRecords(getQuizRecordsByStudent(selectedStudentId))
    } else {
      setRecords([])
    }
  }, [selectedStudentId])

  const refreshRecords = useCallback(() => {
    if (selectedStudentId) {
      setRecords(getQuizRecordsByStudent(selectedStudentId))
    }
  }, [selectedStudentId])

  const handleDelete = (id: string) => {
    deleteQuizRecord(id)
    computeAndSaveClassAccuracy(selectedClassId)
    refreshRecords()
    setConfirmDelete(null)
    toast.success('小测记录已删除')
  }

  const handleEdit = (record: QuizRecord) => {
    setEditingRecord(record)
    setShowModal(true)
  }

  const handleSaved = () => {
    setShowModal(false)
    setEditingRecord(null)
    refreshRecords()
    setRefreshKey(k => k + 1)
  }

  const handleMarkAllCheckedIn = () => {
    if (!selectedClassId || students.length === 0) return
    toast('确认操作', {
      description: `确认将全班 ${students.length} 名学生标记为已打卡？`,
      action: {
        label: '确认',
        onClick: () => {
          const records = getQuizRecordsByClass(selectedClassId)
          const today = getLocalDateString()
          let count = 0
          for (const student of students) {
            const hasRecordToday = records.some(r =>
              r.studentId === student.id &&
              new Date(r.assessedAt).toISOString().split('T')[0] === today
            )
            if (!hasRecordToday) {
              saveQuizRecord({
                studentId: student.id,
                classId: selectedClassId,
                completion: 'completed',
                photos: [],
              })
              count++
            }
          }
          toast.success(`已标记 ${count} 名学生`)
        }
      },
      cancel: { label: '取消', onClick: () => {} }
    })
  }

  const handleMarkAllExcellent = () => {
    if (!selectedClassId || students.length === 0) return
    const records = getQuizRecordsByClass(selectedClassId)
    const today = getLocalDateString()
    const excellentStudents = students.filter(s => {
      const todayRecords = records.filter(r =>
        r.studentId === s.id &&
        new Date(r.assessedAt).toISOString().split('T')[0] === today
      )
      if (todayRecords.length > 0) {
        const best = todayRecords.reduce((best, r) =>
          (r.overallAccuracy || 0) > (best.overallAccuracy || 0) ? r : best
        , todayRecords[0])
        return (best.overallAccuracy || 0) >= 80
      }
      return false
    })
    if (excellentStudents.length === 0) {
      toast.info('没有正确率 ≥80% 的学生')
      return
    }
    toast('确认操作', {
      description: `确认将 ${excellentStudents.length} 名优秀学生（正确率≥80%）标记为优秀？`,
      action: {
        label: '确认',
        onClick: () => {
          for (const s of excellentStudents) {
            saveQuizRecord({
              studentId: s.id,
              classId: selectedClassId,
              wordScore: 10,
              wordTotal: 10,
              grammarScore: 10,
              grammarTotal: 10,
              completion: 'completed',
              photos: [],
              notes: '优秀',
            })
          }
          refreshRecords()
          setRefreshKey(k => k + 1)
          toast.success(`已标记 ${excellentStudents.length} 名优秀学生`)
        }
      },
      cancel: { label: '取消', onClick: () => {} }
    })
  }

  const handleRefresh = () => {
    refreshRecords()
    if (selectedClassId) {
      setStudents(getStudentsByClass(selectedClassId))
    }
    setRefreshKey(k => k + 1)
    toast.success('数据已刷新')
  }

  const openNewModal = () => {
    setEditingRecord(null)
    setShowModal(true)
  }

  const handleStudentClick = useCallback((studentId: string) => {
    if (studentId === selectedStudentId) return
    setIsTransitioning(true)
    setTimeout(() => {
      try {
        setSelectedStudentId(studentId)
      } catch {
        toast.error('加载学生记录失败')
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
    if (classId === selectedClassId) return
    setIsClassLoading(true)
    setTimeout(() => {
      try {
        const classStudents = getStudentsByClass(classId)
        setStudents(classStudents)
        setSelectedClassId(classId)
        saveManualSelection(classId)
        setSelectedStudentId('')
        setRecords([])
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

  const classQuizRecords = React.useMemo(() => {
    if (!selectedClassId) return []
    const all = getQuizRecordsByClass(selectedClassId)
    if (exportRange === 'today') {
      const today = getLocalDateString()
      return all.filter((r) => {
        try { return getLocalDateString(r.assessedAt) === today } catch { return false }
      })
    }
    return all
  }, [selectedClassId, refreshKey, exportRange])

  const classStats = React.useMemo(() => {
    const data = classQuizRecords
    if (data.length === 0) return { wordAcc: null as number | null, grammarAcc: null as number | null }

    let wordScoreSum = 0, wordTotalSum = 0
    let grammarScoreSum = 0, grammarTotalSum = 0

    for (const r of data) {
      if (r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
        wordScoreSum += r.wordScore
        wordTotalSum += r.wordTotal
      }
      if (r.grammarScore != null && r.grammarTotal != null && r.grammarTotal > 0) {
        grammarScoreSum += r.grammarScore
        grammarTotalSum += r.grammarTotal
      }
    }

    return {
      wordAcc: wordTotalSum > 0 ? Math.round((wordScoreSum / wordTotalSum) * 1000) / 10 : null,
      grammarAcc: grammarTotalSum > 0 ? Math.round((grammarScoreSum / grammarTotalSum) * 1000) / 10 : null,
    }
  }, [classQuizRecords])

  const retestStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students
      .map(s => {
        const records = classQuizRecords.filter(r => r.studentId === s.id)
        const latestWithWord = records
          .filter(r => r.wordScore != null && r.wordTotal != null && r.wordTotal > 0)
          .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
        if (!latestWithWord) return null
        const accuracy = Math.round((latestWithWord.wordScore! / latestWithWord.wordTotal!) * 100)
        if (accuracy >= 80) return null
        return { name: s.name, accuracy }
      })
      .filter(Boolean)
      .sort((a, b) => a!.accuracy - b!.accuracy) as { name: string; accuracy: number }[]
  }, [students, selectedClassId])

  const exportClassDocx = async () => {
    if (!selectedClass || classQuizRecords.length === 0) {
      toast.error(exportRange === 'today' ? '今天暂无小测记录，无法导出' : '当前班级暂无任何小测记录，无法导出')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('正在生成导出文件...')
    try {
      const classStudents = getStudentsByClass(selectedClassId)
      const studentRecordsMap = new Map<string, { name: string; records: QuizRecord[] }>()
      for (const r of classQuizRecords) {
        if (!studentRecordsMap.has(r.studentId)) {
          const student = classStudents.find((s) => s.id === r.studentId)
          studentRecordsMap.set(r.studentId, {
            name: student?.name ?? '未知',
            records: [],
          })
        }
        studentRecordsMap.get(r.studentId)!.records.push(r)
      }
      const { exportQuizDocx } = await import('@/lib/export-quiz')
      const result = await exportQuizDocx({
        className: selectedClass.name,
        studentRecords: studentRecordsMap,
        allStudents: classStudents.map(s => ({ id: s.id, name: s.name })),
        absentIds,
        label: exportRange === 'today' ? '当天' : '全部',
      })
      toast.dismiss(toastId)
      if (result.usedFallback) {
        toast.success(
          <div>
            <p className="font-medium">✅ 导出成功，文件已开始下载</p>
            <p className="text-xs text-amber-700 mt-1">Word生成异常，已自动降级为TXT文件</p>
          </div>,
          { duration: 6000 }
        )
      } else {
        toast.success('✅ 导出成功，文件已开始下载')
      }
    } catch (e) {
      toast.dismiss(toastId)
      toast.error('❌ 导出失败，请重试')
      console.error(e)
    } finally {
      setIsExporting(false)
    }
  }

  const getStudentLatestScores = useCallback(() => {
    const studentLatestMap = new Map<string, QuizRecord>()
    for (const r of classQuizRecords) {
      const existing = studentLatestMap.get(r.studentId)
      if (!existing || new Date(r.assessedAt) > new Date(existing.assessedAt)) {
        studentLatestMap.set(r.studentId, r)
      }
    }
    return students.map(s => ({
      student: s,
      record: studentLatestMap.get(s.id) || null,
    }))
  }, [selectedClassId, students, classQuizRecords])

  const copyWordScores = useCallback(async () => {
    if (!selectedClassId) return
    const scores = getStudentLatestScores()
    const lines: string[] = []
    for (const { student, record } of scores) {
      if (absentIds.includes(student.id)) {
        lines.push('已请假')
      } else if (record && record.wordScore != null && record.wordTotal != null) {
        lines.push(`${record.wordScore}/${record.wordTotal}`)
      } else {
        lines.push('')
      }
    }
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制词汇成绩列到剪贴板')
    } catch {
      toast.error('复制失败，请重试')
    }
  }, [selectedClassId, getStudentLatestScores, absentIds])

  const copyGrammarScores = useCallback(async () => {
    if (!selectedClassId) return
    const scores = getStudentLatestScores()
    const lines: string[] = []
    for (const { student, record } of scores) {
      if (absentIds.includes(student.id)) {
        lines.push('已请假')
      } else if (record && record.grammarScore != null && record.grammarTotal != null) {
        lines.push(`${record.grammarScore}/${record.grammarTotal}`)
      } else {
        lines.push('')
      }
    }
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制语法成绩列到剪贴板')
    } catch {
      toast.error('复制失败，请重试')
    }
  }, [selectedClassId, getStudentLatestScores, absentIds])

  const copyBothScores = useCallback(async () => {
    if (!selectedClassId) return
    const scores = getStudentLatestScores()
    const lines: string[] = []
    for (const { student, record } of scores) {
      if (absentIds.includes(student.id)) {
        lines.push('已请假')
      } else if (record &&
          record.wordScore != null && record.wordTotal != null &&
          record.grammarScore != null && record.grammarTotal != null) {
        lines.push(`${record.wordScore}/${record.wordTotal}\t${record.grammarScore}/${record.grammarTotal}`)
      } else {
        lines.push('')
      }
    }
    const text = lines.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('已复制词汇+语法两列到剪贴板，粘贴到Excel可自动分列')
    } catch {
      toast.error('复制失败，请重试')
    }
  }, [selectedClassId, getStudentLatestScores, absentIds])

  const exportCSV = useCallback(() => {
    const scores = getStudentLatestScores()
    const className = classes.find(c => c.id === selectedClassId)?.name ?? selectedClassId
    const dateStr = new Date().toISOString().slice(0, 10)
    const rows: (string | number)[][] = [
      ['学生姓名', '单词得分', '单词总分', '单词正确率', '语法得分', '语法总分', '语法正确率'],
    ]
    for (const { student, record } of scores) {
      if (absentIds.includes(student.id)) {
        rows.push([student.name, '已请假', '', '', '', '', ''])
        continue
      }
      const wa = record?.wordScore != null && record?.wordTotal != null
        ? `${Math.round((record.wordScore / record.wordTotal) * 1000) / 10}%` : ''
      const ga = record?.grammarScore != null && record?.grammarTotal != null
        ? `${Math.round((record.grammarScore / record.grammarTotal) * 1000) / 10}%`
        : record?.grammarAccuracy != null ? `${record.grammarAccuracy}%` : ''
      rows.push([
        student.name,
        record?.wordScore ?? '', record?.wordTotal ?? '', wa,
        record?.grammarScore ?? '', record?.grammarTotal ?? '', ga,
      ])
    }
    downloadCSV(rows, `${className}-小测成绩-${dateStr}.csv`)
    toast.success(`CSV 已导出，共 ${scores.length} 位学生`)
  }, [selectedClassId, getStudentLatestScores, absentIds, classes])

  const handleCopyRetestList = useCallback(async () => {
    if (retestStudents.length === 0) return
    const className = classes.find(c => c.id === selectedClassId)?.name ?? ''
    const header = `${className}需重测名单：`
    const rows = retestStudents.map(s => `${s.name} 单词正确率${s.accuracy}%`)
    const footer = '以上孩子可课后留下重测'
    const text = [header, ...rows, footer].join('\n')
    await navigator.clipboard.writeText(text)
    toast.success(`重测名单已复制，共 ${retestStudents.length} 人`)
  }, [retestStudents, classes, selectedClassId])

  useCopyShortcut('quizzes-page', useCallback(() => {
    copyBothScores()
  }, [copyBothScores]))

  const gridColumns: GridColumn[] = useMemo(() => [
    { key: 'wordScore', label: '单词得分', type: 'number' },
    { key: 'wordTotal', label: '单词总分', type: 'number' },
    { key: 'grammarScore', label: '语法得分', type: 'number' },
    { key: 'grammarTotal', label: '语法总分', type: 'number' },
  ], [])

  const [gridRows, setGridRows] = useState<GridRow[]>([])

  const initGridRows = useCallback(() => {
    if (!selectedClassId) return
    const classRecords = getQuizRecordsByClass(selectedClassId)
    const latestMap = new Map<string, QuizRecord>()
    for (const r of classRecords) {
      const existing = latestMap.get(r.studentId)
      if (!existing || new Date(r.assessedAt) > new Date(existing.assessedAt)) {
        latestMap.set(r.studentId, r)
      }
    }
    const rows: GridRow[] = students.map((s) => {
      const latest = latestMap.get(s.id)
      return {
        id: s.id,
        name: s.name,
        data: {
          wordScore: latest?.wordScore != null ? String(latest.wordScore) : '',
          wordTotal: latest?.wordTotal != null ? String(latest.wordTotal) : '',
          grammarScore: latest?.grammarScore != null ? String(latest.grammarScore) : '',
          grammarTotal: latest?.grammarTotal != null ? String(latest.grammarTotal) : '',
        },
      }
    })
    setGridRows(rows)
    setGridDirty(new Set())
  }, [selectedClassId, students])

  useEffect(() => {
    if (gridMode && selectedClassId) {
      initGridRows()
    }
  }, [gridMode, selectedClassId, initGridRows])

  const handleGridCellChange = useCallback((rowId: string, columnKey: string, value: string) => {
    setGridRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, data: { ...r.data, [columnKey]: value } } : r))
    )
    setGridDirty((prev) => new Set(prev).add(rowId))
  }, [])

  const handleGridSave = useCallback(async () => {
    if (!selectedClassId) return
    const dirtyRows = gridRows.filter((r) => gridDirty.has(r.id))
    for (const row of dirtyRows) {
      const wordScore = row.data.wordScore ? Number(row.data.wordScore) : undefined
      const wordTotal = row.data.wordTotal ? Number(row.data.wordTotal) : undefined
      const grammarScore = row.data.grammarScore ? Number(row.data.grammarScore) : undefined
      const grammarTotal = row.data.grammarTotal ? Number(row.data.grammarTotal) : undefined
      saveQuizRecord({
        studentId: row.id,
        classId: selectedClassId,
        wordScore: !isNaN(wordScore!) ? wordScore : undefined,
        wordTotal: !isNaN(wordTotal!) ? wordTotal : undefined,
        grammarScore: !isNaN(grammarScore!) ? grammarScore : undefined,
        grammarTotal: !isNaN(grammarTotal!) ? grammarTotal : undefined,
        completion: 'completed',
        photos: [],
      })
    }
    computeAndSaveClassAccuracy(selectedClassId)
    setGridDirty(new Set())
    setRefreshKey(k => k + 1)
    initGridRows()
  }, [selectedClassId, gridRows, gridDirty, initGridRows])

  const handleGridBatchMark = useCallback((key: string, value: string) => {
    setGridDirty(new Set(gridRows.map((r) => r.id)))
  }, [gridRows])

  if (classes.length === 0) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">小测管理</h1>
            <p className="text-muted-foreground mt-1">记录和管理学生的小测与练习情况</p>
          </div>
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Camera className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">请先添加班级</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              还没有创建任何班级，请先前往班级管理系统添加班级和学生，然后进行小测记录。
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
            <h1 className="text-2xl font-bold text-foreground">小测管理</h1>
            <p className="text-muted-foreground mt-1">记录和管理学生的小测与练习情况</p>
          </div>
          {selectedClassId && (
            <button
              onClick={() => setGridMode(!gridMode)}
              className={cn(
                'inline-flex items-center px-4 py-2.5 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors',
                gridMode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:bg-accent'
              )}
            >
              {gridMode ? '列表模式' : '表格模式'}
            </button>
          )}
        </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <ClassSelector
            classes={classes}
            selectedClassId={selectedClassId}
            onChange={(id) => handleClassSwitch(id)}
            isTeachingClass={isTeachingClass}
            isLoading={isClassLoading}
          />
          {selectedClassId && (
            <div className="flex items-center gap-3 flex-1 max-w-[520px]">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20 shrink-0">
                  <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">单词平均正确率</p>
                  <p className={cn('text-lg font-bold leading-tight mt-0.5', accuracyColor(classStats.wordAcc))}>
                    {classStats.wordAcc !== null ? `${classStats.wordAcc}%` : '暂无数据'}
                  </p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 shrink-0">
                  <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground leading-tight">语法平均正确率</p>
                  <p className={cn('text-lg font-bold leading-tight mt-0.5', accuracyColor(classStats.grammarAcc))}>
                    {classStats.grammarAcc !== null ? `${classStats.grammarAcc}%` : '暂无数据'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedClassId && (
            <div className="overflow-x-auto">
              <div className="flex items-center shrink-0 gap-2">
                <div className="inline-flex items-center rounded-lg border border-border bg-background overflow-hidden">
                  <button
                    onClick={() => setExportRange('today')}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium transition-colors',
                      exportRange === 'today'
                        ? 'bg-purple-600 text-white'
                        : 'text-muted-foreground hover:bg-accent/50'
                    )}
                  >
                    当天
                  </button>
                  <button
                    onClick={() => setExportRange('all')}
                    className={cn(
                      'px-3 py-2.5 text-xs font-medium transition-colors border-l border-border',
                      exportRange === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'text-muted-foreground hover:bg-accent/50'
                    )}
                  >
                    全部
                  </button>
                </div>
                <div ref={buttonGroupRef} className={cn(
                  'inline-flex items-center rounded-lg border border-border transition-all duration-200',
                  classQuizRecords.length === 0
                    ? 'text-muted-foreground cursor-not-allowed bg-muted/30'
                    : 'bg-background hover:-translate-y-0.5 hover:shadow-md'
                )}>
                  <button
                    onClick={exportClassDocx}
                    disabled={isExporting || classQuizRecords.length === 0}
                    title={classQuizRecords.length === 0 ? '暂无班级记录，无法导出' : '一键导出'}
                    className={cn(
                      'inline-flex items-center px-5 py-3 rounded-l-lg text-sm font-medium transition-colors duration-200',
                      classQuizRecords.length === 0
                        ? 'text-muted-foreground cursor-not-allowed'
                        : 'text-foreground hover:bg-accent/50 cursor-pointer'
                    )}
                  >
                    {isExporting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    ) : (
                      <Download className="h-4 w-4 mr-2 shrink-0" />
                    )}
                    {isExporting ? '正在导出...' : '一键导出'}
                  </button>
                  <div className="relative" ref={exportDropdownRef}>
                    <button
                      onClick={() => {
                        if (!isExportDropdownOpen) {
                          const rect = buttonGroupRef.current?.getBoundingClientRect()
                          if (rect) {
                            setMenuStyle({
                              position: 'fixed',
                              top: rect.bottom + 4,
                              right: window.innerWidth - rect.right,
                              minWidth: Math.max(rect.width, 260),
                            })
                          }
                        }
                        setIsExportDropdownOpen(!isExportDropdownOpen)
                      }}
                      disabled={isExporting || classQuizRecords.length === 0}
                      title="更多导出选项"
                      className={cn(
                        'inline-flex items-center px-2.5 py-3 rounded-r-lg border-l border-border text-sm font-medium transition-colors duration-200',
                        classQuizRecords.length === 0
                          ? 'text-muted-foreground cursor-not-allowed'
                          : 'text-foreground hover:bg-accent/50 cursor-pointer'
                      )}
                    >
                      <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', isExportDropdownOpen && 'rotate-180')} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleRefresh}
                  title="刷新数据"
                  className="inline-flex items-center px-3 py-3 rounded-lg border border-border bg-background text-sm font-medium text-foreground hover:bg-accent/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  刷新
                </button>
                <button
                  onClick={handleMarkAllCheckedIn}
                  disabled={!selectedClassId || students.length === 0}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                >
                  全班打卡
                </button>
                <button
                  onClick={handleMarkAllExcellent}
                  disabled={!selectedClassId || students.length === 0}
                  className="px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  全班优秀
                </button>
                {retestStudents.length > 0 && (
                  <button
                    onClick={handleCopyRetestList}
                    className="inline-flex items-center px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50 transition-all text-sm font-medium"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    复制重测名单 ({retestStudents.length}人)
                  </button>
                )}
                {retestStudents.length === 0 && selectedClassId && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    全班通过，无人需要重测
                  </span>
                )}
              </div>
            </div>
          )}

          {typeof document !== 'undefined' && isExportDropdownOpen && createPortal(
            <motion.div
              ref={portalMenuRef}
              initial={{ opacity: 0, y: -4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              style={menuStyle}
              className="z-[100]"
            >
              <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => { copyWordScores(); setIsExportDropdownOpen(false) }}
                    className="w-full px-5 py-3 text-left text-sm transition-colors hover:bg-accent text-foreground whitespace-nowrap"
                  >
                    导出词汇成绩列（单列）
                  </button>
                  <button
                    onClick={() => { copyGrammarScores(); setIsExportDropdownOpen(false) }}
                    className="w-full px-5 py-3 text-left text-sm transition-colors hover:bg-accent text-foreground whitespace-nowrap"
                  >
                    导出语法成绩列（单列）
                  </button>
                  <div className="border-t border-border mx-3 my-1" />
                  <button
                    onClick={() => { copyBothScores(); setIsExportDropdownOpen(false) }}
                    className="w-full px-5 py-3 text-left text-sm transition-colors hover:bg-accent text-foreground whitespace-nowrap"
                  >
                    导出词汇+语法两列（可直接粘贴分列）
                  </button>
                  <button
                    onClick={() => { setIsExportDropdownOpen(false); exportCSV() }}
                    className="w-full px-5 py-3 text-left text-sm transition-colors hover:bg-accent text-foreground whitespace-nowrap border-t border-border"
                  >
                    📥 导出 CSV 文件
                  </button>
                </div>
              </div>
            </motion.div>,
            document.body
          )}
      </div>

      {!selectedClassId ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground">请选择一个班级</h3>
          <p className="text-muted-foreground mt-1">从上方选择班级以查看学生和小测记录</p>
        </div>
      ) : gridMode ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-medium text-foreground">
              批量录入 - {selectedClass?.name}
            </h3>
            <span className="text-xs text-muted-foreground">({students.length} 名学生)</span>
          </div>
          <ScoreGridTable
            columns={gridColumns}
            rows={gridRows}
            onCellChange={handleGridCellChange}
            onSave={handleGridSave}
            onBatchMark={handleGridBatchMark}
            batchLabel="标记修改"
          />
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
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    学生列表
                    <span className="ml-2 text-xs text-muted-foreground">({students.length})</span>
                  </h3>
                  <StudentSortDropdown students={students} classId={selectedClassId || undefined} />
                </div>
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
                    const studentRecords = getQuizRecordsByStudent(student.id)
                    const latest = studentRecords.length > 0
                      ? studentRecords.sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]
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
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                          absentIds.includes(student.id)
                            ? 'bg-orange-100 dark:bg-orange-900/20'
                            : 'bg-primary/10'
                        )}>
                          <span className={cn(
                            'text-xs font-medium',
                            absentIds.includes(student.id) ? 'text-orange-500' : 'text-primary'
                          )}>{student.name.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                            {absentIds.includes(student.id) && (
                              <span className="text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 font-medium shrink-0">
                                已请假
                              </span>
                            )}
                          </div>
                          {latest && (
                            <p className="text-xs text-muted-foreground truncate">
                              最近: {new Date(latest.assessedAt).toLocaleDateString('zh-CN')}
                            </p>
                          )}
                        </div>
                        {studentRecords.length > 0 && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {studentRecords.length}
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
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    {students.length === 0 && selectedClassId ? (
                      <>
                        <h3 className="text-xl font-semibold text-foreground">该班级暂无学生</h3>
                        <p className="text-muted-foreground/80 mt-2 text-sm">请先添加学生后再进行小测管理</p>
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
                        <p className="text-muted-foreground/80 mt-2 text-sm">点击左侧学生查看或添加小测记录</p>
                        <p className="text-muted-foreground/60 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                          一键导出可生成当前班级的汇总报告，包含所有学生的单词/语法得分及班级统计
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 min-h-0 space-y-4">
                  <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-foreground">
                        {selectedStudent?.name} 的小测记录
                      </h3>
                      {selectedStudent && (
                        <button
                          onClick={() => {
                            const newAbsent = !absentIds.includes(selectedStudent.id)
                            const today = getLocalDateString()
                            const updatedIds = newAbsent
                              ? Array.from(new Set([...absentIds, selectedStudent.id]))
                              : absentIds.filter(id => id !== selectedStudent.id)
                            setAbsentStudents(selectedClassId, today, updatedIds)
                            setAbsentIds(updatedIds)
                          }}
                          className={cn(
                            'inline-flex items-center px-3 py-1.5 rounded-lg border transition-all text-xs font-medium',
                            absentIds.includes(selectedStudent.id)
                              ? 'border-orange-300 bg-orange-50 text-orange-600 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-400'
                              : 'border-border text-muted-foreground hover:bg-accent/50'
                          )}
                        >
                          {absentIds.includes(selectedStudent.id) ? (
                            <><UserX className="h-3.5 w-3.5 mr-1.5" />已请假</>
                          ) : (
                            <><UserCheck className="h-3.5 w-3.5 mr-1.5" />标记请假</>
                          )}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={openNewModal}
                        className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新增记录
                      </button>
                    </div>
                  </div>

                  {records.length === 0 ? (
                    <div className="relative flex-1 text-center rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                      <div className="absolute inset-0 flex items-center justify-center opacity-[0.025] pointer-events-none select-none">
                        <div className="grid grid-cols-5 gap-6 scale-125">
                          {Array.from({ length: 15 }).map((_, i) => (
                            <Camera key={i} className="h-11 w-11 text-foreground" />
                          ))}
                        </div>
                      </div>
                      <div className="relative flex flex-col items-center justify-center h-full px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted mb-5">
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">暂无小测记录</h3>
                        <p className="text-muted-foreground/80 mb-6">
                          还没有为 {selectedStudent?.name} 记录过小测
                        </p>
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={openNewModal}
                            className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            新增记录
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
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[100px]">日期</th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">单词得分</th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap">语法得分</th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[80px]">完成度</th>
                              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground whitespace-nowrap w-[90px]">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {[...records]
                              .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())
                              .map((record) => {
                                const wordAccuracy = record.wordScore != null && record.wordTotal != null && record.wordTotal > 0
                                  ? Math.round((record.wordScore / record.wordTotal) * 100)
                                  : null
                                return (
                                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                      {new Date(record.assessedAt).toLocaleDateString('zh-CN')}
                                    </td>
                                    <td className="px-4 py-3">
                                      {record.wordScore != null && record.wordTotal != null ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-foreground">
                                            {record.wordScore}/{record.wordTotal}
                                          </span>
                                          {wordAccuracy !== null ? (
                                            <span className={wordAccuracy < 80
                                              ? 'text-red-600 dark:text-red-400 font-semibold'
                                              : accuracyColor(wordAccuracy)
                                            }>
                                              {wordAccuracy}%
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">-</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {record.grammarScore != null && record.grammarTotal != null ? (
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-foreground">
                                            {record.grammarScore}/{record.grammarTotal}
                                          </span>
                                          {(() => {
                                            const ga = (record.grammarScore! / record.grammarTotal!) * 100
                                            const displayGa = Math.round(ga * 10) / 10
                                            return (
                                              <span className={cn(
                                                'text-xs px-1.5 py-0.5 rounded font-medium',
                                                ga >= 85 ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                                                ga >= 50 ? 'text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20' :
                                                'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                                              )}>
                                                {displayGa}%
                                              </span>
                                            )
                                          })()}
                                        </div>
                                      ) : record.grammarAccuracy != null ? (
                                        <span className={cn(
                                          'text-xs px-1.5 py-0.5 rounded font-medium',
                                          record.grammarAccuracy >= 85 ? 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20' :
                                          record.grammarAccuracy >= 50 ? 'text-orange-500 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/20' :
                                          'text-red-500 bg-red-50 dark:text-red-400 dark:bg-red-900/20'
                                        )}>
                                          {record.grammarAccuracy}%
                                        </span>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap hover:brightness-110 transition-all', completionColors[record.completion])}>
                                        {completionLabels[record.completion]}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleEdit(record)}
                                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                                          title="编辑"
                                        >
                                          <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                          onClick={() => setConfirmDelete(record.id)}
                                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                                          title="删除"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
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
          <UploadQuizModal
            student={selectedStudent!}
            classId={selectedClassId}
            editingRecord={editingRecord}
            onClose={() => {
              setShowModal(false)
              setEditingRecord(null)
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <DeleteConfirmModal
            onConfirm={() => handleDelete(confirmDelete)}
            onCancel={() => setConfirmDelete(null)}
          />
        )}
      </AnimatePresence>
      </div>
    </PageContainer>
  )
}

function UploadQuizModal({
  student,
  classId,
  editingRecord,
  onClose,
  onSaved,
}: {
  student: Student
  classId: string
  editingRecord: QuizRecord | null
  onClose: () => void
  onSaved: () => void
}) {
  const [wordScore, setWordScore] = useState(editingRecord?.wordScore?.toString() ?? '')
  const [wordTotal, setWordTotal] = useState(editingRecord?.wordTotal?.toString() ?? '')
  const [grammarScore, setGrammarScore] = useState(editingRecord?.grammarScore?.toString() ?? '')
  const [grammarTotal, setGrammarTotal] = useState(editingRecord?.grammarTotal?.toString() ?? '')
  const [completion, setCompletion] = useState<CompletionStatus>(editingRecord?.completion ?? 'completed')
  const [notes, setNotes] = useState(editingRecord?.notes ?? '')

  const wordScoreRef = useRef<HTMLInputElement>(null)
  const wordTotalRef = useRef<HTMLInputElement>(null)
  const grammarScoreRef = useRef<HTMLInputElement>(null)
  const grammarTotalRef = useRef<HTMLInputElement>(null)
  const completionRef = useRef<HTMLSelectElement>(null)
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const handleEnterKey = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement | null>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const ws = wordScore ? Number(wordScore) : NaN
  const wt = wordTotal ? Number(wordTotal) : NaN
  const gs = grammarScore ? Number(grammarScore) : NaN
  const gt = grammarTotal ? Number(grammarTotal) : NaN

  const wordError = (!isNaN(ws) && !isNaN(wt) && wt === 0) ? '总分不能为0'
    : (!isNaN(ws) && !isNaN(wt) && wt > 0 && ws > wt) ? '得分不能超过总分'
    : ''
  const grammarError = (!isNaN(gs) && !isNaN(gt) && gt === 0) ? '总分不能为0'
    : (!isNaN(gs) && !isNaN(gt) && gt > 0 && gs > gt) ? '得分不能超过总分'
    : ''

  const wordPercent = !isNaN(ws) && !isNaN(wt) && wt > 0 && ws >= 0 && !wordError
    ? ((ws / wt) * 100).toFixed(1)
    : null
  const grammarPercent = !isNaN(gs) && !isNaN(gt) && gt > 0 && gs >= 0 && !grammarError
    ? ((gs / gt) * 100).toFixed(1)
    : null

  const percentColor = (p: string | null) => {
    if (!p) return ''
    const v = parseFloat(p)
    if (v >= 85) return 'text-green-600 dark:text-green-400'
    if (v >= 50) return 'text-orange-500 dark:text-orange-400'
    return 'text-red-500 dark:text-red-400'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (wordError || grammarError) {
      toast.error('请修正输入错误后重试')
      return
    }

    const calculatedGrammarAccuracy = !isNaN(gs) && !isNaN(gt) && gt > 0 && gs >= 0
      ? Math.round((gs / gt) * 1000) / 10
      : undefined

    const base = {
      studentId: student.id,
      classId,
      wordScore: wordScore ? Number(wordScore) : undefined,
      wordTotal: wordTotal ? Number(wordTotal) : undefined,
      grammarScore: grammarScore ? Number(grammarScore) : undefined,
      grammarTotal: grammarTotal ? Number(grammarTotal) : undefined,
      grammarAccuracy: calculatedGrammarAccuracy,
      completion,
      notes,
      photos: [],
    }
    if (editingRecord) {
      updateQuizRecord(editingRecord.id, { ...base, assessedAt: editingRecord.assessedAt ?? new Date() })
      toast.success('小测记录已更新')
    } else {
      saveQuizRecord(base)
      toast.success('小测记录已保存')
    }
    computeAndSaveClassAccuracy(classId)
    onSaved()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {editingRecord ? '编辑小测记录' : '新增小测记录'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground mb-1">学生</p>
            <p className="text-sm text-muted-foreground">{student.name}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">单词</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">得分</label>
                <input
                  type="number"
                  value={wordScore}
                  onChange={(e) => setWordScore(e.target.value)}
                  ref={wordScoreRef}
                  onKeyDown={(e) => handleEnterKey(e, wordTotalRef)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  placeholder="例如: 8"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">总分</label>
                <input
                  type="number"
                  value={wordTotal}
                  onChange={(e) => setWordTotal(e.target.value)}
                  ref={wordTotalRef}
                  onKeyDown={(e) => handleEnterKey(e, grammarScoreRef)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  placeholder="例如: 10"
                  min={0}
                />
              </div>
            </div>
            {wordPercent !== null && (
              <p className={cn('text-xs mt-1', percentColor(wordPercent))}>
                {wordScore}/{wordTotal}（正确率{wordPercent}%）
              </p>
            )}
            {wordError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{wordError}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2">语法</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">得分</label>
                <input
                  type="number"
                  value={grammarScore}
                  onChange={(e) => setGrammarScore(e.target.value)}
                  ref={grammarScoreRef}
                  onKeyDown={(e) => handleEnterKey(e, grammarTotalRef)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  placeholder="例如: 8"
                  min={0}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">总分</label>
                <input
                  type="number"
                  value={grammarTotal}
                  onChange={(e) => setGrammarTotal(e.target.value)}
                  ref={grammarTotalRef}
                  onKeyDown={(e) => handleEnterKey(e, completionRef)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                  placeholder="例如: 10"
                  min={0}
                />
              </div>
            </div>
            {grammarPercent !== null && (
              <p className={cn('text-xs mt-1', percentColor(grammarPercent))}>
                {grammarScore}/{grammarTotal}（正确率{grammarPercent}%）
              </p>
            )}
            {grammarError && (
              <p className="text-xs text-red-500 dark:text-red-400 mt-1">{grammarError}</p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">完成度</label>
            <select
              value={completion}
              onChange={(e) => setCompletion(e.target.value as CompletionStatus)}
              ref={completionRef}
              onKeyDown={(e) => handleEnterKey(e, notesRef)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
            >
              <option value="completed">已完成</option>
              <option value="partial">部分完成</option>
              <option value="not_done">未完成</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              ref={notesRef}
              onKeyDown={(e) => handleEnterKey(e, submitRef)}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm resize-none"
              rows={3}
              placeholder="可选填写备注"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-accent transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              ref={submitRef}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-all"
            >
              {editingRecord ? '保存修改' : '保存记录'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}


function DeleteConfirmModal({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">确认删除</h3>
            <p className="text-sm text-muted-foreground mt-1">删除后无法恢复，确定要继续吗？</p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-sm hover:bg-accent transition-all"
            >
              取消
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition-all"
            >
              确认删除
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

