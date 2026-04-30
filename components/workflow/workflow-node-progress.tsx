'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Play, Circle, CheckCircle, Clock, ChevronRight, GitBranch } from 'lucide-react'
import { getClasses, addNotification } from '@/lib/store'
import { getOrCreateWorkflowTemplate } from '@/lib/workflow-store'
import { NotificationApi } from '@/lib/notification-api'
import type { WorkflowNode, ClassType } from '@/types'
import { WORKFLOW_NODE_ICONS, WORKFLOW_NODE_LABELS } from '@/types'
import { cn } from '@/lib/utils'

interface CourseInfo {
  id: string
  name: string
  startTime: string
  endTime: string
  classId?: string
  className?: string
  courseType?: string
}

export function WorkflowNodeProgress() {
  const [courses, setCourses] = useState<CourseInfo[]>([])
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null)
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>([])
  const [completedMap, setCompletedMap] = useState<Record<string, boolean>>({})
  const [expanded, setExpanded] = useState(true)
  const [activatingNodeId, setActivatingNodeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await NotificationApi.getTodayCourses()
        if (data && data.length > 0) {
          setCourses(data)
          setSelectedCourse(data[0])
        }
      } catch {
        const localClasses = getClasses().filter(c => {
          const dayOfWeek = new Date().getDay()
          return c.schedules?.some(s => s.dayOfWeek === dayOfWeek)
        })
        if (localClasses.length > 0) {
          const now = new Date()
          const todayStr = now.toISOString().slice(0, 10)
          const mapped: CourseInfo[] = localClasses.map(c => ({
            id: c.id,
            name: c.name,
            startTime: `${todayStr}T00:00:00.000Z`,
            endTime: `${todayStr}T23:59:00.000Z`,
            classId: c.id,
            className: c.name,
            courseType: c.type,
          }))
          setCourses(mapped)
          setSelectedCourse(mapped[0])
        }
      } finally {
        setLoading(false)
      }
    }
    loadCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    const courseType = (selectedCourse.courseType || 'GY') as ClassType
    const template = getOrCreateWorkflowTemplate(courseType)
    const sortedNodes = [...template.nodes]
      .filter(n => n.enabled)
      .sort((a, b) => a.order - b.order)
    setWorkflowNodes(sortedNodes)
  }, [selectedCourse])

  const completedCount = useMemo(() => {
    return workflowNodes.filter(n => completedMap[n.id]).length
  }, [workflowNodes, completedMap])

  const fireNotification = useCallback(async (node: WorkflowNode) => {
    const nodeName = node.customName || WORKFLOW_NODE_LABELS[node.type]
    const courseType = selectedCourse?.courseType || 'GY'
    const className = selectedCourse?.className || selectedCourse?.name || ''
    const classId = selectedCourse?.classId || selectedCourse?.id || ''

    setActivatingNodeId(node.id)

    try {
      const result = await NotificationApi.fireWorkflowNodeReminder({
        classId,
        className,
        courseType,
        workflowNodeId: node.id,
        workflowNodeName: nodeName,
      })

      addNotification({
        classId,
        className,
        type: 'workflow_node',
        title: result.workflowNodeName,
        message: result.message,
      })
    } catch {
      const fallbackMessage = `现在可以开始处理「${nodeName}」啦，加油哦~`
      addNotification({
        classId,
        className,
        type: 'workflow_node',
        title: nodeName,
        message: fallbackMessage,
      })
    }

    setActivatingNodeId(null)
  }, [selectedCourse])

  const toggleComplete = useCallback(async (node: WorkflowNode) => {
    const nodeName = node.customName || WORKFLOW_NODE_LABELS[node.type]
    const classId = selectedCourse?.classId || selectedCourse?.id || ''

    setCompletedMap(prev => {
      const current = prev[node.id] ?? false
      return { ...prev, [node.id]: !current }
    })

    const willBeCompleted = !(completedMap[node.id] ?? false)
    if (willBeCompleted) {
      try {
        await NotificationApi.completeWorkflowNodeReminder({
          reminderId: `manual_complete_${classId}_${node.id}`,
          classId,
          workflowNodeId: node.id,
        })
      } catch {
        // Silently proceed
      }
    }
  }, [selectedCourse])

  const formatCourseTime = (startTime: string, endTime: string) => {
    const fmt = (t: string) => {
      const d = new Date(t)
      return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    }
    return `${fmt(startTime)} - ${fmt(endTime)}`
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-green-100">
            <GitBranch size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">课中工作流</h3>
            <p className="text-xs text-muted-foreground">加载课程中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (courses.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-green-100">
            <GitBranch size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              课中工作流
              {workflowNodes.length > 0 && (
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({completedCount}/{workflowNodes.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">
              点击左侧单选框标记完成，点击右侧按钮触发提醒
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground"
        >
          <ChevronRight size={16} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
      </div>

      {courses.length > 1 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              className={cn(
                'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200',
                selectedCourse?.id === course.id
                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-700/50 dark:text-green-400'
                  : 'bg-card border-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
              )}
            >
              {course.name}
            </button>
          ))}
        </div>
      )}

      {expanded && (
        <div>
          {selectedCourse && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{selectedCourse.name}</span>
                </div>
                {selectedCourse.startTime && (
                  <span className="text-xs text-muted-foreground">
                    {formatCourseTime(selectedCourse.startTime, selectedCourse.endTime)}
                  </span>
                )}
              </div>
            </div>
          )}

          {workflowNodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">当前课程暂无已启用的工作流节点</p>
              <p className="text-[10px] mt-1">请先在「我的工作流」中配置课程流程</p>
            </div>
          ) : (
            <div>
              {workflowNodes.map((node, index) => {
                const isCompleted = completedMap[node.id] ?? false
                const isActivating = activatingNodeId === node.id

                return (
                  <div
                    key={node.id}
                    className="flex items-center gap-3 p-3 rounded-xl border border-green-200 bg-white shadow-sm mb-1.5 dark:border-green-700/30 dark:bg-green-950/20"
                  >
                    <div className={cn('shrink-0 w-5 flex items-center justify-center', isCompleted && 'opacity-50')}>
                      <button
                        onClick={() => toggleComplete(node)}
                        className="focus:outline-none"
                        title={isCompleted ? '取消完成' : '标记完成'}
                      >
                        {isCompleted ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-green-500 hover:text-green-600 transition-colors" />
                        )}
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        'text-sm font-medium flex items-center gap-1.5',
                        isCompleted
                          ? 'text-muted-foreground/60'
                          : 'text-green-700 dark:text-green-300'
                      )}>
                        <span className={cn('text-base', isCompleted && 'opacity-40')}>
                          {WORKFLOW_NODE_ICONS[node.type]}
                        </span>
                        {node.customName || WORKFLOW_NODE_LABELS[node.type]}
                      </span>
                    </div>

                    <div className="shrink-0 w-[100px] flex items-center justify-end">
                      <button
                        onClick={() => fireNotification(node)}
                        disabled={isActivating || isCompleted}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                          isCompleted
                            ? 'bg-muted/50 text-muted-foreground/60 border border-border pointer-events-none'
                            : isActivating
                              ? 'bg-green-100 text-green-400 cursor-wait'
                              : 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700 shadow-sm'
                        )}
                      >
                        {isCompleted ? (
                          <span>已完成 ✓</span>
                        ) : isActivating ? (
                          <>
                            <span className="w-3 h-3 border-2 border-green-300 border-t-transparent rounded-full animate-spin" />
                            <span>处理中</span>
                          </>
                        ) : (
                          <>
                            <Play size={12} fill="currentColor" />
                            <span>触发提醒</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
