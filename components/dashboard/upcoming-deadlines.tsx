'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle, Clock, Calendar,
  AlertCircle, CheckCircle2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateCourseTask } from '@/lib/store'
import { DashboardData } from './use-dashboard-data'

interface Props {
  data: DashboardData
}

export function UpcomingDeadlines({ data }: Props) {
  const todayStr = new Date().toISOString().split('T')[0]

  const deadlines = data.upcomingDeadlines.map(task => {
    const daysUntilDue = Math.ceil(
      (new Date(task.date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)
    )
    return { ...task, daysUntilDue }
  })

  const handleQuickComplete = (taskId: string) => {
    updateCourseTask(taskId, { completed: true })
    data.refreshData()
  }

  const getDeadlineStatus = (daysUntilDue: number) => {
    if (daysUntilDue <= 0) return { label: '已截止', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertCircle }
    if (daysUntilDue <= 1) return { label: '紧急', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle }
    if (daysUntilDue <= 3) return { label: '即将截止', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Clock }
    return { label: '进行中', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: Calendar }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">即将截止</h3>
            <p className="text-sm text-muted-foreground">
              {deadlines.filter(d => d.daysUntilDue <= 1).length > 0
                ? `${deadlines.filter(d => d.daysUntilDue <= 1).length} 项紧急`
                : `${deadlines.length} 项待处理`}
            </p>
          </div>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-medium text-primary hover:text-primary/80"
        >
          查看全部
        </Link>
      </div>

      <div className="space-y-3">
        {deadlines.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无即将截止的任务</p>
            <p className="text-xs text-muted-foreground mt-1">继续保持！</p>
          </div>
        ) : (
          deadlines.map((task, index) => {
            const status = getDeadlineStatus(task.daysUntilDue)
            const isUrgent = task.daysUntilDue <= 1

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className={cn(
                  'group relative overflow-hidden rounded-lg border p-4 transition-all duration-300',
                  'hover:shadow-md',
                  status.border,
                  isUrgent && 'bg-red-50/50 dark:bg-red-950/20'
                )}
              >
                {isUrgent && (
                  <div className="absolute top-0 right-0">
                    <div className="h-16 w-16 bg-red-500/10 rounded-bl-full" />
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <status.icon className={cn('h-4 w-4 shrink-0', status.color)} />
                      <p className={cn(
                        'text-sm font-medium truncate',
                        isUrgent && 'text-red-700 dark:text-red-300'
                      )}>
                        {task.title}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {task.date}
                      </span>
                      {task.classId && (
                        <span>
                          {data.classes.find(c => c.id === task.classId)?.name || '未知班级'}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                        status.bg,
                        status.color
                      )}>
                        {status.label}
                      </span>
                      {task.daysUntilDue > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          剩余 {task.daysUntilDue} 天
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleQuickComplete(task.id)}
                    className="shrink-0 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    title="标记完成"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>

                {isUrgent && (
                  <div className="mt-3 h-1 w-full bg-red-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full animate-pulse" style={{ width: '100%' }} />
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {deadlines.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              紧急: {deadlines.filter(d => d.daysUntilDue <= 1).length} 项
            </span>
            <span>
              即将截止: {deadlines.filter(d => d.daysUntilDue > 1 && d.daysUntilDue <= 3).length} 项
            </span>
            <span>
              进行中: {deadlines.filter(d => d.daysUntilDue > 3).length} 项
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
