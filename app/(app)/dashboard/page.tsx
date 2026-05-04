'use client'

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, BarChart3, Target, UserCheck,
  ChevronLeft, ChevronRight, KeyRound
} from 'lucide-react'
import Link from 'next/link'
import type { Class } from '@/types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useRoleAccess } from '@/lib/use-role-access'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { ScheduleAttendanceCard } from '@/components/dashboard/schedule-attendance-card'
import { ClassTodoCenter } from '@/components/dashboard/class-todo-center'
import { AtRiskStudentsPanel } from '@/components/dashboard/at-risk-students-panel'
import { WorkStatistics } from '@/components/dashboard/work-statistics'
import { FeatureShortcuts } from '@/components/dashboard/feature-shortcuts'
import { PageContainer } from '@/components/ui/page-container'
import { FocusTimer } from '@/components/focus-timer/focus-timer'
import { BindInviteCodeModal } from '@/components/assistant/bind-invite-code-modal'
import { TeacherSwitcher } from '@/components/assistant/teacher-switcher'
import { toast } from 'sonner'
import { useDashboardData } from '@/components/dashboard/use-dashboard-data'
import type { DashboardData } from '@/components/dashboard/use-dashboard-data'
import {
  getClasses,
  getStudentsByClass,
  getAllOverallAccuracyRecords,
  getClassOverallAccuracyRecords,
  getBoundTeachers,
} from '@/lib/store'

function ClassLearningOverview() {
  const [classes, setClasses] = useState<Class[]>([])
  const [totalStudents, setTotalStudents] = useState(0)
  const allAccuracyRecords = getAllOverallAccuracyRecords()

  const refresh = useCallback(() => {
    const allClasses = getClasses()
    setClasses(allClasses)
    const uniqueStudentIds = new Set<string>()
    for (const cls of allClasses) {
      const students = getStudentsByClass(cls.id)
      for (const s of students) {
        uniqueStudentIds.add(s.id)
      }
    }
    setTotalStudents(uniqueStudentIds.size)
  }, [])

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('classDataChanged', handler)
    return () => window.removeEventListener('classDataChanged', handler)
  }, [refresh])

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [slideDirection, setSlideDirection] = useState(1)

  const slideVariants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0, scale: 0.94 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir * -50, opacity: 0, scale: 0.94 }),
  }
  const chartRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => {
    return [
      { id: 'all', name: '所有班级平均' },
      ...classes.map((c) => ({ id: c.id, name: c.name })),
    ]
  }, [classes])

  const chartData = useMemo(() => {
    if (selectedIndex === 0) {
      const dateMap = new Map<string, { sum: number; count: number }>()
      for (const r of allAccuracyRecords) {
        const entry = dateMap.get(r.date) || { sum: 0, count: 0 }
        entry.sum += r.overallAccuracy
        entry.count += 1
        dateMap.set(r.date, entry)
      }
      const sortedDates = Array.from(dateMap.keys()).sort()
      return sortedDates.map((date) => ({
        date,
        accuracy: Math.round((dateMap.get(date)!.sum / dateMap.get(date)!.count) * 10) / 10,
      }))
    }
    const classId = options[selectedIndex]?.id
    if (!classId) return []
    return getClassOverallAccuracyRecords(classId).map((r) => ({
      date: r.date,
      accuracy: r.overallAccuracy,
    }))
  }, [selectedIndex, options, allAccuracyRecords])

  const navigate = useCallback((dir: number) => {
    setSlideDirection(dir)
    setSelectedIndex((prev) => (prev + dir + options.length) % options.length)
  }, [options.length])

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">班级学习概览</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <motion.span
            key={options[selectedIndex]?.name}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs font-medium text-muted-foreground min-w-[80px] text-center"
          >
            {options[selectedIndex]?.name}
          </motion.span>
          <button
            onClick={() => navigate(1)}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          班级: {classes.length}
        </span>
        <span className="flex items-center gap-1">
          <UserCheck className="h-3.5 w-3.5" />
          学生: {totalStudents}
        </span>
        <span className="flex items-center gap-1">
          <Target className="h-3.5 w-3.5" />
          记录: {allAccuracyRecords.length}
        </span>
      </div>

      <div className="relative overflow-hidden" ref={chartRef}>
        <AnimatePresence mode="popLayout" custom={slideDirection}>
          <motion.div
            key={selectedIndex}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
            className="w-full"
            style={{ minHeight: 180 }}
          >
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number) => [`${value}%`, '正确率']}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}



export default function DashboardPage() {
  const data = useDashboardData()
  const { isAssistant } = useRoleAccess()
  const [showBindModal, setShowBindModal] = useState(false)
  const [boundTeachers, setBoundTeachers] = useState<{ id: string; username: string; displayName: string }[]>([])

  useEffect(() => {
    if (isAssistant) {
      setBoundTeachers(getBoundTeachers())
    }
  }, [isAssistant])

  return (
    <PageContainer>
      <div className="space-y-6 pb-8">
        <WelcomeBanner data={data} />

        {isAssistant && boundTeachers.length > 0 && (
          <div className="bg-gradient-to-r from-primary/5 to-primary/[0.02] border border-primary/10 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 min-w-0 shrink-0">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">班级视图切换</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">选择要查看的老师班级数据</p>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-3">
                <TeacherSwitcher />
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
                  {boundTeachers.map((t, i) => (
                    <span key={t.id}>
                      <span className="font-medium text-foreground">{t.displayName || t.username}</span>
                      {i < boundTeachers.length - 1 && <span className="mx-1">·</span>}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowBindModal(true)}
                className="h-9 px-3 rounded-xl border border-primary/20 text-primary text-xs font-medium hover:bg-primary/5 transition-colors flex items-center gap-1.5 shrink-0"
              >
                <KeyRound className="w-3.5 h-3.5" />
                绑定其他老师
              </button>
            </div>
            {showBindModal && (
              <BindInviteCodeModal
                onClose={() => setShowBindModal(false)}
                onSuccess={() => {
                  setShowBindModal(false)
                  toast.success('绑定成功，已加载老师班级数据')
                  window.location.reload()
                }}
              />
            )}
          </div>
        )}

        {isAssistant && boundTeachers.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground text-sm">助教快捷操作</h3>
                <p className="text-xs text-muted-foreground mt-0.5">输入邀请码绑定老师班级，获取班级查看权限</p>
              </div>
              <button
                onClick={() => setShowBindModal(true)}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                绑定老师班级
              </button>
            </div>
            {showBindModal && (
              <BindInviteCodeModal
                onClose={() => setShowBindModal(false)}
                onSuccess={() => {
                  setShowBindModal(false)
                  toast.success('绑定成功，已加载老师班级数据')
                  window.location.reload()
                }}
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClassTodoCenter />
          <ScheduleAttendanceCard />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <ClassLearningOverview />
          <FeatureShortcuts />
          <WorkStatistics workStats={data.workStats} onRefresh={data.refreshData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AtRiskStudentsPanel />
          <FocusTimer defaultMinutes={25} />
        </div>
      </div>
    </PageContainer>
  )
}
