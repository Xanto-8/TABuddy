'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Class, ClassSchedule, ReminderType } from '@/types'
import {
  getClasses,
  getClassSchedules,
  getCourseTasksByClassAndDate,
  hasReminderBeenSent,
  markReminderSent,
  addNotification,
  getNotifications,
  markNotificationsCompletedByClass,
} from '@/lib/store'

function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0]
}

function getTodayDayOfWeek(): number {
  return new Date().getDay()
}

function getCurrentTimeInMinutes(): number {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

function getScheduleStartInMinutes(schedule: ClassSchedule): number {
  const [h, m] = schedule.startTime.split(':').map(Number)
  return h * 60 + m
}

function getMinutesUntilClass(schedule: ClassSchedule): number {
  return getScheduleStartInMinutes(schedule) - getCurrentTimeInMinutes()
}

function isClassToday(schedule: ClassSchedule): boolean {
  return schedule.dayOfWeek === getTodayDayOfWeek()
}

function hasClassCheckedIn(classId: string, date: string): boolean {
  const tasks = getCourseTasksByClassAndDate(classId, date)
  if (tasks.length === 0) return false
  return tasks.every(t => t.completed)
}

function generateNotificationMessage(className: string, minutesBefore: number): { title: string; message: string } {
  if (minutesBefore === 60) {
    return {
      title: `【${className}】课程即将开始`,
      message: `【${className}】课程还有1小时开始，请记得打卡`,
    }
  }
  return {
    title: `【${className}】课程即将开始`,
    message: `【${className}】课程还有15分钟开始，请记得打卡`,
  }
}

function scheduleIdFor(schedule: ClassSchedule, date: string): string {
  return `${schedule.id}_${date}`
}

function processReminder(
  cls: Class,
  schedule: ClassSchedule,
  minutesBefore: number,
  reminderType: ReminderType,
  date: string,
): void {
  const sId = scheduleIdFor(schedule, date)

  if (hasReminderBeenSent(sId, reminderType)) return

  if (hasClassCheckedIn(cls.id, date)) return

  const { title, message } = generateNotificationMessage(cls.name, minutesBefore)

  addNotification({
    classId: cls.id,
    className: cls.name,
    type: reminderType,
    title,
    message,
  })

  markReminderSent(sId, cls.id, reminderType)
}

export function useReminderScheduler(): void {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const tick = useCallback(() => {
    const date = getTodayDateStr()
    const currentMin = getCurrentTimeInMinutes()
    const classes = getClasses()

    for (const cls of classes) {
      const schedules = getClassSchedules(cls.id)

      for (const schedule of schedules) {
        if (!isClassToday(schedule)) continue

        const minsUntilClass = getMinutesUntilClass(schedule)

        if (minsUntilClass <= 0) continue

        if (minsUntilClass <= 62 && minsUntilClass > 58) {
          processReminder(cls, schedule, 60, '60min', date)
        }

        if (minsUntilClass <= 17 && minsUntilClass > 13) {
          processReminder(cls, schedule, 15, '15min', date)
        }
      }
    }
  }, [])

  useEffect(() => {
    tick()
    intervalRef.current = setInterval(tick, 30000)
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [tick])
}

export function useCheckInStatusWatcher(): void {
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const notifications = getNotifications()
        const today = new Date().toISOString().split('T')[0]

        for (const n of notifications) {
          if (n.completed || n.dismissed) continue
          const tasks = getCourseTasksByClassAndDate(n.classId, today)
          if (tasks.length > 0 && tasks.every(t => t.completed)) {
            markNotificationsCompletedByClass(n.classId)
          }
        }
      } catch {}
    }, 15000)

    return () => clearInterval(interval)
  }, [])
}
