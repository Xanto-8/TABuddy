'use client'

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  CalendarDays, ChevronLeft, ChevronRight,
  Clock, CheckCircle2, Circle, X
} from 'lucide-react'
import {
  getClasses, getClassSchedules, getClassTypeLabel,
  getCourseTasksByClassAndDate, generateDailyInstances,
  updateCourseTask, saveCourseTask,
  getDeletedScheduleDates, addDeletedScheduleDate,
  addNotification, hasReminderBeenSent, markReminderSent
} from '@/lib/store'

interface CourseEntry {
  id: string
  courseName: string
  startTime: string
  endTime: string
  classId: string
  className: string
  classTypeLabel: string
}

type TabView = 'today' | 'week' | 'month'

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDateStr(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number)
  return { y, m, d }
}

function formatDate(dateStr: string): string {
  const { m, d } = parseDateStr(dateStr)
  return `${m}月${d}日`
}

function getDayOfWeek(dateStr: string): string {
  const { y, m, d } = parseDateStr(dateStr)
  return WEEKDAY_NAMES[new Date(y, m - 1, d).getDay()]
}

function getTodayStr(): string {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function getWeekDateStrs(): string[] {
  const today = new Date()
  const dow = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - dow + (dow === 0 ? -6 : 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
  })
}

function getCoursesForClassOnDate(classId: string, dateStr: string): CourseEntry[] {
  const classItem = getClasses().find(c => c.id === classId)
  if (!classItem) return []
  const schedules = getClassSchedules(classId)
  if (schedules.length === 0) return []
  const { y, m, d } = parseDateStr(dateStr)
  const dow = new Date(y, m - 1, d).getDay()
  const daySchedules = schedules.filter(s => s.dayOfWeek === dow)
  return daySchedules.map((s, idx) => ({
    id: `${classId}-${dateStr}-${idx}`,
    courseName: classItem.name,
    startTime: s.startTime,
    endTime: s.endTime,
    classId: classItem.id,
    className: classItem.name,
    classTypeLabel: getClassTypeLabel(classItem.type),
  }))
}

