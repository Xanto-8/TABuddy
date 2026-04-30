import { httpClient } from './client'
import type { ScheduleDto } from './types'
import { getClasses, getClassSchedules } from '@/lib/store'

class ScheduleService {
  async getTodaySchedules(): Promise<ScheduleDto[]> {
    try {
      return await httpClient.get<ScheduleDto[]>('/schedules/today')
    } catch {
      const todayDayOfWeek = new Date().getDay()
      const classes = getClasses()
      const result: ScheduleDto[] = []

      for (const cls of classes) {
        const schedules = getClassSchedules(cls.id)
        for (const s of schedules) {
          if (s.dayOfWeek === todayDayOfWeek) {
            result.push({
              id: s.id,
              classId: cls.id,
              className: cls.name,
              dayOfWeek: s.dayOfWeek,
              startTime: s.startTime,
              endTime: s.endTime,
              room: '',
            })
          }
        }
      }

      return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
  }

  async getWeeklySchedules(): Promise<ScheduleDto[]> {
    try {
      return await httpClient.get<ScheduleDto[]>('/schedules/weekly')
    } catch {
      const classes = getClasses()
      const result: ScheduleDto[] = []

      for (const cls of classes) {
        const schedules = getClassSchedules(cls.id)
        for (const s of schedules) {
          result.push({
            id: s.id,
            classId: cls.id,
            className: cls.name,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            room: '',
          })
        }
      }

      return result.sort((a, b) => a.startTime.localeCompare(b.startTime))
    }
  }

  async getSchedulesByClass(classId: string): Promise<ScheduleDto[]> {
    try {
      return await httpClient.get<ScheduleDto[]>(`/schedules/class/${classId}`)
    } catch {
      const cls = getClasses().find(c => c.id === classId)
      if (!cls) return []

      const schedules = getClassSchedules(classId)
      return schedules.map(s => ({
        id: s.id,
        classId: cls.id,
        className: cls.name,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        room: '',
      }))
    }
  }
}

export const scheduleService = new ScheduleService()
