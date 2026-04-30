'use client'

import { useState, useEffect, useCallback } from 'react'
import { Class, CourseTask, HomeworkAssessment, FeedbackRecord } from '@/types'
import {
  getClasses, getStudents, getCourseTasks, getCourseTasksByDate,
  getHomeworkAssessments, getHomeworkAssessmentsByClass, getQuizRecords,
  getFeedbackHistory,
  getTodayClasses, getCurrentClassByTime, getClassSchedules,
  getStudentsByClass,
  getResourcesByClass,
} from '@/lib/store'
import {
  getWorkflowTodos, getWorkflowTodosByClass,
} from '@/lib/workflow-store'
import { useAutoClass } from '@/lib/use-auto-class'
import { isToday, isThisWeek } from '@/lib/utils'

export type TimeFilter = 'today' | 'week' | 'month' | 'semester'

export interface DashboardData {
  classes: Class[]
  selectedClassId: string | null
  teachingClassId: string | null
  isTeachingClass: (classId: string) => boolean
  setSelectedClass: (classId: string) => void

  welcomeStats: {
    todayClassCount: number
    totalTodos: number
    completedTodos: number
    currentTeachingClass: Class | null
    remainingClassTime: string
    todayCourseCount: number
    pendingClassCount: number
    pendingFollowUpCount: number
    pendingAssessmentCount: number
  }

  coreStats: {
    todayTasks: { total: number; completed: number; rate: number }
    homework: { total: number; graded: number; rate: number }
  }

  functionStats: {
    completedTasks: number
    inProgressTasks: number
    totalStudents: number
    weeklyEfficiency: number
    gradedHomework: number
    generatedFeedback: number
    savedResources: number
    averageRating: number
  }

  performanceData: {
    efficiency: number[]
    tasks: number[]
    feedback: number[]
    labels: string[]
  }

  workStats: {
    today: {
      completedTasks: number
      gradedHomework: number
      processedFeedback: number
      className: string | null
    }
    week: {
      completedTasks: number
      gradedHomework: number
      processedFeedback: number
      totalTarget: number
      completionRate: number
    }
  }

  recentTasks: CourseTask[]
  upcomingDeadlines: CourseTask[]
  timeFilter: TimeFilter
  setTimeFilter: (filter: TimeFilter) => void
  refreshData: () => void
}

function getRemainingClassTime(schedule: { startTime: string; endTime: string }): string {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const [endH, endM] = schedule.endTime.split(':').map(Number)
  const endMinutes = endH * 60 + endM
  const diff = endMinutes - currentMinutes
  if (diff <= 0) return '已结束'
  if (diff < 60) return `剩余 ${diff} 分钟`
  const hours = Math.floor(diff / 60)
  const mins = diff % 60
  return `剩余 ${hours} 小时${mins > 0 ? ` ${mins} 分钟` : ''}`
}

function getCurrentTeachingSchedule(classId: string): { startTime: string; endTime: string } | null {
  const now = new Date()
  const currentDay = now.getDay()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const schedules = getClassSchedules(classId)
  for (const s of schedules) {
    if (s.dayOfWeek === currentDay) {
      const [sH, sM] = s.startTime.split(':').map(Number)
      const [eH, eM] = s.endTime.split(':').map(Number)
      const start = sH * 60 + sM
      const end = eH * 60 + eM
      if (currentMinutes >= start && currentMinutes <= end) {
        return { startTime: s.startTime, endTime: s.endTime }
      }
    }
  }
  return null
}

function calculateWeeklyEfficiency(tasks: CourseTask[]): number {
  const weekTasks = tasks.filter(t => isThisWeek(new Date(t.date)))
  if (weekTasks.length === 0) return 0
  return Math.round((weekTasks.filter(t => t.completed).length / weekTasks.length) * 100)
}

function calculateAverageRating(assessments: HomeworkAssessment[]): number {
  if (assessments.length === 0) return 0
  const sum = assessments.reduce((acc, a) => acc + a.accuracy, 0)
  return Math.round((sum / assessments.length) * 10) / 10
}

