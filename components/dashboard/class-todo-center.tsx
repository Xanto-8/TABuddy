'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Layers, Clock, CheckCircle2, Circle, X } from 'lucide-react'
import type { Class, WorkflowTodo, Student } from '@/types'
import { WORKFLOW_NODE_ICONS } from '@/types'
import {
  getClasses,
  getHomeworkAssessmentsByClass,
  getQuizRecordsByClass,
  getClassTypeLabel,
  getStudentsByClass,
  getFeedbackHistoryByStudent,
  isScheduleDayForClass,
  getCurrentClassByTime,
} from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  generateWorkflowTodos,
  toggleWorkflowTodo,
  getWorkflowTodoStats,
} from '@/lib/workflow-store'
import {
  getAbsentStudentIds,
  setAbsentStudents,
} from '@/lib/absence-store'
import { toast } from 'sonner'

interface CoreTaskData {
  homeworkPending: number
  quizPending: number
  taskPending: number
}

interface ClassTodoData {
  class: Class
  core: CoreTaskData
  workflowTodos: WorkflowTodo[]
  todoStats: { total: number; completed: number; pending: number }
  totalPending: number
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-pink-500',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function loadAllClassTodos(): ClassTodoData[] {
  const today = new Date().toISOString().split('T')[0]
  // 主筛选：当天有排课的班级
  const scheduledClasses = getClasses().filter(
    (cls) => isScheduleDayForClass(cls.id, today)
  )
  // 备选：当前正在上课（或即将上课）的班级
  const currentClass = getCurrentClassByTime()
  const classIds = new Set(scheduledClasses.map((c) => c.id))
  if (currentClass && !classIds.has(currentClass.id)) {
    scheduledClasses.push(currentClass)
    classIds.add(currentClass.id)
  }

  const list: ClassTodoData[] = scheduledClasses.map((cls) => {
    const students = getStudentsByClass(cls.id)
    const classSize = students.length
    const absentIds = getAbsentStudentIds(cls.id, today)
    const absentCount = absentIds.length

    const homeworkAssessments = getHomeworkAssessmentsByClass(cls.id)
    const homeworkCompletedStudents = new Set(
      homeworkAssessments
        .filter((h) => h.completion === 'completed')
        .map((h) => h.studentId)
    )
    const homeworkPending = Math.max(0, classSize - homeworkCompletedStudents.size - absentCount)

    const quizRecords = getQuizRecordsByClass(cls.id)
    const quizCompletedStudents = new Set(
      quizRecords
        .filter((q) => q.completion === 'completed')
        .map((q) => q.studentId)
    )
    const quizPending = Math.max(0, classSize - quizCompletedStudents.size - absentCount)

    const courseFeedbackCompletedCount = students.filter((s) => {
      const feedbacks = getFeedbackHistoryByStudent(s.id)
      return feedbacks.some((f) => {
        const fDate = new Date(f.createdAt).toISOString().split('T')[0]
        return fDate === today
      })
    }).length
    const courseFeedbackPending = Math.max(0, classSize - courseFeedbackCompletedCount - absentCount)

    const workflowTodos = generateWorkflowTodos(cls.id, cls.name, cls.type, today)
    const todoStats = getWorkflowTodoStats(cls.id, today)

    return {
      class: cls,
      core: { homeworkPending, quizPending, taskPending: courseFeedbackPending },
      workflowTodos,
      todoStats,
      totalPending: todoStats.pending,
    }
  })

  list.sort((a, b) => b.totalPending - a.totalPending)
  return list
}

function isAllComplete(item: ClassTodoData): boolean {
  const coreClear = item.core.homeworkPending === 0 && item.core.quizPending === 0 && item.core.taskPending === 0
  const workflowClear = item.todoStats.pending === 0
  return coreClear && workflowClear
}

