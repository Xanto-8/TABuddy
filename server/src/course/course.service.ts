import { Injectable, Logger } from '@nestjs/common'

export interface Course {
  id: string
  name: string
  startTime: string
  endTime: string
}

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name)

  async getTodayCourses(): Promise<Course[]> {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const dateStr = today.toISOString().slice(0, 10)

    const schedule = this.getSchedule()
    const todaySchedule = schedule.filter(s => s.days.includes(dayOfWeek))

    return todaySchedule.map(s => ({
      id: s.id,
      name: s.name,
      startTime: `${dateStr}T${s.startTime}:00.000Z`,
      endTime: `${dateStr}T${s.endTime}:00.000Z`,
    }))
  }

  private getSchedule(): { id: string; name: string; startTime: string; endTime: string; days: number[] }[] {
    return [
      { id: 'c001', name: '少儿英语启蒙班', startTime: '08:00', endTime: '09:30', days: [1, 3, 5] },
      { id: 'c002', name: '自然拼读进阶班', startTime: '10:00', endTime: '11:30', days: [2, 4, 6] },
      { id: 'c003', name: '绘本阅读拓展班', startTime: '14:00', endTime: '15:30', days: [1, 3] },
      { id: 'c004', name: '口语表达训练班', startTime: '16:00', endTime: '17:30', days: [2, 5] },
    ]
  }
}