function getAllCoursesForDate(dateStr: string): CourseEntry[] {
  const classes = getClasses()
  const results: CourseEntry[] = []
  for (const cls of classes) {
    const deleted = getDeletedScheduleDates(cls.id)
    if (deleted.includes(dateStr)) continue
    const courses = getCoursesForClassOnDate(cls.id, dateStr)
    results.push(...courses)
  }
  return results.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function isDateCheckedIn(classId: string, date: string): boolean {
  const tasks = getCourseTasksByClassAndDate(classId, date)
  if (tasks.length === 0) return false
  return tasks.every(t => t.completed)
}

function markDateCheckedIn(classId: string, date: string): void {
  generateDailyInstances(classId, date)
  const tasks = getCourseTasksByClassAndDate(classId, date)
  if (tasks.length === 0) {
    saveCourseTask({ classId, lesson: '', title: '上课', content: '', date, completed: true })
  } else {
    tasks.forEach(t => updateCourseTask(t.id, { completed: true }))
  }
  window.dispatchEvent(new Event('classDataChanged'))
}

function markDateUncheckedIn(classId: string, date: string): void {
  const tasks = getCourseTasksByClassAndDate(classId, date)
  if (tasks.length === 0) {
    saveCourseTask({ classId, lesson: '', title: '上课', content: '', date, completed: false })
  } else {
    tasks.forEach(t => updateCourseTask(t.id, { completed: false }))
  }
  window.dispatchEvent(new Event('classDataChanged'))
}

function isCourseNow(start: string, end: string): boolean {
  const now = new Date()
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  return cur >= startMin && cur <= endMin
}

type CourseStatus = 'ended' | 'in_progress' | 'not_started'

function getCourseStatus(start: string, end: string, now: Date): CourseStatus {
  const cur = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em
  if (cur < startMin) return 'not_started'
  if (cur <= endMin) return 'in_progress'
  return 'ended'
}

function formatRemainingTime(endTime: string, now: Date): string {
  const [eh, em] = endTime.split(':').map(Number)
  const endTotalSec = eh * 3600 + em * 60
  const curTotalSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  let diff = endTotalSec - curTotalSec
  if (diff <= 0) return '0:00'
  const h = Math.floor(diff / 3600)
  diff %= 3600
  const m = Math.floor(diff / 60)
  const s = diff % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function getMinutesUntil(start: string, now: Date): number {
  const [sh, sm] = start.split(':').map(Number)
  const startMin = sh * 60 + sm
  const curMin = now.getHours() * 60 + now.getMinutes()
  return startMin - curMin
}

/* ------------------------------------------------------------------ */
/*  Context Menu                                                       */
/* ------------------------------------------------------------------ */
interface ContextMenuProps {
  x: number
  y: number
  onDelete: () => void
  onMarkChecked: () => void
  onMarkUnchecked: () => void
  onClose: () => void
  isChecked: boolean
}

function ContextMenu({ x, y, onDelete, onMarkChecked, onMarkUnchecked, onClose, isChecked }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleScroll = () => onClose()
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  const adjustedX = Math.min(x, window.innerWidth - 180)
  const adjustedY = Math.min(y, window.innerHeight - 140)

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.12 }}
      className="fixed z-[100] w-44 rounded-xl border border-border bg-card shadow-xl backdrop-blur-xl"
      style={{ left: adjustedX, top: adjustedY }}
    >
      <div className="py-1">
        <button
          onClick={() => { onDelete(); onClose() }}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-foreground hover:bg-accent transition-colors text-left"
        >
          <X className="h-3.5 w-3.5 text-red-500" />
          <span>删除当天此安排</span>
        </button>
        <div className="mx-3 h-px bg-border" />
        <button
          onClick={() => { onMarkChecked(); onClose() }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left',
            isChecked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-foreground hover:bg-accent'
          )}
          disabled={isChecked}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>标记为已打卡</span>
        </button>
        <button
          onClick={() => { onMarkUnchecked(); onClose() }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left',
            !isChecked ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-foreground hover:bg-accent'
          )}
          disabled={!isChecked}
        >
          <Circle className="h-3.5 w-3.5 text-red-400" />
          <span>标记为未打卡</span>
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Course Item                                                        */
/* ------------------------------------------------------------------ */
function CourseRow({ course, status, checkedIn, remainingTime, onCheckIn, onContextMenu, onClassNameClick }: {
  course: CourseEntry
  status: CourseStatus
  checkedIn: boolean | undefined
  remainingTime?: string
  onCheckIn?: () => void
  onContextMenu: (e: React.MouseEvent) => void
  onClassNameClick?: () => void
}) {
  const isEnded = status === 'ended'
  const isInProgress = status === 'in_progress'

  return (
    <div
      onContextMenu={onContextMenu}
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl border transition-all',
        'cursor-context-menu',
        isEnded && 'bg-muted/30 border-border/50 opacity-60',
        isInProgress && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 shadow-sm',
        !isEnded && !isInProgress && 'bg-card border-border hover:border-muted-foreground/20'
      )}
    >
      <div className={cn(
        'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center',
        isEnded && 'bg-muted/50',
        isInProgress && 'bg-green-100 dark:bg-green-800/30',
        !isEnded && !isInProgress && 'bg-indigo-100 dark:bg-indigo-900/20'
      )}>
        <span className={cn(
          'text-sm font-bold',
          isEnded && 'text-muted-foreground',
          isInProgress && 'text-green-700 dark:text-green-300',
          !isEnded && !isInProgress && 'text-indigo-600 dark:text-indigo-400'
        )}>
          {course.startTime.split(':')[0]}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-semibold truncate',
            isEnded ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {course.courseName}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onClassNameClick?.() }}
            className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
          >
            {course.classTypeLabel}
          </button>
          {isInProgress && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 animate-pulse">
              进行中
            </span>
          )}
          {isEnded && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              课程已结束
            </span>
          )}
          {!isEnded && !isInProgress && (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              课程暂未开始
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className={cn('h-3 w-3', isEnded ? 'text-muted-foreground/50' : 'text-muted-foreground')} />
          <span className={cn(
            'text-[11px]',
            isEnded ? 'text-muted-foreground/50' : 'text-muted-foreground'
          )}>
            {course.startTime} - {course.endTime}
          </span>
          {isInProgress && remainingTime && (
            <span className="text-[10px] font-mono font-bold text-green-600 dark:text-green-400 tabular-nums">
              剩余 {remainingTime}
            </span>
          )}
        </div>
      </div>
      {checkedIn !== undefined && (
        checkedIn
          ? <CheckCircle2 className={cn('h-5 w-5 text-emerald-500 shrink-0', isEnded && 'opacity-50')} />
          : <button
              onClick={(e) => { e.stopPropagation(); onCheckIn?.() }}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shrink-0 cursor-pointer"
              title="标记已打卡"
            >
              <Circle className="h-3 w-3" />
              未打卡
            </button>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function ScheduleAttendanceCard({ className }: { className?: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<TabView>('today')
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [refreshKey, setRefreshKey] = useState(0)
  const [now, setNow] = useState(new Date())
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    date: string
    classId: string
  } | null>(null)

  const todayStr = useMemo(getTodayStr, [])
  const weekStrs = useMemo(getWeekDateStrs, [])

  /* ---- Real-time clock ---- */
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  /* ---- Today View ---- */
  const todayCourses = useMemo(() => {
    return getAllCoursesForDate(todayStr)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayStr, refreshKey])

  /* ---- Week View ---- */
  const weekData = useMemo(() => {
    return weekStrs
      .map(dateStr => {
        const courses = getAllCoursesForDate(dateStr)
        if (courses.length === 0) return null
        return { date: dateStr, courses }
      })
      .filter(Boolean) as { date: string; courses: CourseEntry[] }[]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStrs, refreshKey])

  /* ---- Month View ---- */
  const daysInMonth = useMemo(() => new Date(calYear, calMonth, 0).getDate(), [calYear, calMonth])
  const firstDow = useMemo(() => new Date(calYear, calMonth - 1, 1).getDay(), [calYear, calMonth])

  const monthCoursesMap = useMemo(() => {
    const map = new Map<string, CourseEntry[]>()
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toDateStr(calYear, calMonth, day)
      const courses = getAllCoursesForDate(dateStr)
      if (courses.length > 0) {
        map.set(dateStr, courses)
      }
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonth, daysInMonth, refreshKey])

  const calendarCells = useMemo(() => {
    const blanks = Array.from({ length: firstDow }, (_, i) => ({ type: 'blank' as const, key: `b-${i}` }))
    const cells = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1
      const dateStr = toDateStr(calYear, calMonth, day)
      const courses = monthCoursesMap.get(dateStr) || []
      return {
        type: 'day' as const,
        key: dateStr,
        dateStr,
        day,
        courses,
        isToday: dateStr === todayStr,
      }
    })
    const totalSlots = blanks.length + cells.length
    const remaining = totalSlots <= 35 ? 35 - totalSlots : 42 - totalSlots
    const trailers = Array.from({ length: remaining }, (_, i) => ({ type: 'blank' as const, key: `t-${i}` }))
    return [...blanks, ...cells, ...trailers]
  }, [firstDow, daysInMonth, calYear, calMonth, monthCoursesMap, todayStr])

  /* ---- Actions ---- */
  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const handleCheckIn = useCallback((classId: string, date: string) => {
    markDateCheckedIn(classId, date)
    triggerRefresh()
  }, [triggerRefresh])

  const handleUncheckIn = useCallback((classId: string, date: string) => {
    markDateUncheckedIn(classId, date)
    triggerRefresh()
  }, [triggerRefresh])

  const handleDeleteSchedule = useCallback((classId: string, date: string) => {
    addDeletedScheduleDate(classId, date)
    setContextMenu(null)
    triggerRefresh()
  }, [triggerRefresh])

  const goMonth = useCallback((delta: number) => {
    let m = calMonth + delta
    let y = calYear
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setCalMonth(m)
    setCalYear(y)
  }, [calMonth, calYear])

  const contextDate = contextMenu?.date || ''
  const contextClassId = contextMenu?.classId || ''

  useEffect(() => {
    const handler = () => triggerRefresh()
    window.addEventListener('classDataChanged', handler)
    return () => window.removeEventListener('classDataChanged', handler)
  }, [triggerRefresh])

  /* ---- Pre-class reminder effect ---- */
  useEffect(() => {
    const interval = setInterval(() => {
      const courses = getAllCoursesForDate(getTodayStr())
      courses.forEach(course => {
        const minsUntil = getMinutesUntil(course.startTime, new Date())
        if (minsUntil === 30 && !hasReminderBeenSent(course.id, '30min')) {
          addNotification({
            classId: course.classId,
            className: course.className,
            type: '30min',
            title: '课程即将开始',
            message: `「${course.className}」将在30分钟后开始上课（${course.startTime}），请记得打卡！`,
          })
          markReminderSent(course.id, course.classId, '30min')
        }
        if (minsUntil === 15 && !hasReminderBeenSent(course.id, '15min')) {
          addNotification({
            classId: course.classId,
            className: course.className,
            type: '15min',
            title: '课程即将开始',
            message: `「${course.className}」将在15分钟后开始上课（${course.startTime}），请尽快打卡！`,
          })
          markReminderSent(course.id, course.classId, '15min')
        }
      })
    }, 60000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 280, damping: 25 }}
      className={cn('rounded-xl border border-border bg-card overflow-hidden', className)}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
            <CalendarDays className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="font-semibold text-foreground">我的课表</h3>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5 mb-4">
          {(['today', 'week', 'month'] as const).map(v => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={cn(
                'flex-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all',
                tab === v
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'today' ? '今日安排' : v === 'week' ? '本周安排' : '月度安排'}
            </button>
          ))}
        </div>

        {/* ==================== Views with transition ==================== */}
        <AnimatePresence mode="wait">
          {/* ==================== Today View ==================== */}
          {tab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <div className="space-y-2.5 min-h-[300px]">
                {todayCourses.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">今日无课程安排</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      请在班级管理中为班级设置上课时间
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-1 pb-1">
                      <span className="text-[11px] text-muted-foreground">
                        共 {todayCourses.length} 节课
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
                        {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}:{String(now.getSeconds()).padStart(2, '0')}
                      </span>
                    </div>
                    {todayCourses.map((course) => {
                      const status = getCourseStatus(course.startTime, course.endTime, now)
                      const remainingTime = status === 'in_progress' ? formatRemainingTime(course.endTime, now) : undefined
                      const checkedIn = isDateCheckedIn(course.classId, todayStr)
                      return (
                        <CourseRow
                          key={course.id}
                          course={course}
                          status={status}
                          checkedIn={checkedIn}
                          remainingTime={remainingTime}
                          onCheckIn={() => handleCheckIn(course.classId, todayStr)}
                          onContextMenu={(e) => setContextMenu({
                            x: e.clientX, y: e.clientY,
                            date: todayStr, classId: course.classId
                          })}
                          onClassNameClick={() => router.push(`/classes/${course.classId}`)}
                        />
                      )
                    })}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== Week View ==================== */}
          {tab === 'week' && (
            <motion.div
              key="week"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <div className="space-y-1 min-h-[300px]">
                {weekData.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">本周无课程安排</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      请在班级管理中设置上课时间
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3">
                    {weekData.map(({ date, courses }) => (
                      <div key={date}>
                        <div className="flex items-center gap-2 py-1.5 px-1">
                          <div className={cn(
                            'h-5 w-5 rounded-full flex items-center justify-center',
                            date === todayStr ? 'bg-primary/15' : 'bg-muted'
                          )}>
                            <span className={cn(
                              'text-[10px] font-bold',
                              date === todayStr ? 'text-primary' : 'text-muted-foreground'
                            )}>
                              {parseInt(date.split('-')[2])}
                            </span>
                          </div>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {formatDate(date)} 周{getDayOfWeek(date)}
                          </span>
                          {date === todayStr && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                              今天
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5 pl-1">
                          {courses.map((course) => {
                            const checkedIn = isDateCheckedIn(course.classId, date)
                            return (
                              <div
                                key={course.id}
                                onContextMenu={(e) => setContextMenu({
                                  x: e.clientX, y: e.clientY,
                                  date, classId: course.classId
                                })}
                                className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-context-menu"
                              >
                                <div className={cn(
                                  'w-2 h-2 rounded-full shrink-0',
                                  checkedIn ? 'bg-emerald-500' : 'bg-red-500'
                                )} />
                                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                                  <Clock className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-foreground">{course.courseName}</span>
                                    <span className="text-[10px] font-medium px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                      {course.className}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {course.startTime}-{course.endTime}
                                  </span>
                                </div>
                                <span className={cn(
                                  'text-[10px] font-medium flex items-center gap-1',
                                  checkedIn ? 'text-emerald-600' : 'text-red-500'
                                )}>
                                  <span className={cn(
                                    'w-1.5 h-1.5 rounded-full',
                                    checkedIn ? 'bg-emerald-500' : 'bg-red-500'
                                  )} />
                                  {checkedIn ? '已打卡' : '未打卡'}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ==================== Month View ==================== */}
          {tab === 'month' && (
            <motion.div
              key="month"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeInOut' }}
            >
              <div className="min-h-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => goMonth(-1)}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-foreground">{calYear}年{calMonth}月</span>
                  <button
                    onClick={() => goMonth(1)}
                    className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

            <div className="grid grid-cols-7 gap-[2px]">
              {WEEKDAY_NAMES.map(n => (
                <div key={n} className="text-center text-[10px] font-medium text-muted-foreground py-1.5">
                  {n}
                </div>
              ))}
              {calendarCells.map(cell => {
                if (cell.type === 'blank') {
                  return <div key={cell.key} className="aspect-square" />
                }
                return (
                  <div
                    key={cell.key}
                    className={cn(
                      'relative rounded-lg border transition-all duration-150 p-1',
                      cell.isToday
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border',
                      cell.courses.length > 0
                        ? 'bg-gradient-to-b from-transparent to-indigo-50/40 dark:to-indigo-950/20'
                        : 'bg-muted/30'
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium leading-none',
                      cell.isToday ? 'text-primary' : 'text-foreground',
                      cell.courses.length === 0 && 'text-muted-foreground/40'
                    )}>
                      {cell.day}
                    </span>
                    {cell.courses.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {cell.courses.map((course) => {
                          const checkedIn = isDateCheckedIn(course.classId, cell.dateStr)
                          return (
                            <div
                              key={course.id}
                              onContextMenu={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setContextMenu({
                                  x: e.clientX, y: e.clientY,
                                  date: cell.dateStr, classId: course.classId
                                })
                              }}
                              className={cn(
                                'flex items-center gap-0.5 text-[8px] leading-tight rounded-sm px-0.5 cursor-context-menu',
                                checkedIn
                                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                              )}
                            >
                              <span className={cn(
                                'w-1 h-1 rounded-full shrink-0',
                                checkedIn ? 'bg-emerald-500' : 'bg-red-400'
                              )} />
                              <span className="truncate">{course.className}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 已打卡
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> 未打卡
              </span>
              <span className="flex items-center gap-1 text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" /> 今天
              </span>
            </div>

            <div className="mt-2 text-[10px] text-muted-foreground/50 text-center">
              右键点击课程可进行操作
            </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isChecked={isDateCheckedIn(contextClassId, contextDate)}
            onDelete={() => handleDeleteSchedule(contextClassId, contextDate)}
            onMarkChecked={() => handleCheckIn(contextClassId, contextDate)}
            onMarkUnchecked={() => handleUncheckIn(contextClassId, contextDate)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
