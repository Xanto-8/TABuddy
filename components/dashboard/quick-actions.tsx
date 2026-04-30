'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plus, Upload, FileText, GraduationCap,
  Camera, Link as LinkIcon, Zap, Sparkles, GripVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DashboardData } from './use-dashboard-data'

interface Props {
  data: DashboardData
}

const defaultActions = [
  {
    id: 'new-task',
    title: '新建任务',
    description: '添加待办事项',
    icon: Plus,
    color: 'bg-blue-500',
    href: '/tasks',
  },
  {
    id: 'grade-homework',
    title: '批改作业',
    description: '评估学生作业',
    icon: FileText,
    color: 'bg-green-500',
    href: '/homework',
  },
  {
    id: 'upload-quiz',
    title: '上传小测',
    description: '批量处理照片',
    icon: Camera,
    color: 'bg-purple-500',
    href: '/quizzes',
  },
  {
    id: 'generate-feedback',
    title: '生成反馈',
    description: '学情分析',
    icon: GraduationCap,
    color: 'bg-pink-500',
    href: '/feedback',
  },
  {
    id: 'add-resource',
    title: '添加资源',
    description: '收藏教学资料',
    icon: LinkIcon,
    color: 'bg-amber-500',
    href: '/resources',
  },
  {
    id: 'export',
    title: '一键导出',
    description: '生成报告',
    icon: Upload,
    color: 'bg-indigo-500',
    href: '/push-logs',
  },
]

export function QuickActions({ data }: Props) {
  const [actions, setActions] = useState(defaultActions)
  const [dragId, setDragId] = useState<string | null>(null)

  const { coreStats } = data
  const hasPendingTodos = coreStats.todayTasks.total > coreStats.todayTasks.completed

  const handleDragStart = (id: string) => {
    setDragId(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    if (!dragId || dragId === id) return
    const newActions = [...actions]
    const fromIndex = newActions.findIndex(a => a.id === dragId)
    const toIndex = newActions.findIndex(a => a.id === id)
    const [moved] = newActions.splice(fromIndex, 1)
    newActions.splice(toIndex, 0, moved)
    setActions(newActions)
    setDragId(id)
  }

  const handleDragEnd = () => {
    setDragId(null)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">快速操作</h3>
            <p className="text-sm text-muted-foreground">常用功能一键直达</p>
          </div>
        </div>
        <Sparkles className="h-5 w-5 text-primary" />
      </div>

      {hasPendingTodos && (
        <div className="mb-4 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            还有 <strong>{coreStats.todayTasks.total - coreStats.todayTasks.completed}</strong> 项待办未完成
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            draggable
            onDragStart={() => handleDragStart(action.id)}
            onDragOver={(e) => handleDragOver(e, action.id)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative',
              dragId === action.id && 'opacity-50'
            )}
          >
            <Link href={action.href}>
              <div
                className={cn(
                  'h-auto w-full flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-300 cursor-pointer',
                  'hover:border-primary/50 hover:bg-primary/5',
                  'border-border bg-background'
                )}
              >
                <div className={cn('p-2 rounded-full text-white', action.color)}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 cursor-grab">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">智能推荐</p>
            <p className="text-xs text-muted-foreground">基于你的使用习惯</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs">
            查看全部
          </Button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full w-3/4" />
          </div>
          <span className="text-xs font-medium">3个推荐</span>
        </div>
      </div>
    </div>
  )
}
