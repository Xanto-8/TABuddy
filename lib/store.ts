'use client'

import { Class, Student, ClassType, ClassSchedule, CourseTask, CourseTaskTemplate, HomeworkAssessment, QuizRecord, ClassOverallAccuracy, FeedbackRecord, NotificationItem, PushLogEntry, ReminderSentRecord, ReminderType, PushStatus } from '@/types'

export type RecordType = 'homework' | 'quiz' | 'feedback' | 'attendance' | 'other'

export interface ClassRecord {
  id: string
  classId: string
  studentId: string
  type: RecordType
  content: string
  score?: number
  totalScore?: number
  createdAt: Date
  createdBy: string
}

export type ResourceType = 'document' | 'link' | 'file' | 'image' | 'other'

export interface ClassResource {
  id: string
  classId: string
  title: string
  type: ResourceType
  url: string
  description?: string
  fileName?: string
  fileSize?: number
  originalName?: string
  createdAt: Date
  createdBy: string
}

const CLASSES_KEY = 'tabuddy_classes'
const STUDENTS_KEY = 'tabuddy_students'
const RECORDS_KEY = 'tabuddy_class_records'
const RESOURCES_KEY = 'tabuddy_class_resources'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    return JSON.parse(stored, (_, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }
      return value
    })
  } catch {
    return defaultValue
  }
}

function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save to localStorage:', e)
  }
}

export function getClasses(): Class[] {
  return getFromStorage<Class[]>(CLASSES_KEY, [])
}

