'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle2, Circle,
  Check, Trash2, ListTodo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateCourseTask, deleteCourseTask } from '@/lib/store'
import { DashboardData } from './use-dashboard-data'

interface Props {
  data: DashboardData
}

type TaskFilter = 'all' | 'in-progress' | 'completed'

export function RecentTasks({ data }: Props) {
  const [filter, setFilter] = useState<TaskFilter>('all')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const filteredTasks = data.recentTasks.filter(t => {
    if (filter === 'in-progress') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const handleToggleComplete = (taskId: string, currentStatus: boolean) => {
    updateCourseTask(taskId, { completed: !currentStatus })
    data.refreshData()
  }

  const handleDelete = (taskId: string) => {
    deleteCourseTask(taskId)
    data.refreshData()
  }

  const getLessonColor = (lesson?: string) => {
    if (!lesson) return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20'
    const colors = [
      'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
      'text-green-500 bg-green-50 dark:bg-green-900/20',
      'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
      'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    ]
    const hash = lesson.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
            <ListTodo className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">最近任务</h3>
            <p className="text-sm text-muted-foreground">
              共 {data.recentTasks.length} 项
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {[
              { key: 'all' as TaskFilter, label: '全部' },
              { key: 'in-progress' as TaskFilter, label: '进行中' },
              { key: 'completed' as TaskFilter, label: '已完成' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => setFilter(opt.key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  filter === opt.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link
            href="/tasks"
            className="text-xs font-medium text-primary hover:text-primary/80"
          >
            查看全部
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="py-8 text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">暂无任务</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(task.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={cn(
                'group flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                'hover:bg-accent/50 hover:shadow-sm',
                task.completed && 'opacity-60'
              )}
            >
              <button
                onClick={() => handleToggleComplete(task.id, task.completed)}
                className="shrink-0 transition-transform hover:scale-110"
              >
                {task.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    task.completed && 'line-through text-muted-foreground'
                  )}>
                    {task.title}
                  </p>
                  {task.lesson && (
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded',
                      getLessonColor(task.lesson)
                    )}>
                      {task.lesson}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {task.date}
                  </span>
                  {task.classId && (
                    <span className="text-xs text-muted-foreground">
                      {data.classes.find(c => c.id === task.classId)?.name || '未知班级'}
                    </span>
                  )}
                </div>
              </div>

              <div className={cn(
                'flex items-center gap-1 transition-opacity duration-200',
                hoveredId === task.id ? 'opacity-100' : 'opacity-0'
              )}>
                {!task.completed && (
                  <button
                    onClick={() => handleToggleComplete(task.id, false)}
                    className="p-1.5 rounded-md hover:bg-green-100 dark:hover:bg-green-900/20 text-green-600 transition-colors"
                    title="标记完成"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(task.id)}
                  className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-colors"
                  title="删除"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {filteredTasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              已完成 {filteredTasks.filter(t => t.completed).length}/{filteredTasks.length}
            </span>
            <div className="h-1.5 w-32 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{
                  width: `${filteredTasks.length > 0
                    ? Math.round(filteredTasks.filter(t => t.completed).length / filteredTasks.length * 100)
                    : 0}%`
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
