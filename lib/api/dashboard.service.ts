import { httpClient } from './client'
import type {
  DashboardOverviewDto,
  DashboardStatsDto,
  WorkStatsDto,
  PerformanceDataDto,
} from './types'
import type { TimeFilter } from '@/components/dashboard/use-dashboard-data'
import {
  getClasses,
  getTodayClasses,
  getCurrentClassByTime,
  getCourseTasks,
  getCourseTasksByDate,
  getClassSchedules,
  getHomeworkAssessments,
  getHomeworkAssessmentsByClass,
  getFeedbackHistory,
  getStudents,
  getStudentsByClass,
  getResourcesByClass,
} from '@/lib/store'
import { isToday, isThisWeek } from '@/lib/utils'

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

class DashboardService {
  async getOverview(): Promise<DashboardOverviewDto> {
    try {
      return await httpClient.get<DashboardOverviewDto>('/dashboard/overview')
    } catch {
      const todayClasses = getTodayClasses()
      const todayStr = new Date().toISOString().split('T')[0]
      const allTodayTasks = getCourseTasksByDate(todayStr)
      const todayCompleted = allTodayTasks.filter(t => t.completed).length
      const currentTeachingClass = getCurrentClassByTime()
      const currentSchedule = currentTeachingClass
        ? getCurrentTeachingSchedule(currentTeachingClass.id)
        : null
      const allFeedbacks = getFeedbackHistory()
      const allAssessments = getHomeworkAssessments()

      const todayDayOfWeek = new Date().getDay()
      const todayCourseCount = todayClasses.reduce((count, cls) => {
        const schedules = getClassSchedules(cls.id)
        return count + schedules.filter(s => s.dayOfWeek === todayDayOfWeek).length
      }, 0)

      return {
        todayClassCount: todayClasses.length,
        totalTodos: allTodayTasks.length,
        completedTodos: todayCompleted,
        completionRate:
          allTodayTasks.length > 0
            ? Math.round((todayCompleted / allTodayTasks.length) * 100)
            : 0,
        currentTeachingClass: currentTeachingClass?.name || null,
        remainingClassTime: currentSchedule ? getRemainingClassTime(currentSchedule) : '',
        todayCourseCount,
        pendingFollowUpCount: allFeedbacks.filter(f => isToday(new Date(f.createdAt))).length,
        pendingAssessmentCount: allAssessments.filter(a => isToday(new Date(a.assessedAt))).length,
      }
    }
  }

  async getStats(classId?: string): Promise<DashboardStatsDto> {
    try {
      const params = classId ? `?classId=${classId}` : ''
      return await httpClient.get<DashboardStatsDto>(`/dashboard/stats${params}`)
    } catch {
      const allTasks = getCourseTasks()
      const filteredTasks = classId
        ? allTasks.filter(t => t.classId === classId)
        : allTasks
      const allAssessments = classId
        ? getHomeworkAssessmentsByClass(classId)
        : getHomeworkAssessments()
      const allStudents = classId ? getStudentsByClass(classId) : getStudents()

      const todayStr = new Date().toISOString().split('T')[0]
      const todayTasks = filteredTasks.filter(t => t.date === todayStr)
      const todayCompleted = todayTasks.filter(t => t.completed).length

      const weekTasks = filteredTasks.filter(t => isThisWeek(new Date(t.date)))
      const weeklyEfficiency =
        weekTasks.length > 0
          ? Math.round((weekTasks.filter(t => t.completed).length / weekTasks.length) * 100)
          : 0

      const sum = allAssessments.reduce((acc, a) => acc + a.accuracy, 0)
      const averageRating =
        allAssessments.length > 0 ? Math.round((sum / allAssessments.length) * 10) / 10 : 0

      return {
        todayTasks: {
          total: todayTasks.length,
          completed: todayCompleted,
          rate:
            todayTasks.length > 0
              ? Math.round((todayCompleted / todayTasks.length) * 100)
              : 0,
        },
        homework: {
          total: allAssessments.length,
          graded: allAssessments.length,
          rate: allAssessments.length > 0 ? 100 : 0,
        },
        weeklyEfficiency,
        totalStudents: allStudents.length,
        averageRating,
      }
    }
  }

