'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { AgentCardData } from '@/lib/agent/types'
import { getCurrentClassByTime, getClasses } from '@/lib/store'
import { getWorkflowTemplateByCourseType } from '@/lib/workflow-store'
import { WORKFLOW_NODE_LABELS, WORKFLOW_NODE_ICONS } from '@/types'
import type { WorkflowNode, ClassType, Class } from '@/types'

const STAGE_OPTIONS = [
  { label: '课前', value: 'before_class' },
  { label: '课中前半节', value: 'first_half' },
  { label: '课中后半节', value: 'second_half' },
  { label: '课后收尾', value: 'after_class' },
]

const STAGE_LABELS: Record<string, string> = {
  before_class: '课前',
  first_half: '课中前半节',
  second_half: '课中后半节',
  after_class: '课后收尾',
}

interface AgentStepCardProps {
  cardData: AgentCardData
  onCancel: () => void
  onQuickSelect?: (value: string) => void
}

export function AgentStepCard({ cardData, onCancel, onQuickSelect }: AgentStepCardProps) {
  const { title, description, step, totalSteps, field, collected, isLastStep } = cardData
  const [isCustomInput, setIsCustomInput] = useState(false)
  const [customValue, setCustomValue] = useState('')
  const [studentsInput, setStudentsInput] = useState('')

  const [taskName, setTaskName] = useState('')
  const [selectedStage, setSelectedStage] = useState('first_half')
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [requirePhoto, setRequirePhoto] = useState(false)
  const [isRequired, setIsRequired] = useState(true)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | null>(null)
  const [stepTaskName, setStepTaskName] = useState('')
  const [overrideClass, setOverrideClass] = useState<Class | null>(null)
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [pendingClass, setPendingClass] = useState<Class | null>(null)
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)

  const progressPercent = ((step - 1) / totalSteps) * 100

  const activeClass = useMemo(() => getCurrentClassByTime(), [])

  const effectiveClass = overrideClass || activeClass

  const workflowNodes = useMemo(() => {
    if (!activeClass) return []
    const template = getWorkflowTemplateByCourseType(activeClass.type as ClassType)
    if (!template) return []
    return [...template.nodes]
      .filter(n => n.enabled)
      .sort((a, b) => a.order - b.order)
  }, [activeClass])

  const collecteName = (collected?.taskName as string) || ''
  const collecteStage = (collected?.taskStage as string) || ''
  const collectePosition = collected?.taskPosition ? parseInt(collected.taskPosition as string) : -1

  function getEffectiveIndex(): number {
    if (insertIndex !== null) return insertIndex
    if (typeof collectePosition === 'number' && collectePosition >= 0) return collectePosition

    const total = workflowNodes.length
    const stage = collecteStage || selectedStage
    switch (stage) {
      case 'before_class': return 0
      case 'first_half': return Math.floor(total * 0.25)
      case 'second_half': return Math.floor(total * 0.5)
      case 'after_class': return total
      default: return total
    }
  }

  const previewNodes = useMemo(() => {
    const list: { id: string; label: string; icon: string; isNew?: boolean; node: WorkflowNode | null }[] =
      workflowNodes.map((n, i) => ({
        id: n.id,
        label: n.customName || WORKFLOW_NODE_LABELS[n.type] || n.type,
        icon: WORKFLOW_NODE_ICONS[n.type] || '⚡',
        isNew: false,
        node: n,
      }))

    const name = (n: string) => (n || taskName || '新任务').trim()
    const pos = getEffectiveIndex()
    const newTaskNode: WorkflowNode = {
      id: '__new__',
      type: 'custom',
      enabled: true,
      order: pos,
      nodeCategory: isRequired ? 'required' : 'optional',
      countInTodo: true,
      isCustom: true,
      customName: name(collecteName),
    }

    const newItem = {
      id: '__new__',
      label: name(collecteName),
      icon: '⚡',
      isNew: true,
      node: newTaskNode,
    }

    const result = [...list]
    result.splice(pos, 0, newItem)
    return result
  }, [workflowNodes, taskName, isRequired, insertIndex, selectedStage, collected])

  function getStageLabel(stage?: string): string {
    return STAGE_LABELS[stage || collecteStage || selectedStage] || '课中'
  }

  function handleMoveUp() {
    const current = getEffectiveIndex()
    if (current > 0) {
      setInsertIndex(current - 1)
    }
  }

  function handleMoveDown() {
    const current = getEffectiveIndex()
    if (current < workflowNodes.length) {
      setInsertIndex(current + 1)
    }
  }

  const allClasses = useMemo(() => {
    try { return getClasses() } catch { return [] }
  }, [])

  function handlePickerSelect(cls: Class) {
    setPendingClass(cls)
    setShowSwitchConfirm(true)
  }

  function confirmSwitch() {
    if (pendingClass) {
      setOverrideClass(pendingClass)
    }
    setShowClassPicker(false)
    setShowSwitchConfirm(false)
    setPendingClass(null)
  }

  function cancelSwitch() {
    setShowSwitchConfirm(false)
    setPendingClass(null)
  }

  function handleConfirm() {
    if (!onQuickSelect) return
    setSyncStatus('syncing')

    const formData: Record<string, string | number | boolean> = {}

    if (step === 1) formData.taskName = stepTaskName.trim()
    if (step === 2) formData.taskStage = selectedStage
    if (step === 3) {
      formData.taskPosition = getEffectiveIndex()
      formData.taskStage = collecteStage || selectedStage
    }
    if (step === 4) {
      formData.requirePhoto = requirePhoto
      formData.isRequiredTask = isRequired
      if (overrideClass && overrideClass.name !== activeClass?.name) {
        formData.className = overrideClass.name
      }
    }

    setTimeout(() => {
      onQuickSelect(JSON.stringify(formData))
      setSyncStatus('success')
    }, 300)
  }

  function handleCancel() {
    setSyncStatus(null)
    onCancel()
  }

  const fieldLabelMap: Record<string, string> = {
    className: '班级名称',
    classType: '班级类型',
    students: '学生名单',
    studentName: '学生姓名',
    reason: '标记原因',
    taskName: '任务名称',
  }

  const collectedEntries = Object.entries(collected).filter(
    ([key, value]) => value && key !== 'reason' && !key.startsWith('taskForm_')
  )

  const handleCustomSubmit = () => {
    const value = customValue.trim()
    if (value && onQuickSelect) {
      onQuickSelect(value.toUpperCase())
      setIsCustomInput(false)
      setCustomValue('')
    }
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCustomSubmit()
    }
  }

  const parseStudentNames = (input: string): string[] => {
    const names = input
      .split(/[,，、\s]+/)
      .map(s => s.trim())
      .filter(Boolean)
    return Array.from(new Set(names))
  }

  const handleStudentsImport = () => {
    const names = parseStudentNames(studentsInput)
    if (names.length > 0 && onQuickSelect) {
      onQuickSelect(studentsInput)
      setStudentsInput('')
    }
  }

  const handleStudentsKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleStudentsImport()
    }
  }

  const previewNames = studentsInput.trim() ? parseStudentNames(studentsInput) : []
  const collectedStudents = collected.students
    ? parseStudentNames(collected.students as string)
    : []

  const allOptions = field.options || []
  const hasCustomType = field.key === 'classType'

  const hasFormError = step === 1 ? !stepTaskName.trim() : false

  const newTaskPosition = getEffectiveIndex() + 1

  const cardFrame = (content: React.ReactNode, footer?: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-medium overflow-hidden">
        {field.type === 'task_form' && (
          <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Agent模式
              </span>
              <span className="text-xs text-muted-foreground">
                {step}/{totalSteps}步 · 新建任务
              </span>
            </div>
            {totalSteps > 1 && (
              <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}
        {content}
        {footer && (
          <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
            {footer}
          </div>
        )}
      </div>
    </motion.div>
  )

  if (field.type === 'task_form') {
    if (step === 1) {
      return cardFrame(
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">填写任务名称</h4>
            <p className="text-xs text-muted-foreground mt-1">请输入要添加的工作流任务名称</p>
          </div>

          {effectiveClass ? (
            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs shrink-0">🎯</span>
                  <span className="text-xs font-medium text-primary truncate">
                    目标课程（不可修改）：{effectiveClass.name}（{effectiveClass.type}）
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowClassPicker(!showClassPicker)}
                  className="text-[10px] px-2 py-0.5 rounded-md border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
                >
                  修改
                </button>
              </div>

              {showClassPicker && (
                <div className="mt-2 pt-2 border-t border-primary/10">
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {allClasses.map((cls, i) => {
                      const isCurrent = cls.name === effectiveClass.name && cls.type === effectiveClass.type
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => handlePickerSelect(cls)}
                          className={`w-full text-left px-2 py-1.5 rounded-md text-xs transition-colors ${
                            isCurrent
                              ? 'bg-primary/15 text-primary font-medium'
                              : 'text-foreground hover:bg-primary/5'
                          }`}
                        >
                          {cls.name}（{cls.type}）
                          {isCurrent && <span className="ml-1 text-primary">✓</span>}
                        </button>
                      )
                    })}
                  </div>

                  {showSwitchConfirm && pendingClass && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 mb-2">
                        确定要将任务添加到【{pendingClass.name}】课程吗？
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={confirmSwitch}
                          className="px-3 py-1 text-xs rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                        >
                          确定
                        </button>
                        <button
                          type="button"
                          onClick={cancelSwitch}
                          className="px-3 py-1 text-xs rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700">
              <span className="text-xs">⚠️</span>
              <span className="text-xs">当前没有活跃的课程，任务将无法同步</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">任务名称</label>
            <input
              type="text"
              value={stepTaskName}
              onChange={(e) => setStepTaskName(e.target.value)}
              placeholder="请输入任务名称，如「课堂小测」"
              className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
          </div>
        </div>,
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              if (stepTaskName.trim() && onQuickSelect) {
                onQuickSelect(JSON.stringify({ taskName: stepTaskName.trim() }))
              }
            }}
            disabled={!stepTaskName.trim()}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            下一步
          </button>
        </div>
      )
    }

    if (step === 2) {
      return cardFrame(
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">选择任务阶段</h4>
            <p className="text-xs text-muted-foreground mt-1">请选择该任务所属的教学阶段</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">所属阶段</label>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_OPTIONS.map((option) => {
                const isSelected = selectedStage === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStage(option.value)}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 border ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>,
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              if (onQuickSelect) {
                onQuickSelect(JSON.stringify({ taskStage: selectedStage }))
              }
            }}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            下一步
          </button>
        </div>
      )
    }

    if (step === 3) {
      return cardFrame(
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">调整任务顺序</h4>
            <p className="text-xs text-muted-foreground mt-1">调整任务在当前课程工作流中的插入位置</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">任务位置</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMoveUp}
                disabled={getEffectiveIndex() <= 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-input bg-background text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ↑ 上移
              </button>
              <button
                type="button"
                onClick={handleMoveDown}
                disabled={getEffectiveIndex() >= workflowNodes.length}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-input bg-background text-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                ↓ 下移
              </button>
              <span className="text-xs text-muted-foreground ml-1">
                当前顺序：{getStageLabel()}第{newTaskPosition}步
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              当前课程工作流预览
            </label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border/50 bg-muted/10 p-2 space-y-0.5">
              {previewNodes.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">暂无工作流节点</p>
              )}
              {previewNodes.map((item, i) => (
                <div
                  key={`${item.id}-${i}`}
                  className={`flex items-center gap-2 px-2 py-1 rounded-md text-xs ${
                    item.isNew
                      ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="w-5 text-right text-[10px] text-muted-foreground/60 shrink-0">
                    {i + 1}
                  </span>
                  <span className="shrink-0">{item.isNew ? '⚡' : item.icon}</span>
                  <span className="truncate flex-1">{item.label}</span>
                  {item.isNew && (
                    <span className="text-[10px] text-primary/70 shrink-0">← 新插入</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>,
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              if (onQuickSelect) {
                onQuickSelect(JSON.stringify({ taskPosition: getEffectiveIndex() }))
              }
            }}
            className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            下一步
          </button>
        </div>
      )
    }

    if (step === 4) {
      const finalName = (collected?.taskName as string) || ''
      const finalStage = getStageLabel()
      const finalPos = (collectePosition >= 0 ? collectePosition : Math.floor(workflowNodes.length * 0.25)) + 1

      return cardFrame(
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-foreground">确认并提交</h4>
            <p className="text-xs text-muted-foreground mt-1">配置任务属性并确认添加</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">可选属性</label>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-sm">📸</span>
                <span className="text-xs text-foreground">需要拍照</span>
              </div>
              <button
                type="button"
                onClick={() => setRequirePhoto(!requirePhoto)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                  requirePhoto ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    requirePhoto ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-sm">⭐</span>
                <span className="text-xs text-foreground">必填任务</span>
              </div>
              <button
                type="button"
                onClick={() => setIsRequired(!isRequired)}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                  isRequired ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    isRequired ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-xs text-primary">
              即将添加任务：<strong>{finalName}</strong>，位置：{finalStage}第{finalPos}步，仅本次【{effectiveClass?.name}】课程生效，确认添加？
            </p>
          </div>

          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
              <span className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
              <span className="text-xs text-blue-600">正在同步到工作流...</span>
            </div>
          )}

          {syncStatus === 'success' && effectiveClass && (
            <div className="px-3 py-2 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs text-green-700">
                ✅ 任务已添加成功！已同步到{effectiveClass.name}（{effectiveClass.type}）课程的工作流中，你可以在分班待办中心查看和调整
              </p>
            </div>
          )}
        </div>,
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleCancel}
            disabled={syncStatus === 'syncing'}
            className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 transition-colors"
          >
            取消
          </button>
          {syncStatus === 'success' ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              完成
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={syncStatus === 'syncing'}
              className="px-4 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {syncStatus === 'syncing' ? '同步中...' : '确认添加'}
            </button>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-medium overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50 bg-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Agent模式
            </span>
            <span className="text-xs text-muted-foreground">
              {step}/{totalSteps}步
            </span>
          </div>
          <div className="w-full h-1 bg-primary/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>

          {field.type === 'select' && allOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <div className="flex flex-wrap gap-1.5">
                {allOptions.map((option) => {
                  const isSelected = collected[field.key] === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setIsCustomInput(false)
                        onQuickSelect?.(option.value)
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 border ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background text-foreground border-border hover:border-primary/40 hover:bg-primary/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>

              {hasCustomType && !isCustomInput && (
                <button
                  type="button"
                  onClick={() => setIsCustomInput(true)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2 px-2 py-1 rounded-md hover:bg-primary/5"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  自定义输入
                </button>
              )}

              {isCustomInput && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    onKeyDown={handleCustomKeyDown}
                    placeholder="输入自定义类型..."
                    className="flex-1 h-8 px-3 text-xs rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={!customValue.trim()}
                    className="h-8 px-3 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    确认
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomInput(false)
                      setCustomValue('')
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    取消
                  </button>
                </div>
              )}

              {collected[field.key] && !isCustomInput && (
                <p className="text-xs text-primary mt-1">
                  ✅ 已选择：{allOptions.find(o => o.value === collected[field.key])?.label || collected[field.key]}
                </p>
              )}
            </div>
          )}

          {field.type === 'text' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-dashed border-border text-xs text-muted-foreground">
                <span>💬</span>
                <span>请在输入框中填写{field.label}后发送</span>
              </div>
            </div>
          )}

          {field.type === 'students' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">学生名单</label>

              {collectedStudents.length > 0 ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-primary font-medium">
                      ✅ 已导入 {collectedStudents.length} 名学生
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {collectedStudents.map((name, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={studentsInput}
                    onChange={(e) => setStudentsInput(e.target.value)}
                    onKeyDown={handleStudentsKeyDown}
                    placeholder={"粘贴学生名单，一行一个姓名，或用逗号分隔\n例如：\n张三\n李四\n王五"}
                    rows={4}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-background placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />

                  {previewNames.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        识别到 {previewNames.length} 名学生：
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {previewNames.map((name, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-xs text-muted-foreground"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleStudentsImport}
                    disabled={previewNames.length === 0}
                    className="w-full h-8 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
                  >
                    {previewNames.length > 0
                      ? `确认导入 ${previewNames.length} 名学生`
                      : '导入学生名单'}
                  </button>

                  <p className="text-[11px] text-muted-foreground/60">
                    支持批量粘贴，也可在输入框中手动输入后发送
                  </p>
                </div>
              )}
            </div>
          )}

          {collectedEntries.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">已收集信息：</p>
              <div className="flex flex-wrap gap-1">
                {collectedEntries.map(([key, value]) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/5 text-primary text-xs"
                  >
                    {fieldLabelMap[key] || key}: {key === 'students' ? `${parseStudentNames(value as string).length} 名学生` : value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-border/50 bg-muted/30 flex items-center justify-between">
          {isLastStep ? (
            <span className="text-xs text-muted-foreground">
              完成后将自动执行并同步到班级管理板块
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              还有 {totalSteps - step} 步
            </span>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-md hover:bg-destructive/5"
          >
            取消操作
          </button>
        </div>
      </div>
    </motion.div>
  )
}
