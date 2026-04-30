export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface DashboardOverviewDto {
  todayClassCount: number
  totalTodos: number
  completedTodos: number
  completionRate: number
  currentTeachingClass: string | null
  remainingClassTime: string
  todayCourseCount: number
  pendingFollowUpCount: number
  pendingAssessmentCount: number
}

export interface DashboardStatsDto {
  todayTasks: { total: number; completed: number; rate: number }
  homework: { total: number; graded: number; rate: number }
  weeklyEfficiency: number
  totalStudents: number
  averageRating: number
}

export interface WorkStatsDto {
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

export interface PerformanceDataDto {
  labels: string[]
  efficiency: number[]
  tasks: number[]
  feedback: number[]
}

export interface UserProfileDto {
  id: string
  username: string
  displayName: string
  avatar: string
  role: string
  email: string
  createdAt: string
}

export interface ScheduleDto {
  id: string
  classId: string
  className: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
}

export interface TaskReminderDto {
  id: string
  title: string
  description: string
  classId: string
  className: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'completed'
  type: string
}