function LeaveModal({
  isOpen,
  onClose,
  classId,
  className,
  onConfirm,
}: {
  isOpen: boolean
  onClose: () => void
  classId: string
  className: string
  onConfirm: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [students, setStudents] = useState<Student[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      const allStudents = getStudentsByClass(classId)
      setStudents(allStudents)
      setSelectedIds(getAbsentStudentIds(classId, today))
    }
  }, [isOpen, classId, today])

  const toggleStudent = (studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }

  const selectAll = () => {
    setSelectedIds(students.map((s) => s.id))
  }

  const deselectAll = () => {
    setSelectedIds([])
  }

  const handleConfirm = () => {
    setAbsentStudents(classId, today, selectedIds)
    toast.success('请假状态已同步，相关待办已更新')
    onConfirm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 pb-3 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-foreground">标记请假学生</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {className} · {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">该班级暂无学生</div>
          ) : (
            <div className="space-y-1.5">
              {students.map((student) => (
                <label
                  key={student.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer',
                    selectedIds.includes(student.id)
                      ? 'border-indigo-200 bg-indigo-50/60 dark:border-indigo-500/30 dark:bg-indigo-950/30'
                      : 'border-border hover:border-muted-foreground/30 hover:bg-accent/50'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(student.id)}
                    onChange={() => toggleStudent(student.id)}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0',
                    getAvatarColor(student.id)
                  )}>
                    {student.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{student.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 pt-3 border-t border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={selectAll}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                全选
              </button>
              <button
                onClick={deselectAll}
                className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                取消全选
              </button>
            </div>
            <span className="text-xs text-muted-foreground">
              已勾选<span className="font-semibold text-indigo-600 mx-1">{selectedIds.length}</span>
              名请假学生，作业/小测待办将扣减<span className="font-semibold text-indigo-600 mx-1">{selectedIds.length}</span>项
            </span>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

function ClassTodoCard({
  item,
  onRefresh,
}: {
  item: ClassTodoData
  onRefresh: () => void
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(true)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const cls = item.class
  const allComplete = isAllComplete(item)
  const pendingWorkflow = item.workflowTodos.filter((t) => !t.completed)

  const handleToggleTodo = (todoId: string) => {
    toggleWorkflowTodo(todoId)
    onRefresh()
  }

  const handleCardClick = () => {
    const maxCount = Math.max(item.core.homeworkPending, item.core.quizPending, item.core.taskPending)
    if (maxCount > 0) {
      if (item.core.homeworkPending === maxCount) {
        router.push(`/homework?classId=${cls.id}`)
        return
      }
      if (item.core.quizPending === maxCount) {
        router.push(`/quizzes?classId=${cls.id}`)
        return
      }
    }
    router.push(`/classes/${cls.id}`)
  }

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-200 bg-card shadow-sm',
        allComplete
          ? 'border-border/50 bg-muted/30'
          : 'border-border hover:border-indigo-200 hover:shadow-md dark:hover:border-indigo-500/30'
      )}
    >
      <div className="p-4 pb-3 cursor-pointer" onClick={handleCardClick}>
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm',
            allComplete ? 'bg-muted-foreground/50' : getAvatarColor(cls.id)
          )}>
            {cls.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold truncate',
              allComplete ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {cls.name}
            </p>
            <p className={cn(
              'text-xs',
              allComplete ? 'text-muted-foreground/50' : 'text-muted-foreground'
            )}>
              {getClassTypeLabel(cls.type)} · {cls.studentCount}人
            </p>
          </div>
          <div className="shrink-0">
            {allComplete ? (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                <span className="text-xs">✅</span>
                <span className="text-xs font-medium text-emerald-600">已全部完成</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-900/50 shadow-sm">
                <Clock size={14} className="text-amber-500" />
                <span className="text-lg font-bold text-amber-600">{item.totalPending}</span>
                <span className="text-xs text-amber-500 font-medium">待处理</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className={cn(
          'grid grid-cols-3 gap-2',
          allComplete && 'opacity-40'
        )}>
          <div className="text-center p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
            <p className={cn(
              'text-sm font-bold',
              item.core.homeworkPending > 0 ? 'text-blue-600' : 'text-gray-400'
            )}>
              {item.core.homeworkPending}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">作业反馈</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
            <p className={cn(
              'text-sm font-bold',
              item.core.quizPending > 0 ? 'text-purple-600' : 'text-gray-400'
            )}>
              {item.core.quizPending}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">小测反馈</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50">
            <p className={cn(
              'text-sm font-bold',
              item.core.taskPending > 0 ? 'text-emerald-600' : 'text-gray-400'
            )}>
              {item.core.taskPending}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight">课程反馈</p>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setLeaveModalOpen(true) }}
          className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all"
        >
          标记请假学生
        </button>
      </div>

      <div className="border-t border-border px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium text-indigo-600">
            <Layers size={14} />
            <span>课中工作流</span>
            <span className="text-muted-foreground font-normal">
              ({item.todoStats.completed}/{item.todoStats.total})
            </span>
          </div>
          {item.workflowTodos.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? '收起' : '展开'}
            </button>
          )}
        </div>

        {expanded && item.workflowTodos.length > 0 && (
          <div className="mt-2 space-y-1 max-h-64 overflow-y-auto pr-1">
            {item.workflowTodos
              .sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0))
              .map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-200',
                    todo.completed
                      ? 'border-border bg-muted/50'
                      : 'border-border bg-card hover:border-indigo-200 hover:bg-indigo-50/20 dark:hover:border-indigo-500/30 dark:hover:bg-indigo-950/20'
                  )}
                >
                  <button
                    onClick={() => handleToggleTodo(todo.id)}
                    className="shrink-0"
                    title={todo.completed ? '标记为未完成' : '标记为已完成'}
                  >
                    {todo.completed ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground/40 hover:text-indigo-400 transition-colors" />
                    )}
                  </button>

                  <span className="text-base shrink-0">{WORKFLOW_NODE_ICONS[todo.nodeType]}</span>

                  <span className={cn(
                    'text-xs flex-1',
                    todo.completed ? 'text-muted-foreground line-through' : 'text-foreground font-medium'
                  )}>
                    {todo.label}
                  </span>

                  {todo.completed && todo.completedAt && (
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(todo.completedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
          </div>
        )}

        {expanded && item.workflowTodos.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">
            暂无工作流待办，请先在「我的工作流」中配置课程流程
          </p>
        )}
      </div>

      <LeaveModal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        classId={cls.id}
        className={cls.name}
        onConfirm={onRefresh}
      />
    </div>
  )
}

