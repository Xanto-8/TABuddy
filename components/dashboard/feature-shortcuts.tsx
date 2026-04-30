'use client'

import React from 'react'
import Link from 'next/link'
import { Zap, GraduationCap, FileText, ClipboardList, MessageSquare, BookOpen } from 'lucide-react'

const shortcuts = [
  { icon: GraduationCap, label: '班级管理', href: '/classes', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  { icon: FileText, label: '作业管理', href: '/homework', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  { icon: ClipboardList, label: '随堂测验', href: '/quizzes', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
  { icon: MessageSquare, label: '反馈管理', href: '/feedback', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  { icon: BookOpen, label: '教学资源', href: '/resources', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/20' },
]

export function FeatureShortcuts() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">快捷入口</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {shortcuts.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg ${item.bg} border border-border/50 hover:border-border transition-all duration-150 hover:shadow-sm active:scale-[0.97]`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
                <span className="text-[11px] font-medium text-muted-foreground">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
