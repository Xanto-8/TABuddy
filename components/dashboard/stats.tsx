'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  CheckCircle, Clock, Users, TrendingUp,
  FileText, MessageSquare, BookOpen, Star,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardData } from './use-dashboard-data'

interface Props {
  data: DashboardData
}

export function DashboardStats({ data }: Props) {
  const { functionStats } = data

  const stats = [
    {
      title: '已完成任务',
      value: String(functionStats.completedTasks),
      change: '',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      href: '/tasks',
      highlight: false,
    },
    {
      title: '进行中任务',
      value: String(functionStats.inProgressTasks),
      change: '',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-200',
      href: '/tasks',
      highlight: functionStats.inProgressTasks > 10,
    },
    {
      title: '学生总数',
      value: String(functionStats.totalStudents),
      change: '',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      href: '/students',
      highlight: false,
    },
    {
      title: '本周效率',
      value: `${functionStats.weeklyEfficiency}%`,
      change: '',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      href: '/tasks',
      highlight: functionStats.weeklyEfficiency < 50,
    },
    {
      title: '已批作业',
      value: String(functionStats.gradedHomework),
      change: '',
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      borderColor: 'border-indigo-200',
      href: '/homework',
      highlight: false,
    },
    {
      title: '生成反馈',
      value: String(functionStats.generatedFeedback),
      change: '',
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      borderColor: 'border-pink-200',
      href: '/feedback',
      highlight: false,
    },
    {
      title: '资源收藏',
      value: String(functionStats.savedResources),
      change: '',
      icon: BookOpen,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      borderColor: 'border-cyan-200',
      href: '/resources',
      highlight: false,
    },
    {
      title: '平均评分',
      value: String(functionStats.averageRating),
      change: '',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-200',
      href: '/homework',
      highlight: functionStats.averageRating > 0 && functionStats.averageRating < 3,
    },
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map((stat, index) => (
        <Link key={stat.title} href={stat.href} className="min-w-[200px] flex-[1_1_200px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className={cn(
              'group relative overflow-hidden rounded-xl border p-4 transition-all duration-300 h-full',
              'hover:shadow-lg hover:shadow-black/5',
              stat.borderColor,
              stat.highlight && 'ring-2 ring-red-400/50 bg-red-50/30'
            )}
          >
            {stat.highlight && (
              <div className="absolute top-2 right-2">
                <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />
              </div>
            )}
            <div className="flex items-start justify-between overflow-hidden">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {stat.title}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground truncate">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className={cn(
                'p-2 rounded-lg transition-colors duration-300 shrink-0 ml-2',
                stat.bgColor,
                'group-hover:scale-110'
              )}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
            </div>

            <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-500', stat.bgColor)}
                style={{
                  width: `${Math.min(100, parseInt(stat.value) * (stat.title.includes('效率') ? 1 : stat.title.includes('评分') ? 20 : 2))}%`
                }}
              />
            </div>

            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </motion.div>
        </Link>
      ))}
    </div>
  )
}