export function ClassTodoCenter() {
  const [classTodoList, setClassTodoList] = useState<ClassTodoData[]>([])

  const refresh = useCallback(() => {
    setClassTodoList(loadAllClassTodos())
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('classDataChanged', handler)
    window.addEventListener('workflowChanged', handler)
    // 每30秒自动刷新，确保课程状态变化时（开始/结束）同步更新
    const interval = setInterval(refresh, 30000)
    return () => {
      window.removeEventListener('classDataChanged', handler)
      window.removeEventListener('workflowChanged', handler)
      clearInterval(interval)
    }
  }, [refresh])

  if (classTodoList.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <div className="p-2 rounded-lg bg-amber-100">
            <Layers size={20} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">分班待办中心</h3>
            <p className="text-xs text-muted-foreground">各班级待办事项概览</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Layers size={32} className="mb-2 opacity-40" />
          <p className="text-xs">暂无当天课程，待办事项为空~</p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="p-2 rounded-lg bg-amber-100">
          <Layers size={20} className="text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">分班待办中心</h3>
          <p className="text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              各班级待办事项概览
              <span className="text-[10px] text-muted-foreground ml-1">
                · 工作流待办自动同步
              </span>
            </span>
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {classTodoList.map((item) => (
          <ClassTodoCard
            key={item.class.id}
            item={item}
            onRefresh={refresh}
          />
        ))}
      </div>
    </div>
  )
}