  async getPerformance(
    timeFilter: TimeFilter,
    classId?: string
  ): Promise<PerformanceDataDto> {
    try {
      const params = new URLSearchParams({ timeFilter })
      if (classId) params.set('classId', classId)
      return await httpClient.get<PerformanceDataDto>(
        `/dashboard/performance?${params}`
      )
    } catch {
      const allTasks = getCourseTasks()
      const filteredTasks = classId
        ? allTasks.filter(t => t.classId === classId)
        : allTasks
      const allAssessments = getHomeworkAssessments()
      const filteredAssessments = classId
        ? getHomeworkAssessmentsByClass(classId)
        : allAssessments
      const allFeedbacks = getFeedbackHistory()

      const labels: string[] = []
      const efficiency: number[] = []
      const taskCounts: number[] = []
      const feedbackCounts: number[] = []

      const now = new Date()

      if (timeFilter === 'today') {
        for (let h = 0; h < 24; h += 4) {
          labels.push(`${h}:00`)
          const hourTasks = filteredTasks.filter(t => {
            const d = new Date(t.date)
            return d.getHours() >= h && d.getHours() < h + 4
          })
          taskCounts.push(hourTasks.length)
          efficiency.push(
            hourTasks.length > 0
              ? Math.round(hourTasks.filter(t => t.completed).length / hourTasks.length * 100)
              : 0
          )
          feedbackCounts.push(allFeedbacks.length)
        }
      } else if (timeFilter === 'week') {
        const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        for (let i = 0; i < 7; i++) {
          const d = new Date(now)
          d.setDate(d.getDate() - d.getDay() + i)
          const dateStr = d.toISOString().split('T')[0]
          labels.push(days[d.getDay()])
          const dayTasks = filteredTasks.filter(t => t.date === dateStr)
          taskCounts.push(dayTasks.length)
          efficiency.push(
            dayTasks.length > 0
              ? Math.round(dayTasks.filter(t => t.completed).length / dayTasks.length * 100)
              : 0
          )
          feedbackCounts.push(
            allFeedbacks.filter(f => {
              const fd = new Date(f.createdAt).toISOString().split('T')[0]
              return fd === dateStr
            }).length
          )
        }
      }

      return { labels, efficiency, tasks: taskCounts, feedback: feedbackCounts }
    }
  }

  async getWorkStats(classId?: string): Promise<WorkStatsDto> {
    try {
      const params = classId ? `?classId=${classId}` : ''
      return await httpClient.get<WorkStatsDto>(`/dashboard/work-stats${params}`)
    } catch {
      const targetClassId = classId
      const todayStr = new Date().toISOString().split('T')[0]

      const allWorkflowTodos = (await import('@/lib/workflow-store')).getWorkflowTodos()
      const todayWorkflowTodos = targetClassId
        ? (await import('@/lib/workflow-store')).getWorkflowTodosByClass(targetClassId, todayStr)
        : []
      const todayCompletedTasks = todayWorkflowTodos.filter(t => t.completed).length

      const todayAssessments = targetClassId
        ? getHomeworkAssessmentsByClass(targetClassId).filter(a => isToday(new Date(a.assessedAt)))
        : []
      const todayGradedHomework = todayAssessments.length

      const allFeedbacks = getFeedbackHistory()
      const targetStudentIds = targetClassId
        ? new Set(getStudentsByClass(targetClassId).map(s => s.id))
        : new Set<string>()
      const todayFeedbackRecords = allFeedbacks.filter(
        f => targetStudentIds.has(f.studentId) && isToday(new Date(f.createdAt))
      )

      const weekWorkflowTodos = allWorkflowTodos.filter(t => isThisWeek(new Date(t.date)))
      const weekCompletedTasks = weekWorkflowTodos.filter(t => t.completed).length
      const weekAssessments = (targetClassId
        ? getHomeworkAssessmentsByClass(targetClassId)
        : getHomeworkAssessments()
      ).filter(a => isThisWeek(new Date(a.assessedAt)))
      const weekGradedHomework = weekAssessments.length
      const weekFeedbackRecords = allFeedbacks.filter(f => isThisWeek(new Date(f.createdAt)))
      const weekProcessedFeedback = weekFeedbackRecords.length
      const weekTotalTarget =
        weekWorkflowTodos.length + weekAssessments.length + weekFeedbackRecords.length
      const weekCompletedTotal = weekCompletedTasks + weekGradedHomework + weekProcessedFeedback

      const targetClass = targetClassId
        ? (await import('@/lib/store')).getClasses().find(c => c.id === targetClassId) || null
        : null

      return {
        today: {
          completedTasks: todayCompletedTasks,
          gradedHomework: todayGradedHomework,
          processedFeedback: todayFeedbackRecords.length,
          className: targetClass?.name || null,
        },
        week: {
          completedTasks: weekCompletedTasks,
          gradedHomework: weekGradedHomework,
          processedFeedback: weekProcessedFeedback,
          totalTarget: weekTotalTarget,
          completionRate:
            weekTotalTarget > 0
              ? Math.round((weekCompletedTotal / weekTotalTarget) * 100)
              : 0,
        },
      }
    }
  }
}

export const dashboardService = new DashboardService()
