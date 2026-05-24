'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  SkipForward,
  ChevronDown,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import type { Class, WorkflowNodeType } from '@/types'
import { DEFAULT_WORKFLOW_NODES, WORKFLOW_NODE_LABELS } from '@/types'
import { getTodayClasses, getClassSchedules, getClassTypeColor } from '@/lib/store'
import { getWorkflowTodosByClass, getWorkflowTemplates, toggleWorkflowTodo } from '@/lib/workflow-store'
import { getLocalDateString, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TodayTodoCardProps {
  classes: Class[]
  teachingClassId: string | null
}

const WORKFLOW_STEP_ROUTES: Record<WorkflowNodeType, string> = {
  grade_homework: '/homework',
  homework_feedback: '/homework',
  grade_quiz: '/quizzes',
  quiz_analysis: '/quizzes',
  writing_correction: '/feedback',
  speaking_assessment: '/quizzes',
  course_feedback: '/feedback',
  send_content: '/feedback',
  send_homework: '/feedback',
  sync_quiz: '/quizzes',
  retest_list: '/quizzes',
  custom: '/workflow',
}

export function TodayTodoCard({ classes: _classes, teachingClassId }: TodayTodoCardProps) {
  const router = useRouter()
  const todayClasses = getTodayClasses()
  const todayStr = getLocalDateString()
  const todayDayOfWeek = new Date().getDay()
  const [expandedClassIds, setExpandedClassIds] = useState<Set<string>>(new Set())
  const [skippedSteps, setSkippedSteps] = useState<Set<string>>(new Set())
  const [_tick, setTick] = useState(0)

  const toggleExpand = (classId: string) => {
    setExpandedClassIds(prev => {
      const next = new Set(prev)
      if (next.has(classId)) {
        next.delete(classId)
      } else {
        next.add(classId)
      }
      return next
    })
  }

  const handleStepClick = (nodeType: WorkflowNodeType, classId: string) => {
    const route = WORKFLOW_STEP_ROUTES[nodeType] || '/workflow'
    router.push(`${route}?classId=${classId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          今日工作总览
        </CardTitle>
      </CardHeader>
      <CardContent>
        {todayClasses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">今天没有课程安排</p>
            <Link
              href="/classes"
              className="text-xs text-primary hover:underline mt-1"
            >
              去排课页面添加上课时间
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todayClasses.map(cls => {
              const isTeaching = cls.id === teachingClassId
              const expanded = expandedClassIds.has(cls.id)
              const schedules = getClassSchedules(cls.id).filter(s => s.dayOfWeek === todayDayOfWeek)
              const typeColor = getClassTypeColor(cls.type)

              const todos = getWorkflowTodosByClass(cls.id, todayStr)
              const completedCount = todos.filter(t => t.completed).length
              const templates = getWorkflowTemplates()
              const template = templates.find(t => t.courseType === cls.type)
              const totalCount = todos.length || (template?.nodes?.filter(n => n.enabled).length ?? DEFAULT_WORKFLOW_NODES.length)

              const completedNodeTypes = new Set(
                todos.filter(t => t.completed).map(t => t.nodeType)
              )

              return (
                <div
                  key={cls.id}
                  className={cn(
                    'rounded-lg border border-border',
                    isTeaching && 'border-l-2 border-l-primary bg-primary/5'
                  )}
                >
                  <button
                    onClick={() => toggleExpand(cls.id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors rounded-lg text-left"
                  >
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{cls.name}</span>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded', typeColor)}>
                          {cls.type}
                        </span>
                      </div>
                      {schedules.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {schedules.map(s => `${s.startTime}-${s.endTime}`).join('、')}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalCount} 已完成
                      </span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="border-t border-border pt-2 space-y-1">
                        {DEFAULT_WORKFLOW_NODES.map((nodeType) => {
                          const skipKey = `${cls.id}-${nodeType}`
                          if (skippedSteps.has(skipKey)) return null
                          const isCompleted = completedNodeTypes.has(nodeType)
                          const label = WORKFLOW_NODE_LABELS[nodeType]
                          const todo = todos.find(t => t.nodeType === nodeType)
                          return (
                            <div
                              key={nodeType}
                              className={cn(
                                'w-full flex items-center gap-2.5 p-2 rounded-lg transition-colors text-left group',
                                isCompleted
                                  ? 'text-muted-foreground'
                                  : 'hover:bg-accent'
                              )}
                            >
                              <button
                                onClick={() => !isCompleted && handleStepClick(nodeType, cls.id)}
                                disabled={isCompleted}
                                className="flex-1 flex items-center gap-2.5 min-w-0"
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                                )}
                                <span className={cn(
                                  'text-xs',
                                  isCompleted && 'line-through'
                                )}>
                                  {label}
                                </span>
                              </button>
                              {!isCompleted && (
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (todo) {
                                        toggleWorkflowTodo(todo.id, cls.id)
                                        setTick(t => t + 1)
                                      }
                                    }}
                                    className="p-1 rounded hover:bg-emerald-100 text-muted-foreground hover:text-emerald-600 transition-colors"
                                    title="快速完成"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSkippedSteps(prev => {
                                        const next = new Set(prev)
                                        next.add(skipKey)
                                        return next
                                      })
                                    }}
                                    className="p-1 rounded hover:bg-amber-100 text-muted-foreground hover:text-amber-600 transition-colors"
                                    title="跳过"
                                  >
                                    <SkipForward className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
