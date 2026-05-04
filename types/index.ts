// 核心数据模型类型定义

export type ClassType = 'GY' | 'KET' | 'PET' | 'FCE' | 'CAE' | 'CPE' | 'OTHER' | (string & {})

export interface ClassSchedule {
  id: string
  classId: string
  dayOfWeek: number // 0-6, 0=Sunday, 1=Monday, etc.
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  createdAt: Date
  updatedAt: Date
}

export interface Class {
  id: string
  name: string
  type: ClassType
  description?: string
  studentCount: number
  gyId?: string
  userId?: string
  createdBy?: string
  schedules?: ClassSchedule[]
  createdAt: Date
  updatedAt: Date
}

export interface Student {
  id: string
  name: string
  class: ClassType
  classId?: string
  avatar?: string
  email?: string
  phone?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskType = 'homework' | 'quiz' | 'feedback' | 'resource' | 'meeting' | 'other'

export interface Task {
  id: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  completedAt?: Date
  assignedTo?: string // studentId or class
  createdAt: Date
  updatedAt: Date
}

// 班级课时任务模板 - 模板不包含课时和完成状态，课时在生成实例时自动计算
export interface CourseTaskTemplate {
  id: string
  classId: string
  lesson?: string        // 模板的课时名称（可选旧数据），实例的课时从上课日期自动计算
  title: string         // 任务名称
  content: string       // 任务内容/描述
  order: number         // 排序序号
  createdAt: Date
  updatedAt: Date
}

export interface CourseTask {
  id: string
  classId: string
  templateId?: string   // 关联模板ID，从模板生成时填写
  lesson: string        // 课时名称
  title: string         // 任务名称
  content: string       // 任务内容/描述
  date: string          // 任务日期 YYYY-MM-DD
  completed: boolean    // 完成状态
  isCustom?: boolean    // true=自定义任务（期中/期末专用），false=从模板生成
  createdAt: Date
  updatedAt: Date
}

export type CompletionStatus = 'completed' | 'partial' | 'not_done'
export type HandwritingQuality = 'excellent' | 'good' | 'fair' | 'poor'

export interface HomeworkAssessment {
  id: string
  studentId: string
  taskId?: string
  completion: CompletionStatus
  handwriting: HandwritingQuality
  accuracy: number // 0-100
  feedback: string
  generatedFeedback: string
  notes?: string
  submittedAt: Date
  assessedAt: Date
}

export interface QuizRecord {
  id: string
  studentId: string
  classId: string
  wordScore?: number
  wordTotal?: number
  grammarScore?: number
  grammarTotal?: number
  grammarAccuracy?: number
  overallAccuracy?: number
  photos: string[]
  completion: CompletionStatus
  notes?: string
  uploadedAt: Date
  assessedAt: Date
}

export interface ClassOverallAccuracy {
  id: string
  classId: string
  date: string
  overallAccuracy: number
}

export type FeedbackTemplateType = 'positive' | 'needs_improvement' | 'technical' | 'encouragement' | 'warning'

export interface FeedbackTemplate {
  id: string
  type: FeedbackTemplateType
  title: string
  content: string
  tags: string[]
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

export interface GeneratedFeedback {
  id: string
  studentId: string
  templateId?: string
  content: string
  isCustomized: boolean
  usedInReport?: boolean
  createdAt: Date
}

export type ResourceType = 'link' | 'document' | 'video' | 'image' | 'note' | 'other'

export interface Resource {
  id: string
  title: string
  description?: string
  type: ResourceType
  url?: string
  filePath?: string
  tags: string[]
  isFavorite: boolean
  accessCount: number
  createdAt: Date
  updatedAt: Date
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  notifications: {
    taskReminders: boolean
    feedbackGenerated: boolean
    reportReady: boolean
  }
  shortcuts: Record<string, string>
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// 表单验证类型
export interface HomeworkAssessmentForm {
  studentId: string
  completion: CompletionStatus
  handwriting: HandwritingQuality
  accuracy: number
  feedback: string
  notes?: string
}

export interface QuizUploadForm {
  studentId: string
  classId: string
  photos: File[]
  wordScore?: number
  wordTotal?: number
  grammarAccuracy?: number
  completion: CompletionStatus
  notes?: string
}

export interface FeedbackGenerationForm {
  studentId: string
  templateType?: FeedbackTemplateType
  customContent?: string
  performanceNotes: string
}

export interface FeedbackRecord {
  id: string
  studentId: string
  studentName: string
  className?: string
  lesson?: string
  inputKeywords?: string[]
  moduleScores?: { module: string; score: number; maxScore: number; rate: number; grade: string }[]
  totalRate?: number
  overallGrade?: string
  generatedContent: string
  usedModules?: string[]
  createdAt: Date
}

// ========== 打卡提醒通知系统 ==========

export type ReminderType = '60min' | '30min' | '15min' | 'workflow_node' | 'feedback'
export type PushStatus = 'sent' | 'failed' | 'cancelled'

export interface NotificationItem {
  id: string
  classId: string
  className: string
  type: ReminderType
  title: string
  message: string
  createdAt: Date
  read: boolean
  dismissed: boolean
  completed: boolean
  link?: string
}

export interface ServerNotification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  link: string
  createdAt: string
  userId: string
}

export interface PushLogEntry {
  id: string
  scheduleId: string
  classId: string
  className: string
  reminderType: ReminderType
  status: PushStatus
  message: string
  errorMessage?: string
  createdAt: Date
}

export interface ReminderSentRecord {
  scheduleId: string
  classId: string
  reminderType: ReminderType
  sentAt: string
}

// ========== 工作流/思维导图流程模板系统 ==========

export type WorkflowNodeType =
  | 'grade_homework'
  | 'homework_feedback'
  | 'grade_quiz'
  | 'quiz_analysis'
  | 'course_feedback'
  | 'send_content'
  | 'send_homework'
  | 'sync_quiz'
  | 'retest_list'
  | 'custom'

export const WORKFLOW_NODE_LABELS: Record<WorkflowNodeType, string> = {
  grade_homework: '批改作业',
  homework_feedback: '作业反馈',
  grade_quiz: '小测批改',
  quiz_analysis: '记录小测学情',
  course_feedback: '撰写课程反馈',
  send_content: '家长群发送当日学习内容',
  send_homework: '家长群发送课后作业',
  sync_quiz: '同步小测情况',
  retest_list: '发布重测留校名单',
  custom: '自定义节点',
}

export const WORKFLOW_NODE_ICONS: Record<WorkflowNodeType, string> = {
  grade_homework: '📝',
  homework_feedback: '💬',
  grade_quiz: '📊',
  quiz_analysis: '📋',
  course_feedback: '✍️',
  send_content: '📤',
  send_homework: '📚',
  sync_quiz: '🔄',
  retest_list: '📌',
  custom: '⚡',
}

export const DEFAULT_WORKFLOW_NODES: WorkflowNodeType[] = [
  'grade_homework',
  'homework_feedback',
  'grade_quiz',
  'quiz_analysis',
  'course_feedback',
  'send_content',
  'send_homework',
  'sync_quiz',
  'retest_list',
]

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  enabled: boolean
  order: number
  customName?: string
  customIcon?: string
  description?: string
  nodeCategory?: 'required' | 'optional'
  countInTodo?: boolean
  isCustom?: boolean
}

export interface WorkflowTemplate {
  id: string
  courseType: ClassType
  name: string
  courseLabel?: string
  isCustom?: boolean
  nodes: WorkflowNode[]
  createdAt: Date
  updatedAt: Date
}

export interface PresetNodeDefinition {
  type: WorkflowNodeType
  label: string
  icon: string
  description: string
  category: 'system' | 'custom_template'
}

// 请假记录
export interface AbsenceRecord {
  classId: string
  date: string
  studentIds: string[]
  updatedAt: Date
}

// 班级工作流待办事项
export interface WorkflowTodo {
  id: string
  classId: string
  className: string
  nodeType: WorkflowNodeType
  nodeId?: string
  label: string
  date: string
  completed: boolean
  completedAt?: string
}

// 用户提交的帮助反馈
export type FeedbackType = 'bug' | 'suggestion' | 'other'

export interface UserFeedback {
  id: string
  type: FeedbackType
  description: string
  screenshot?: string
  createdAt: Date
  status: 'pending' | 'resolved' | 'closed'
  reply?: string
  repliedAt?: Date
}

// ========== 邀请码与助教绑定系统 ==========

export type ValidPeriod = 'permanent' | '24h' | '7d'

export interface TeacherAssistantBind {
  id: string
  inviteCode: string
  status: 'active' | 'unbinded'
  validPeriod: ValidPeriod
  expiresAt: string | null
  createdAt: string
  bindedAt: string | null
  teacherId: string
  teacher?: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
  assistantId: string | null
  assistant?: {
    id: string
    username: string
    displayName: string
    avatar: string
  }
}

export interface InviteCodeInfo {
  inviteCode: string
  validPeriod: ValidPeriod
  expiresAt: string | null
  status: 'active' | 'unbinded'
  createdAt: string
}