export function saveClass(data: Omit<Class, 'id' | 'studentCount' | 'createdAt' | 'updatedAt'>): Class {
  const classes = getClasses()
  const newClass: Class = {
    ...data,
    id: generateId(),
    studentCount: 0,
    schedules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  classes.push(newClass)
  saveToStorage(CLASSES_KEY, classes)
  return newClass
}

export function updateClass(id: string, data: Partial<Omit<Class, 'id' | 'createdAt'>>): Class | null {
  const classes = getClasses()
  const index = classes.findIndex((c) => c.id === id)
  if (index === -1) return null
  classes[index] = { ...classes[index], ...data, updatedAt: new Date() }
  saveToStorage(CLASSES_KEY, classes)
  return classes[index]
}

export function deleteClass(id: string): boolean {
  const classes = getClasses()
  const filtered = classes.filter((c) => c.id !== id)
  if (filtered.length === classes.length) return false
  saveToStorage(CLASSES_KEY, filtered)

  const students = getStudents()
  const updatedStudents = students.map((s) =>
    s.classId === id ? { ...s, classId: undefined } : s
  )
  saveToStorage(STUDENTS_KEY, updatedStudents)
  return true
}

export function getStudents(): Student[] {
  return getFromStorage<Student[]>(STUDENTS_KEY, [])
}

export function getStudentsByClass(classId: string): Student[] {
  return getStudents().filter((s) => s.classId === classId)
}

export function saveStudent(data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Student {
  const students = getStudents()
  const newStudent: Student = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  students.push(newStudent)
  saveToStorage(STUDENTS_KEY, students)

  if (data.classId) {
    const classes = getClasses()
    const classIndex = classes.findIndex((c) => c.id === data.classId)
    if (classIndex !== -1) {
      classes[classIndex].studentCount = getStudentsByClass(data.classId).length
      classes[classIndex].updatedAt = new Date()
      saveToStorage(CLASSES_KEY, classes)
    }
  }

  return newStudent
}

export function updateStudent(id: string, data: Partial<Omit<Student, 'id' | 'createdAt'>>): Student | null {
  const students = getStudents()
  const index = students.findIndex((s) => s.id === id)
  if (index === -1) return null

  const oldClassId = students[index].classId
  students[index] = { ...students[index], ...data, updatedAt: new Date() }
  saveToStorage(STUDENTS_KEY, students)

  const affectedClassIds = new Set([oldClassId, data.classId].filter(Boolean))
  const classes = getClasses()
  affectedClassIds.forEach((classId) => {
    if (!classId) return
    const classIndex = classes.findIndex((c) => c.id === classId)
    if (classIndex !== -1) {
      classes[classIndex].studentCount = getStudentsByClass(classId).length
      classes[classIndex].updatedAt = new Date()
    }
  })
  saveToStorage(CLASSES_KEY, classes)

  return students[index]
}

export function addStudentToClass(studentId: string, classId: string, className: string): Student | null {
  return updateStudent(studentId, { classId, class: className })
}

export function deleteStudent(id: string): boolean {
  const students = getStudents()
  const student = students.find((s) => s.id === id)
  const filtered = students.filter((s) => s.id !== id)
  if (filtered.length === students.length) return false
  saveToStorage(STUDENTS_KEY, filtered)

  if (student?.classId) {
    const classes = getClasses()
    const classIndex = classes.findIndex((c) => c.id === student.classId)
    if (classIndex !== -1) {
      classes[classIndex].studentCount = getStudentsByClass(student.classId).length
      classes[classIndex].updatedAt = new Date()
      saveToStorage(CLASSES_KEY, classes)
    }
  }

  return true
}

export function getClassTypeLabel(type: ClassType): string {
  const labels: Record<string, string> = {
    GY: 'GY',
    KET: 'KET',
    PET: 'PET',
    FCE: 'FCE',
    CAE: 'CAE',
    CPE: 'CPE',
    OTHER: '其他',
  }
  return labels[type] ?? type
}

export function getClassTypeColor(type: ClassType): string {
  const colors: Record<string, string> = {
    GY: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    KET: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    PET: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    FCE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    CAE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CPE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  }
  return colors[type] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
}

export const STANDARD_CLASS_TYPES: ClassType[] = ['GY', 'KET', 'PET', 'FCE', 'CAE', 'CPE', 'OTHER']

const CUSTOM_CLASS_TYPES_KEY = 'tabuddy_custom_class_types'

export function getCustomClassTypes(): ClassType[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_CLASS_TYPES_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addCustomClassType(type: string): void {
  if (typeof window === 'undefined') return
  const normalized = type.trim().toUpperCase()
  if (!normalized) return
  if (STANDARD_CLASS_TYPES.includes(normalized as ClassType)) return
  const list = getCustomClassTypes()
  if (list.includes(normalized)) return
  list.push(normalized)
  try {
    localStorage.setItem(CUSTOM_CLASS_TYPES_KEY, JSON.stringify(list))
  } catch {}
}

export function getAllClassTypeOptions(): { value: ClassType; label: string }[] {
  const standard = STANDARD_CLASS_TYPES.map(t => ({ value: t, label: getClassTypeLabel(t) }))
  const custom = getCustomClassTypes().map(t => ({ value: t, label: t }))
  return [...standard, ...custom]
}

export function getRecordsByClass(classId: string): ClassRecord[] {
  const records = getFromStorage<ClassRecord[]>(RECORDS_KEY, [])
  return records.filter((r) => r.classId === classId)
}

export function saveRecord(data: Omit<ClassRecord, 'id' | 'createdAt'>): ClassRecord {
  const records = getFromStorage<ClassRecord[]>(RECORDS_KEY, [])
  const newRecord: ClassRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  records.push(newRecord)
  saveToStorage(RECORDS_KEY, records)
  return newRecord
}

export function deleteRecord(id: string): boolean {
  const records = getFromStorage<ClassRecord[]>(RECORDS_KEY, [])
  const filtered = records.filter((r) => r.id !== id)
  if (filtered.length === records.length) return false
  saveToStorage(RECORDS_KEY, filtered)
  return true
}

export function getRecordTypeLabel(type: RecordType): string {
  const labels: Record<RecordType, string> = {
    homework: '作业',
    quiz: '小测',
    feedback: '反馈',
    attendance: '考勤',
    other: '其他',
  }
  return labels[type]
}

export function getRecordTypeIcon(type: RecordType): string {
  const icons: Record<RecordType, string> = {
    homework: '📝',
    quiz: '📊',
    feedback: '💬',
    attendance: '✅',
    other: '📌',
  }
  return icons[type]
}

export function getResourcesByClass(classId: string): ClassResource[] {
  const resources = getFromStorage<ClassResource[]>(RESOURCES_KEY, [])
  return resources.filter((r) => r.classId === classId)
}

export function saveResource(data: Omit<ClassResource, 'id' | 'createdAt'>): ClassResource {
  const resources = getFromStorage<ClassResource[]>(RESOURCES_KEY, [])
  const newResource: ClassResource = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  resources.push(newResource)
  saveToStorage(RESOURCES_KEY, resources)
  return newResource
}

export function deleteResource(id: string): boolean {
  const resources = getFromStorage<ClassResource[]>(RESOURCES_KEY, [])
  const filtered = resources.filter((r) => r.id !== id)
  if (filtered.length === resources.length) return false
  saveToStorage(RESOURCES_KEY, filtered)
  return true
}

export function updateResource(id: string, data: Partial<Omit<ClassResource, 'id' | 'createdAt' | 'createdBy'>>): ClassResource | null {
  const resources = getFromStorage<ClassResource[]>(RESOURCES_KEY, [])
  const index = resources.findIndex((r) => r.id === id)
  if (index === -1) return null
  
  const updatedResource = {
    ...resources[index],
    ...data,
  }
  
  resources[index] = updatedResource
  saveToStorage(RESOURCES_KEY, resources)
  return updatedResource
}

export function getResourceTypeLabel(type: ResourceType): string {
  const labels: Record<ResourceType, string> = {
    document: '文档',
    link: '链接',
    file: '文件',
    image: '图片',
    other: '其他',
  }
  return labels[type]
}

export function getResourceTypeIcon(type: ResourceType): string {
  const icons: Record<ResourceType, string> = {
    document: '📄',
    link: '🔗',
    file: '📎',
    image: '🖼️',
    other: '📌',
  }
  return icons[type]
}

// 班级上课时间相关函数
const CLASS_SCHEDULES_KEY = 'tabuddy_class_schedules'

export function getClassSchedules(classId: string): ClassSchedule[] {
  const schedules = getFromStorage<ClassSchedule[]>(CLASS_SCHEDULES_KEY, [])
  return schedules.filter((s) => s.classId === classId)
}

export function saveClassSchedule(data: Omit<ClassSchedule, 'id' | 'createdAt' | 'updatedAt'>): ClassSchedule {
  const schedules = getFromStorage<ClassSchedule[]>(CLASS_SCHEDULES_KEY, [])
  const newSchedule: ClassSchedule = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  schedules.push(newSchedule)
  saveToStorage(CLASS_SCHEDULES_KEY, schedules)
  
  // 更新班级的schedules字段
  const classes = getClasses()
  const classIndex = classes.findIndex((c) => c.id === data.classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(data.classId)
    classes[classIndex] = { 
      ...classes[classIndex], 
      schedules: classSchedules,
      updatedAt: new Date()
    }
    saveToStorage(CLASSES_KEY, classes)
  }
  
  return newSchedule
}

export function updateClassSchedule(id: string, data: Partial<Omit<ClassSchedule, 'id' | 'createdAt'>>): ClassSchedule | null {
  const schedules = getFromStorage<ClassSchedule[]>(CLASS_SCHEDULES_KEY, [])
  const index = schedules.findIndex((s) => s.id === id)
  if (index === -1) return null
  
  const updatedSchedule = { ...schedules[index], ...data, updatedAt: new Date() }
  schedules[index] = updatedSchedule
  saveToStorage(CLASS_SCHEDULES_KEY, schedules)
  
  // 更新班级的schedules字段
  const classId = schedules[index].classId
  const classes = getClasses()
  const classIndex = classes.findIndex((c) => c.id === classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(classId)
    classes[classIndex] = { 
      ...classes[classIndex], 
      schedules: classSchedules,
      updatedAt: new Date()
    }
    saveToStorage(CLASSES_KEY, classes)
  }
  
  return updatedSchedule
}

export function deleteClassSchedule(id: string): boolean {
  const schedules = getFromStorage<ClassSchedule[]>(CLASS_SCHEDULES_KEY, [])
  const scheduleIndex = schedules.findIndex((s) => s.id === id)
  if (scheduleIndex === -1) return false
  
  const classId = schedules[scheduleIndex].classId
  const filtered = schedules.filter((s) => s.id !== id)
  saveToStorage(CLASS_SCHEDULES_KEY, filtered)
  
  // 更新班级的schedules字段
  const classes = getClasses()
  const classIndex = classes.findIndex((c) => c.id === classId)
  if (classIndex !== -1) {
    const classSchedules = getClassSchedules(classId)
    classes[classIndex] = { 
      ...classes[classIndex], 
      schedules: classSchedules,
      updatedAt: new Date()
    }
    saveToStorage(CLASSES_KEY, classes)
  }
  
  return true
}

// 根据当前时间获取当前上课的班级
// 第一轮：精确匹配当前正在上课的班级
// 第二轮：按课前10分钟规则匹配即将上课的班级
export function getCurrentClassByTime(): Class | null {
  const now = new Date()
  const currentDay = now.getDay() // 0-6, 0=Sunday
  const currentTime = now.getHours() * 60 + now.getMinutes() // 转换为分钟数
  
  const classes = getClasses()
  
  // 第一轮：检查是否有班级正在上课
  for (const classItem of classes) {
    const schedules = getClassSchedules(classItem.id)
    
    for (const schedule of schedules) {
      if (schedule.dayOfWeek === currentDay) {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
        
        const startTimeInMinutes = startHour * 60 + startMinute
        const endTimeInMinutes = endHour * 60 + endMinute
        
        if (currentTime >= startTimeInMinutes && currentTime <= endTimeInMinutes) {
          return classItem
        }
      }
    }
  }
  
  // 第二轮：没有正在上课的班级，检查即将在10分钟内上课的班级（课前准备切换）
  for (const classItem of classes) {
    const schedules = getClassSchedules(classItem.id)
    
    for (const schedule of schedules) {
      if (schedule.dayOfWeek === currentDay) {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
        
        const startTimeInMinutes = startHour * 60 + startMinute
        
        if (currentTime >= startTimeInMinutes - 10 && currentTime < startTimeInMinutes) {
          return classItem
        }
      }
    }
  }
  
  return null
}

// 获取今天有课的班级
export function getTodayClasses(): Class[] {
  const today = new Date().getDay()
  const classes = getClasses()
  
  return classes.filter((classItem) => {
    const schedules = getClassSchedules(classItem.id)
    return schedules.some((schedule) => schedule.dayOfWeek === today)
  })
}

// ========== 调课/补课标记 ==========

const MARKED_DAYS_KEY = 'tabuddy_marked_days'

export function getMarkedDays(): Record<string, Record<string, true>> {
  return getFromStorage<Record<string, Record<string, true>>>(MARKED_DAYS_KEY, {})
}

export function setMarkedDay(classId: string, date: string, isMarked: boolean): void {
  const marked = getMarkedDays()
  if (!marked[classId]) marked[classId] = {}
  if (isMarked) {
    marked[classId][date] = true
  } else {
    delete marked[classId][date]
    if (Object.keys(marked[classId]).length === 0) {
      delete marked[classId]
    }
  }
  saveToStorage(MARKED_DAYS_KEY, marked)
}

export function isMarkedDay(classId: string, date: string): boolean {
  const marked = getMarkedDays()
  return !!marked[classId]?.[date]
}

// 判断某日期是否为班级的上课日（根据上课周几设置）
export function isScheduleDayForClass(classId: string, date: string): boolean {
  const dateObj = new Date(date + 'T00:00:00')
  const dayOfWeek = dateObj.getDay()
  // 先检查独立存储的 schedules
  const schedules = getClassSchedules(classId)
  if (schedules.some((s) => s.dayOfWeek === dayOfWeek)) return true
  // 备选：检查 Class 对象内联的 schedules 字段
  const classes = getClasses()
  const cls = classes.find((c) => c.id === classId)
  if (cls?.schedules && cls.schedules.length > 0) {
    return cls.schedules.some((s) => s.dayOfWeek === dayOfWeek)
  }
  return false
}

// ========== 班级课时任务 (CourseTask) ==========

const COURSE_TASKS_KEY = 'tabuddy_course_tasks'

export function getCourseTasks(): CourseTask[] {
  return getFromStorage<CourseTask[]>(COURSE_TASKS_KEY, [])
}

export function getCourseTasksByClass(classId: string): CourseTask[] {
  const tasks = getCourseTasks()
  return tasks.filter((t) => t.classId === classId)
}

export function getCourseTasksByDate(date: string): CourseTask[] {
  const tasks = getCourseTasks()
  return tasks.filter((t) => t.date === date)
}

export function saveCourseTask(data: Omit<CourseTask, 'id' | 'createdAt' | 'updatedAt'>): CourseTask {
  const tasks = getCourseTasks()
  const newTask: CourseTask = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  tasks.push(newTask)
  saveToStorage(COURSE_TASKS_KEY, tasks)
  return newTask
}

export function updateCourseTask(id: string, data: Partial<Omit<CourseTask, 'id' | 'createdAt'>>): CourseTask | null {
  const tasks = getCourseTasks()
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return null
  tasks[index] = { ...tasks[index], ...data, updatedAt: new Date() }
  saveToStorage(COURSE_TASKS_KEY, tasks)
  return tasks[index]
}

export function deleteCourseTask(id: string): boolean {
  const tasks = getCourseTasks()
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  saveToStorage(COURSE_TASKS_KEY, filtered)
  return true
}

// 获取指定日期的任务统计（按班级+日期过滤，汇总当天所有课程的全部任务）
export function getTodayTaskStats(
  classId?: string,
  date?: string
): { total: number; completed: number; incomplete: number } {
  const dateStr = date || new Date().toISOString().split('T')[0]
  let todayTasks = getCourseTasksByDate(dateStr)
  if (classId) {
    todayTasks = todayTasks.filter((t) => t.classId === classId)
  }
  const completed = todayTasks.filter((t) => t.completed).length
  return {
    total: todayTasks.length,
    completed,
    incomplete: todayTasks.length - completed,
  }
}

// ========== 班级课时任务模板 (CourseTaskTemplate) ==========

const COURSE_TASK_TEMPLATES_KEY = 'tabuddy_course_task_templates'

export function getCourseTaskTemplates(): CourseTaskTemplate[] {
  return getFromStorage<CourseTaskTemplate[]>(COURSE_TASK_TEMPLATES_KEY, [])
}

export function getCourseTaskTemplatesByClass(classId: string): CourseTaskTemplate[] {
  const templates = getCourseTaskTemplates()
  return templates
    .filter((t) => t.classId === classId)
    .sort((a, b) => a.order - b.order)
}

export function saveCourseTaskTemplate(
  data: Omit<CourseTaskTemplate, 'id' | 'createdAt' | 'updatedAt'>
): CourseTaskTemplate {
  const templates = getCourseTaskTemplates()
  const newTemplate: CourseTaskTemplate = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  templates.push(newTemplate)
  saveToStorage(COURSE_TASK_TEMPLATES_KEY, templates)
  return newTemplate
}

export function updateCourseTaskTemplate(
  id: string,
  data: Partial<Omit<CourseTaskTemplate, 'id' | 'createdAt'>>
): CourseTaskTemplate | null {
  const templates = getCourseTaskTemplates()
  const index = templates.findIndex((t) => t.id === id)
  if (index === -1) return null
  templates[index] = { ...templates[index], ...data, updatedAt: new Date() }
  saveToStorage(COURSE_TASK_TEMPLATES_KEY, templates)
  return templates[index]
}

export function deleteCourseTaskTemplate(id: string): boolean {
  const templates = getCourseTaskTemplates()
  const filtered = templates.filter((t) => t.id !== id)
  if (filtered.length === templates.length) return false
  saveToStorage(COURSE_TASK_TEMPLATES_KEY, filtered)
  return true
}

// ========== 课时自动递增逻辑 ==========

const CLASS_LESSON_PROGRESS_KEY = 'tabuddy_class_lesson_progress'

// 从已有任务数据初始化课时进度（数据迁移）
export function initializeLessonProgress(): void {
  const progress: Record<string, Record<string, number>> =
    getFromStorage(CLASS_LESSON_PROGRESS_KEY, {})
  const tasks = getCourseTasks()

  tasks.forEach((t) => {
    if (!t.lesson) return
    if (!progress[t.classId]) progress[t.classId] = {}
    if (!(t.date in progress[t.classId])) {
      const match = t.lesson.match(/(\d+)/)
      if (match) {
        progress[t.classId][t.date] = parseInt(match[1], 10)
      }
    }
  })

  saveToStorage(CLASS_LESSON_PROGRESS_KEY, progress)
}

// 获取某班级在某日期对应的课时
// - 如果该日期已有课时记录，直接返回
// - 否则自动计算下一个课时（基于该班级已有上课日期数 +1）
export function getLessonForClassDate(
  classId: string,
  date: string
): { number: number; label: string } {
  const progress: Record<string, Record<string, number>> =
    getFromStorage(CLASS_LESSON_PROGRESS_KEY, {})

  if (!progress[classId]) progress[classId] = {}

  if (!(date in progress[classId])) {
    const existingNumbers = Object.values(progress[classId])
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0
    progress[classId][date] = maxNumber + 1
    saveToStorage(CLASS_LESSON_PROGRESS_KEY, progress)
  }

  const lessonNumber = progress[classId][date]
  return {
    number: lessonNumber,
    label: `第${lessonNumber}课`,
  }
}

// 手动修改某班级在某日期的课时数字
// 修改后该日期的课时固定为用户输入的值
// 下一个新日期依然按 max(已有数字) +1 继续递增
export function updateLessonProgress(
  classId: string,
  date: string,
  lessonNumber: number
): { number: number; label: string } {
  const progress: Record<string, Record<string, number>> =
    getFromStorage(CLASS_LESSON_PROGRESS_KEY, {})

  if (!progress[classId]) progress[classId] = {}

  progress[classId][date] = lessonNumber
  saveToStorage(CLASS_LESSON_PROGRESS_KEY, progress)

  return {
    number: lessonNumber,
    label: `第${lessonNumber}课`,
  }
}

// ========== 任务实例生成与同步 ==========

export function getCourseTasksByClassAndDate(classId: string, date: string): CourseTask[] {
  const tasks = getCourseTasks()
  return tasks.filter((t) => t.classId === classId && t.date === date)
}

export function generateDailyInstances(classId: string, date: string): CourseTask[] {
  const templates = getCourseTaskTemplatesByClass(classId)
  if (templates.length === 0) {
    return getCourseTasksByClassAndDate(classId, date)
  }

  const existingTasks = getCourseTasksByClassAndDate(classId, date)
  const existingTemplateIds = new Set(
    existingTasks.filter((t) => t.templateId).map((t) => t.templateId)
  )

  const needsNew = templates.some((t) => !existingTemplateIds.has(t.id))
  if (!needsNew) {
    return getCourseTasksByClassAndDate(classId, date)
  }

  // 自动计算该日期对应的课时
  const lessonInfo = getLessonForClassDate(classId, date)

  const allTasks = getCourseTasks()
  let hasNew = false

  templates.forEach((template) => {
    if (!existingTemplateIds.has(template.id)) {
      allTasks.push({
        id: generateId(),
        classId,
        templateId: template.id,
        lesson: lessonInfo.label,
        title: template.title,
        content: template.content,
        date,
        completed: false,
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      hasNew = true
    }
  })

  if (hasNew) {
    saveToStorage(COURSE_TASKS_KEY, allTasks)
  }

  return getCourseTasksByClassAndDate(classId, date)
}

export function ensureTodayInstancesForAllClasses(): void {
  initializeLessonProgress()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const dayOfWeek = today.getDay()

  const classes = getClasses()
  classes.forEach((cls) => {
    const schedules = getClassSchedules(cls.id)
    if (schedules.some((s) => s.dayOfWeek === dayOfWeek)) {
      generateDailyInstances(cls.id, todayStr)
    }
  })
}

export function syncTemplateToFutureInstances(templateId: string): void {
  const tasks = getCourseTasks()
  const templates = getCourseTaskTemplates()
  const template = templates.find((t) => t.id === templateId)
  if (!template) return

  const todayStr = new Date().toISOString().split('T')[0]
  let hasUpdates = false

  const updatedTasks = tasks.map((t) => {
    if (t.templateId === templateId && t.date >= todayStr) {
      hasUpdates = true
      return {
        ...t,
        title: template.title,
        content: template.content,
        updatedAt: new Date(),
      }
    }
    return t
  })

  if (hasUpdates) {
    saveToStorage(COURSE_TASKS_KEY, updatedTasks)
  }
}

// ========== 作业评估 (HomeworkAssessment) ==========

const HOMEWORK_ASSESSMENTS_KEY = 'tabuddy_homework_assessments'

export function getHomeworkAssessments(): HomeworkAssessment[] {
  return getFromStorage<HomeworkAssessment[]>(HOMEWORK_ASSESSMENTS_KEY, [])
}

export function getHomeworkAssessmentsByStudent(studentId: string): HomeworkAssessment[] {
  return getHomeworkAssessments().filter((a) => a.studentId === studentId)
}

export function getHomeworkAssessmentsByClass(classId: string): HomeworkAssessment[] {
  const students = getStudentsByClass(classId)
  const studentIds = new Set(students.map((s) => s.id))
  return getHomeworkAssessments().filter((a) => studentIds.has(a.studentId))
}

export function saveHomeworkAssessment(
  data: Omit<HomeworkAssessment, 'id' | 'assessedAt'>
): HomeworkAssessment {
  const assessments = getHomeworkAssessments()
  const newAssessment: HomeworkAssessment = {
    ...data,
    id: generateId(),
    assessedAt: new Date(),
  }
  assessments.push(newAssessment)
  saveToStorage(HOMEWORK_ASSESSMENTS_KEY, assessments)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return newAssessment
}

export function updateHomeworkAssessment(
  id: string,
  data: Partial<Omit<HomeworkAssessment, 'id'>>
): HomeworkAssessment | null {
  const assessments = getHomeworkAssessments()
  const index = assessments.findIndex((a) => a.id === id)
  if (index === -1) return null
  assessments[index] = { ...assessments[index], ...data, assessedAt: new Date() }
  saveToStorage(HOMEWORK_ASSESSMENTS_KEY, assessments)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return assessments[index]
}

export function deleteHomeworkAssessment(id: string): boolean {
  const assessments = getHomeworkAssessments()
  const filtered = assessments.filter((a) => a.id !== id)
  if (filtered.length === assessments.length) return false
  saveToStorage(HOMEWORK_ASSESSMENTS_KEY, filtered)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return true
}

// ========== 小测记录 (QuizRecord) ==========

const QUIZ_RECORDS_KEY = 'tabuddy_quiz_records'

export function getQuizRecords(): QuizRecord[] {
  return getFromStorage<QuizRecord[]>(QUIZ_RECORDS_KEY, [])
}

export function getQuizRecordsByStudent(studentId: string): QuizRecord[] {
  return getQuizRecords().filter((r) => r.studentId === studentId)
}

export function getQuizRecordsByClass(classId: string): QuizRecord[] {
  return getQuizRecords().filter((r) => r.classId === classId)
}

export function saveQuizRecord(
  data: Omit<QuizRecord, 'id' | 'uploadedAt' | 'assessedAt'>
): QuizRecord {
  const records = getQuizRecords()
  const now = new Date()
  const newRecord: QuizRecord = {
    ...data,
    id: generateId(),
    uploadedAt: now,
    assessedAt: now,
  }
  records.push(newRecord)
  saveToStorage(QUIZ_RECORDS_KEY, records)
  return newRecord
}

export function updateQuizRecord(
  id: string,
  data: Partial<Omit<QuizRecord, 'id'>>
): QuizRecord | null {
  const records = getQuizRecords()
  const index = records.findIndex((r) => r.id === id)
  if (index === -1) return null
  records[index] = { ...records[index], ...data, assessedAt: new Date() }
  saveToStorage(QUIZ_RECORDS_KEY, records)
  return records[index]
}

export function deleteQuizRecord(id: string): boolean {
  const records = getQuizRecords()
  const filtered = records.filter((r) => r.id !== id)
  if (filtered.length === records.length) return false
  saveToStorage(QUIZ_RECORDS_KEY, filtered)
  return true
}

// ========== 班级总正确率 (ClassOverallAccuracy) ==========

const CLASS_ACCURACY_KEY = 'tabuddy_class_overall_accuracy'

export function getAllOverallAccuracyRecords(): ClassOverallAccuracy[] {
  return getFromStorage<ClassOverallAccuracy[]>(CLASS_ACCURACY_KEY, [])
}

export function getClassOverallAccuracyRecords(classId: string): ClassOverallAccuracy[] {
  return getAllOverallAccuracyRecords()
    .filter((r) => r.classId === classId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function computeAndSaveClassAccuracy(classId: string): void {
  const records = getQuizRecordsByClass(classId)
  let totalScoreSum = 0
  let totalSum = 0
  for (const r of records) {
    if (r.wordScore != null && r.wordTotal != null && r.wordTotal > 0) {
      totalScoreSum += r.wordScore
      totalSum += r.wordTotal
    }
    if (r.grammarScore != null && r.grammarTotal != null && r.grammarTotal > 0) {
      totalScoreSum += r.grammarScore
      totalSum += r.grammarTotal
    }
  }
  if (totalSum === 0) return
  const overallAccuracy = Math.round((totalScoreSum / totalSum) * 1000) / 10

  const date = new Date().toISOString().split('T')[0]
  const allRecords = getAllOverallAccuracyRecords()
  const existingIndex = allRecords.findIndex(
    (r) => r.classId === classId && r.date === date
  )
  const newRecord: ClassOverallAccuracy = {
    id: existingIndex >= 0 ? allRecords[existingIndex].id : (Date.now().toString(36) + Math.random().toString(36).substring(2, 8)),
    classId,
    date,
    overallAccuracy,
  }
  if (existingIndex >= 0) {
    allRecords[existingIndex] = newRecord
  } else {
    allRecords.push(newRecord)
  }
  saveToStorage(CLASS_ACCURACY_KEY, allRecords)
}

// ========== 课程反馈历史 (FeedbackRecord) ==========

const FEEDBACK_HISTORY_KEY = 'tabuddy_feedback_history'

export function getFeedbackHistory(): FeedbackRecord[] {
  const records = getFromStorage<FeedbackRecord[]>(FEEDBACK_HISTORY_KEY, [])
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getFeedbackHistoryByStudent(studentId: string): FeedbackRecord[] {
  return getFeedbackHistory().filter((r) => r.studentId === studentId)
}

export function saveFeedbackHistory(
  data: Omit<FeedbackRecord, 'id' | 'createdAt'>
): FeedbackRecord {
  const records = getFeedbackHistory()
  const newRecord: FeedbackRecord = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  records.unshift(newRecord)
  saveToStorage(FEEDBACK_HISTORY_KEY, records)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return newRecord
}

export function deleteFeedbackHistory(id: string): boolean {
  const records = getFeedbackHistory()
  const filtered = records.filter((r) => r.id !== id)
  if (filtered.length === records.length) return false
  saveToStorage(FEEDBACK_HISTORY_KEY, filtered)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('classDataChanged'))
  }
  return true
}

export function clearFeedbackHistory(): boolean {
  saveToStorage(FEEDBACK_HISTORY_KEY, [])
  return true
}

// ========== 打卡提醒通知系统 ==========

const NOTIFICATIONS_KEY = 'tabuddy_notifications'
const PUSH_LOGS_KEY = 'tabuddy_push_logs'
const REMINDERS_SENT_KEY = 'tabuddy_reminders_sent'

export function getNotifications(): NotificationItem[] {
  return getFromStorage<NotificationItem[]>(NOTIFICATIONS_KEY, [])
}

export function getUnreadNotifications(): NotificationItem[] {
  return getNotifications().filter(n => !n.read && !n.dismissed)
}

export function getActiveNotifications(): NotificationItem[] {
  return getNotifications().filter(n => !n.dismissed && !n.completed)
}

export function addNotification(data: Omit<NotificationItem, 'id' | 'createdAt' | 'read' | 'dismissed' | 'completed'>): NotificationItem {
  const notifications = getNotifications()
  const newNotification: NotificationItem = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
    read: false,
    dismissed: false,
    completed: false,
  }
  notifications.unshift(newNotification)
  saveToStorage(NOTIFICATIONS_KEY, notifications)
  return newNotification
}

export function markNotificationRead(id: string): void {
  const notifications = getNotifications()
  const index = notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications[index].read = true
    saveToStorage(NOTIFICATIONS_KEY, notifications)
  }
}

export function markNotificationCompleted(id: string): void {
  const notifications = getNotifications()
  const index = notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications[index].completed = true
    notifications[index].read = true
    saveToStorage(NOTIFICATIONS_KEY, notifications)
  }
}

export function dismissNotification(id: string): void {
  const notifications = getNotifications()
  const index = notifications.findIndex(n => n.id === id)
  if (index !== -1) {
    notifications[index].dismissed = true
    notifications[index].read = true
    saveToStorage(NOTIFICATIONS_KEY, notifications)
  }
}

export function dismissAllActiveNotifications(): void {
  const notifications = getNotifications()
  let updated = false
  notifications.forEach(n => {
    if (!n.dismissed) {
      n.dismissed = true
      n.read = true
      updated = true
    }
  })
  if (updated) {
    saveToStorage(NOTIFICATIONS_KEY, notifications)
  }
}

export function markNotificationsCompletedByClass(classId: string): void {
  const notifications = getNotifications()
  let updated = false
  notifications.forEach(n => {
    if (n.classId === classId && !n.completed) {
      n.completed = true
      n.read = true
      updated = true
    }
  })
  if (updated) {
    saveToStorage(NOTIFICATIONS_KEY, notifications)
  }
}

// ========== 推送日志 ==========

export function getPushLogs(): PushLogEntry[] {
  return getFromStorage<PushLogEntry[]>(PUSH_LOGS_KEY, [])
}

export function addPushLog(data: Omit<PushLogEntry, 'id' | 'createdAt'>): PushLogEntry {
  const logs = getPushLogs()
  const newLog: PushLogEntry = {
    ...data,
    id: generateId(),
    createdAt: new Date(),
  }
  logs.unshift(newLog)
  saveToStorage(PUSH_LOGS_KEY, logs)
  return newLog
}

export function getTodayPushLogs(): PushLogEntry[] {
  const today = new Date().toISOString().split('T')[0]
  return getPushLogs().filter(log => {
    const logDate = new Date(log.createdAt).toISOString().split('T')[0]
    return logDate === today
  })
}

// ========== 提醒去重记录 ==========

export function getRemindersSent(): ReminderSentRecord[] {
  return getFromStorage<ReminderSentRecord[]>(REMINDERS_SENT_KEY, [])
}

export function hasReminderBeenSent(scheduleId: string, reminderType: ReminderType): boolean {
  const today = new Date().toISOString().split('T')[0]
  return getRemindersSent().some(
    r => r.scheduleId === scheduleId && r.reminderType === reminderType && r.sentAt === today
  )
}

export function markReminderSent(scheduleId: string, classId: string, reminderType: ReminderType): void {
  const records = getRemindersSent()
  const today = new Date().toISOString().split('T')[0]
  records.push({ scheduleId, classId, reminderType, sentAt: today })
  saveToStorage(REMINDERS_SENT_KEY, records)
}

export function clearExpiredReminderRecords(): void {
  const today = new Date().toISOString().split('T')[0]
  const records = getRemindersSent().filter(r => r.sentAt === today)
  saveToStorage(REMINDERS_SENT_KEY, records)
}

// ========== 已删除的课程安排日期追踪 ==========

const DELETED_SCHEDULE_DATES_KEY = 'tabuddy_deleted_schedule_dates'

export function getDeletedScheduleDates(classId: string): string[] {
  const all: Record<string, string[]> = getFromStorage<Record<string, string[]>>(DELETED_SCHEDULE_DATES_KEY, {})
  return all[classId] || []
}

export function addDeletedScheduleDate(classId: string, date: string): void {
  const all: Record<string, string[]> = getFromStorage<Record<string, string[]>>(DELETED_SCHEDULE_DATES_KEY, {})
  if (!all[classId]) all[classId] = []
  if (!all[classId].includes(date)) {
    all[classId].push(date)
    saveToStorage(DELETED_SCHEDULE_DATES_KEY, all)
  }
}

export function removeDeletedScheduleDate(classId: string, date: string): void {
  const all: Record<string, string[]> = getFromStorage<Record<string, string[]>>(DELETED_SCHEDULE_DATES_KEY, {})
  if (all[classId]) {
    all[classId] = all[classId].filter(d => d !== date)
    if (all[classId].length === 0) delete all[classId]
    saveToStorage(DELETED_SCHEDULE_DATES_KEY, all)
  }
}