function getPerformanceData(tasks: CourseTask[], assessments: HomeworkAssessment[], feedbacks: FeedbackRecord[], filter: TimeFilter) {
  const now = new Date()
  let filteredTasks = tasks
  let filteredAssessments = assessments
  let filteredFeedbacks = feedbacks

  if (filter === 'today') {
    const todayStr = now.toISOString().split('T')[0]
    filteredTasks = tasks.filter(t => t.date === todayStr)
    filteredAssessments = assessments.filter(a => isToday(new Date(a.assessedAt)))
    filteredFeedbacks = feedbacks.filter(f => isToday(new Date(f.createdAt)))
  } else if (filter === 'week') {
    filteredTasks = tasks.filter(t => isThisWeek(new Date(t.date)))
    filteredAssessments = assessments.filter(a => isThisWeek(new Date(a.assessedAt)))
    filteredFeedbacks = feedbacks.filter(f => isThisWeek(new Date(f.createdAt)))
  } else if (filter === 'month') {
    const month = now.getMonth()
    const year = now.getFullYear()
    filteredTasks = tasks.filter(t => {
      const d = new Date(t.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    filteredAssessments = assessments.filter(a => {
      const d = new Date(a.assessedAt)
      return d.getMonth() === month && d.getFullYear() === year
    })
    filteredFeedbacks = feedbacks.filter(f => {
      const d = new Date(f.createdAt)
      return d.getMonth() === month && d.getFullYear() === year
    })
  }

  const labels: string[] = []
  const efficiency: number[] = []
  const taskCounts: number[] = []
  const feedbackCounts: number[] = []

  if (filter === 'today') {
    for (let h = 0; h < 24; h += 4) {
      labels.push(`${h}:00`)
      const hourTasks = filteredTasks.filter(t => {
        const d = new Date(t.date)
        return d.getHours() >= h && d.getHours() < h + 4
      })
      taskCounts.push(hourTasks.length)
      efficiency.push(hourTasks.length > 0 ? Math.round(hourTasks.filter(t => t.completed).length / hourTasks.length * 100) : 0)
      feedbackCounts.push(filteredFeedbacks.length)
    }
  } else if (filter === 'week') {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    for (let i = 0; i < 7; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - d.getDay() + i)
      const dateStr = d.toISOString().split('T')[0]
      labels.push(days[d.getDay()])
      const dayTasks = filteredTasks.filter(t => t.date === dateStr)
      taskCounts.push(dayTasks.length)
      efficiency.push(dayTasks.length > 0 ? Math.round(dayTasks.filter(t => t.completed).length / dayTasks.length * 100) : 0)
      feedbackCounts.push(filteredFeedbacks.filter(f => {
        const fd = new Date(f.createdAt).toISOString().split('T')[0]
        return fd === dateStr
      }).length)
    }
  } else if (filter === 'month') {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const step = Math.max(1, Math.floor(daysInMonth / 6))
    for (let i = 1; i <= daysInMonth; i += step) {
      const end = Math.min(i + step - 1, daysInMonth)
      labels.push(`${i}日`)
      let monthTasks = 0
      let monthCompleted = 0
      let monthFeedback = 0
      for (let d = i; d <= end; d++) {
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const dayTasks = filteredTasks.filter(t => t.date === dateStr)
        monthTasks += dayTasks.length
        monthCompleted += dayTasks.filter(t => t.completed).length
        monthFeedback += filteredFeedbacks.filter(f => {
          const fd = new Date(f.createdAt).toISOString().split('T')[0]
          return fd === dateStr
        }).length
      }
      taskCounts.push(monthTasks)
      efficiency.push(monthTasks > 0 ? Math.round(monthCompleted / monthTasks * 100) : 0)
      feedbackCounts.push(monthFeedback)
    }
  } else {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    for (let m = 0; m < 12; m++) {
      labels.push(months[m])
      const monthTasks = filteredTasks.filter(t => {
        const d = new Date(t.date)
        return d.getMonth() === m
      })
      taskCounts.push(monthTasks.length)
      efficiency.push(monthTasks.length > 0 ? Math.round(monthTasks.filter(t => t.completed).length / monthTasks.length * 100) : 0)
      feedbackCounts.push(filteredFeedbacks.filter(f => {
        const d = new Date(f.createdAt)
        return d.getMonth() === m
      }).length)
    }
  }

  return { labels, efficiency, tasks: taskCounts, feedback: feedbackCounts }
}

export function useDashboardData(): DashboardData {
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today')
  const [refreshKey, setRefreshKey] = useState(0)
  const { teachingClassId, isTeachingClass, saveManualSelection } = useAutoClass(classes)

  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  useEffect(() => {
    setClasses(getClasses())
  }, [refreshKey])

  useEffect(() => {
    if (teachingClassId && !selectedClassId) {
      setSelectedClassId(teachingClassId)
    }
  }, [teachingClassId, selectedClassId])

  const setSelectedClass = useCallback((classId: string) => {
    setSelectedClassId(classId)
    saveManualSelection(classId)
  }, [saveManualSelection])

  const todayStr = new Date().toISOString().split('T')[0]
  const todayClasses = getTodayClasses()

  const allTasks = getCourseTasks()
  const filteredTasks = selectedClassId
    ? allTasks.filter(t => t.classId === selectedClassId)
    : allTasks

  const todayTasks = filteredTasks.filter(t => t.date === todayStr)
  const todayCompleted = todayTasks.filter(t => t.completed).length

  const allAssessments = getHomeworkAssessments()
  const filteredAssessments = selectedClassId
    ? getHomeworkAssessmentsByClass(selectedClassId)
    : allAssessments

  const allFeedbacks = getFeedbackHistory()

  const allStudents = selectedClassId ? getStudentsByClass(selectedClassId) : getStudents()

  const currentTeachingClass = getCurrentClassByTime()
  const currentSchedule = currentTeachingClass ? getCurrentTeachingSchedule(currentTeachingClass.id) : null

  const gradedHomework = filteredAssessments.length
  const totalHomework = filteredAssessments.length

  const resources = selectedClassId ? getResourcesByClass(selectedClassId) : []

  const todayDayOfWeek = new Date().getDay()
  const todayCourseCount = todayClasses.reduce((count, cls) => {
    const schedules = getClassSchedules(cls.id)
    return count + schedules.filter(s => s.dayOfWeek === todayDayOfWeek).length
  }, 0)

  const allTodayTasks = getCourseTasksByDate(todayStr)
  const classHasIncomplete = new Set<string>()
  allTodayTasks.forEach(t => {
    if (!t.completed) classHasIncomplete.add(t.classId)
  })
  const pendingClassCount = todayClasses.filter(cls => classHasIncomplete.has(cls.id)).length

  const pendingFollowUpCount = allFeedbacks.filter(f => isToday(new Date(f.createdAt))).length
  const pendingAssessmentCount = allAssessments.filter(a => isToday(new Date(a.assessedAt))).length

  const performanceData = getPerformanceData(filteredTasks, filteredAssessments, allFeedbacks, timeFilter)

  const upcomingTasks = filteredTasks
    .filter(t => !t.completed && t.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const recentTasksList = filteredTasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const allWorkflowTodos = getWorkflowTodos()
  const todayDateStr = todayStr

  const targetClassId = teachingClassId || selectedClassId
  const targetClass = targetClassId ? classes.find(c => c.id === targetClassId) || null : null

  const todayWorkflowTodos = targetClassId
    ? getWorkflowTodosByClass(targetClassId, todayDateStr)
    : []
  const todayCompletedTasks = todayWorkflowTodos.filter(t => t.completed).length

  const todayAssessments = targetClassId
    ? getHomeworkAssessmentsByClass(targetClassId).filter(a => isToday(new Date(a.assessedAt)))
    : []
  const todayGradedHomework = todayAssessments.length

  const targetStudentIds = targetClassId
    ? new Set(getStudentsByClass(targetClassId).map(s => s.id))
    : new Set<string>()
  const todayFeedbackRecords = allFeedbacks.filter(f =>
    targetStudentIds.has(f.studentId) && isToday(new Date(f.createdAt))
  )
  const todayProcessedFeedback = todayFeedbackRecords.length

  const weekWorkflowTodos = allWorkflowTodos.filter(t => isThisWeek(new Date(t.date)))
  const weekCompletedTasks = weekWorkflowTodos.filter(t => t.completed).length

  const weekAssessments = allAssessments.filter(a => isThisWeek(new Date(a.assessedAt)))
  const weekGradedHomework = weekAssessments.length

  const weekFeedbackRecords = allFeedbacks.filter(f => isThisWeek(new Date(f.createdAt)))
  const weekProcessedFeedback = weekFeedbackRecords.length

  const weekTotalTarget = weekWorkflowTodos.length + weekAssessments.length + weekFeedbackRecords.length
  const weekCompletedTotal = weekCompletedTasks + weekGradedHomework + weekProcessedFeedback
  const weekCompletionRate = weekTotalTarget > 0
    ? Math.round((weekCompletedTotal / weekTotalTarget) * 100)
    : 0

  return {
    classes,
    selectedClassId,
    teachingClassId,
    isTeachingClass,
    setSelectedClass,

    welcomeStats: {
      todayClassCount: todayClasses.length,
      totalTodos: todayTasks.length,
      completedTodos: todayCompleted,
      currentTeachingClass,
      remainingClassTime: currentSchedule ? getRemainingClassTime(currentSchedule) : '',
      todayCourseCount,
      pendingClassCount,
      pendingFollowUpCount,
      pendingAssessmentCount,
    },

    coreStats: {
      todayTasks: {
        total: todayTasks.length,
        completed: todayCompleted,
        rate: todayTasks.length > 0 ? Math.round((todayCompleted / todayTasks.length) * 100) : 0,
      },
      homework: {
        total: totalHomework,
        graded: gradedHomework,
        rate: totalHomework > 0 ? Math.round((gradedHomework / totalHomework) * 100) : 0,
      },
    },

    functionStats: {
      completedTasks: filteredTasks.filter(t => t.completed).length,
      inProgressTasks: filteredTasks.filter(t => !t.completed).length,
      totalStudents: allStudents.length,
      weeklyEfficiency: calculateWeeklyEfficiency(filteredTasks),
      gradedHomework,
      generatedFeedback: allFeedbacks.length,
      savedResources: resources.length,
      averageRating: calculateAverageRating(filteredAssessments),
    },

    performanceData,

    workStats: {
      today: {
        completedTasks: todayCompletedTasks,
        gradedHomework: todayGradedHomework,
        processedFeedback: todayProcessedFeedback,
        className: targetClass?.name || null,
      },
      week: {
        completedTasks: weekCompletedTasks,
        gradedHomework: weekGradedHomework,
        processedFeedback: weekProcessedFeedback,
        totalTarget: weekTotalTarget,
        completionRate: weekCompletionRate,
      },
    },

    recentTasks: recentTasksList,
    upcomingDeadlines: upcomingTasks,
    timeFilter,
    setTimeFilter,
    refreshData,
  }
}
