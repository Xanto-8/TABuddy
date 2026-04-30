'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Clock, BookOpen, ListTodo, Bell, X, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardData } from './use-dashboard-data'
import { useCallback } from 'react'
import { getQuizRecordsByClass, getStudentsByClass } from '@/lib/store'

interface Props {
  data: DashboardData
}

export function WelcomeBanner({ data }: Props) {
  const currentHour = new Date().getHours()
  const greeting = currentHour < 6 ? '夜深了' : currentHour < 12 ? '早上好' : currentHour < 14 ? '中午好' : currentHour < 18 ? '下午好' : '晚上好'
  const emoji = currentHour < 6 ? '🌙' : currentHour < 12 ? '🌅' : currentHour < 14 ? '☀️' : currentHour < 18 ? '🌤️' : '🌆'

  const { welcomeStats } = data
  const {
    todayCourseCount,
    currentTeachingClass,
    remainingClassTime,
    pendingClassCount,
  } = welcomeStats

  const [showRetestModal, setShowRetestModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const retestData = useMemo(() => {
    const cls = currentTeachingClass
    if (!cls) return { count: 0, list: [] as { name: string; accuracy: number }[] }

    const students = getStudentsByClass(cls.id)
    const allQuizRecords = getQuizRecordsByClass(cls.id)

    const result: { name: string; accuracy: number }[] = []

    for (const student of students) {
      const studentRecords = allQuizRecords.filter(r => r.studentId === student.id)
      const latestWithWord = studentRecords
        .filter(r => r.wordScore != null && r.wordTotal != null && r.wordTotal > 0)
        .sort((a, b) => new Date(b.assessedAt).getTime() - new Date(a.assessedAt).getTime())[0]

      if (latestWithWord) {
        const accuracy = Math.round((latestWithWord.wordScore! / latestWithWord.wordTotal!) * 100)
        if (accuracy < 80) {
          result.push({ name: student.name, accuracy })
        }
      }
    }

    result.sort((a, b) => a.accuracy - b.accuracy)
    return { count: result.length, list: result }
  }, [currentTeachingClass])

  const handleCopy = useCallback(async () => {
    const className = currentTeachingClass?.name ?? ''
    const header = `${className}班需重测名单`
    const rows = retestData.list.map(s => `${s.name} 单词正确率${s.accuracy}%`)
    const footer = '以上孩子可课后留下重测🤝'
    const text = [header, ...rows, footer].join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [retestData.list, currentTeachingClass?.name])

  const scrollToClassProgress = useCallback(() => {
    const el = document.getElementById('class-progress-center')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10 border border-border p-6"
      >
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                  {greeting}，助教老师 {emoji}
                </h1>
              </div>
              <p className="text-sm md:text-base text-muted-foreground truncate">
                今天是 {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/classes" className="min-w-0">
              <div className={cn(
                "p-4 rounded-lg border transition-all duration-300 h-full",
                "bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200",
                "hover:shadow-md hover:-translate-y-1"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">今日课程</p>
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                {todayCourseCount > 0 ? (
                  <>
                    <p className="text-xl font-bold text-foreground">今日共 {todayCourseCount} 节课</p>
                    {currentTeachingClass && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>正在上课：{currentTeachingClass.name}（{remainingClassTime}）</span>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无课程</p>
                )}
              </div>
            </Link>

            <div className="min-w-0 relative group cursor-pointer" onClick={scrollToClassProgress}>
              <div className={cn(
                "p-4 rounded-lg border transition-all duration-300 h-full",
                "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200",
                "hover:shadow-md hover:-translate-y-1"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">今日待收尾班级</p>
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ListTodo className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                {pendingClassCount > 0 ? (
                  <p className="text-xl font-bold text-foreground">今日剩余 {pendingClassCount} 个班级待收尾</p>
                ) : (
                  <p className="text-sm text-muted-foreground">所有班级已收尾</p>
                )}
              </div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                点击查看所有未完成收尾的班级
              </div>
            </div>

            <div className="min-w-0 relative group cursor-pointer" onClick={() => setShowRetestModal(true)}>
              <div className={cn(
                "p-4 rounded-lg border transition-all duration-300 h-full",
                "bg-gradient-to-br from-rose-50 to-orange-50 border-rose-200",
                "hover:shadow-md hover:-translate-y-1"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">今日重点提醒</p>
                  <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-rose-600" />
                  </div>
                </div>
                {currentTeachingClass ? (
                  retestData.count > 0 ? (
                    <p className="text-xl font-bold text-foreground">需重测：{retestData.count}人</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无需要重测的学生</p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">暂无正在上课的班级</p>
                )}
              </div>
              {currentTeachingClass && retestData.count > 0 && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
                  点击查看需重测学生名单
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute top-0 right-0 h-32 w-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 h-24 w-24 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full translate-y-12 -translate-x-12" />
      </motion.div>

      <AnimatePresence>
        {showRetestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowRetestModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.9 }}
              className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">需重测学生名单</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currentTeachingClass?.name} · 单词正确率低于 80%
                  </p>
                </div>
                <button
                  onClick={() => setShowRetestModal(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {retestData.list.length > 0 ? (
                <div className="space-y-1.5 mb-4 max-h-60 overflow-y-auto">
                  {retestData.list.map((s, i) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 text-xs font-medium flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">{s.name}</span>
                      </div>
                      <span className={cn(
                        "text-sm font-mono",
                        s.accuracy < 60 ? 'text-red-500' : s.accuracy < 70 ? 'text-orange-500' : 'text-amber-500'
                      )}>
                        {s.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">暂无需要重测的学生</p>
                </div>
              )}

              {retestData.list.length > 0 && (
                <button
                  onClick={handleCopy}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      一键复制名单
                    </>
                  )}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
