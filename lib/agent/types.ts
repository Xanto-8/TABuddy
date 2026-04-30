export type AgentIntent =
  | 'create_class'
  | 'set_class_type'
  | 'add_student_to_class'
  | 'add_workflow_task'
  | 'reorder_workflow_tasks'
  | 'add_photo_reminder'
  | 'mark_key_student'
  | 'unmark_key_student'
  | 'update_retest_list'
  | 'update_quiz_completion'
  | 'add_quiz_notes'

export interface AgentParam {
  className?: string
  classType?: string
  classId?: string
  studentName?: string
  studentId?: string
  students?: string
  taskName?: string
  taskStage?: string
  taskPosition?: number
  requirePhoto?: boolean
  isRequiredTask?: boolean
  taskOrder?: string[]
  reason?: string
  retestStudents?: string[]
  quizCompletion?: string
  quizNotes?: string
}

export interface AgentStepField {
  key: string
  label: string
  type: 'text' | 'select' | 'students' | 'task_form'
  placeholder?: string
  options?: { label: string; value: string }[]
}

export interface AgentStep {
  stepNumber: number
  totalSteps: number
  title: string
  description?: string
  field: AgentStepField
}

export interface AgentSession {
  id: string
  intent: AgentIntent
  intentLabel: string
  params: AgentParam
  steps: AgentStep[]
  currentStep: number
  collected: Record<string, string>
  createdAt: number
  cancelled: boolean
  completed: boolean
}

export interface AgentCardData {
  sessionId: string
  title: string
  description: string
  step: number
  totalSteps: number
  field: AgentStepField
  collected: Record<string, string>
  isLastStep: boolean
}

export interface AgentResult {
  success: boolean
  message: string
  syncTo: string
  data?: unknown
  needMoreInfo?: boolean
  followUpQuestion?: string

  isAgentMode?: boolean
  sessionId?: string
  cardData?: AgentCardData
}

export interface AgentAction {
  intent: AgentIntent
  params: AgentParam
  rawInput: string
}

export type AgentHandler = (action: AgentAction) => AgentResult

export const INTENT_LABELS: Record<AgentIntent, string> = {
  create_class: '创建班级',
  set_class_type: '设置班级类型',
  add_student_to_class: '添加学生到班级',
  add_workflow_task: '添加工作流任务',
  reorder_workflow_tasks: '调整任务顺序',
  add_photo_reminder: '添加拍照提醒',
  mark_key_student: '标记重点学生',
  unmark_key_student: '取消重点标记',
  update_retest_list: '录入重测名单',
  update_quiz_completion: '更新小测状态',
  add_quiz_notes: '添加小测备注',
}
