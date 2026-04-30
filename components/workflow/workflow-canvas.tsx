'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, RotateCcw, Save, Sparkles, X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { WorkflowTemplate, WorkflowNode as WorkflowNodeType, ClassType, WorkflowNodeType as WorkflowNodeTypeEnum } from '@/types'
import {
  DEFAULT_WORKFLOW_NODES,
  WORKFLOW_NODE_LABELS,
  WORKFLOW_NODE_ICONS,
} from '@/types'
import { WorkflowNode } from './workflow-node'
import {
  saveWorkflowTemplate,
  updateWorkflowNode,
  deleteWorkflowNode,
  reorderWorkflowNodes,
  resetWorkflowTemplate,
  getOrCreateWorkflowTemplate,
} from '@/lib/workflow-store'
import { cn } from '@/lib/utils'

interface WorkflowCanvasProps {
  courseType: ClassType
  templateOverride?: WorkflowTemplate | null
  onTemplateChange?: (template: WorkflowTemplate) => void
}

const COURSE_TYPE_LABELS: Record<ClassType, string> = {
  GY: 'GY',
  KET: 'KET',
  PET: 'PET',
  FCE: 'FCE',
  CAE: 'CAE',
  CPE: 'CPE',
  OTHER: '其他',
}

const PRESET_ICONS = [
  '📝', '💬', '📊', '📋', '✍️', '📤', '📚', '🔄', '📌',
  '📖', '🎯', '⭐', '🔔', '📎', '🗂️', '✅', '📈', '🎓',
  '💡', '🔍', '📁', '📐', '🎨', '📝', '🔗', '📅', '📞',
]

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

interface EditModalProps {
  node: WorkflowNodeType | null
  onSave: (updates: Partial<WorkflowNodeType>) => void
  onClose: () => void
}

function EditNodeModal({ node, onSave, onClose }: EditModalProps) {
  const [name, setName] = useState(node?.customName || WORKFLOW_NODE_LABELS[node?.type || 'custom'] || '')
  const [icon, setIcon] = useState(node?.customIcon || WORKFLOW_NODE_ICONS[node?.type || 'custom'] || '⚡')
  const [description, setDescription] = useState(node?.description || '')
  const [nodeCategory, setNodeCategory] = useState<'required' | 'optional'>(node?.nodeCategory || 'required')
  const [countInTodo, setCountInTodo] = useState(node?.countInTodo !== false)
  const [showIconPicker, setShowIconPicker] = useState(false)

  if (!node) return null

  const handleSave = () => {
    onSave({
      customName: name,
      customIcon: icon,
      description,
      nodeCategory,
      countInTodo,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[440px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">编辑节点</h3>
            <p className="text-sm text-gray-500 mt-0.5">自定义节点名称、图标和属性</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">节点名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入节点名称"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">节点图标</label>
            <div className="relative">
              <button
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50
                  hover:bg-gray-100 transition-all w-full text-left"
              >
                <span className="text-2xl">{icon}</span>
                <span className="text-sm text-gray-500">点击选择图标</span>
              </button>
              {showIconPicker && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-3 z-10">
                  <div className="grid grid-cols-7 gap-1.5">
                    {PRESET_ICONS.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => { setIcon(ic); setShowIconPicker(false) }}
                        className={cn(
                          'w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all hover:bg-indigo-50',
                          icon === ic && 'bg-indigo-100 ring-2 ring-indigo-300'
                        )}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入节点描述（可选）"
              rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">节点类型</label>
            <div className="flex gap-2">
              <button
                onClick={() => setNodeCategory('required')}
                className={cn(
                  'flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  nodeCategory === 'required'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                必填节点
              </button>
              <button
                onClick={() => setNodeCategory('optional')}
                className={cn(
                  'flex-1 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all',
                  nodeCategory === 'optional'
                    ? 'border-amber-200 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                可选节点
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-700">计入待办数量</p>
              <p className="text-xs text-gray-500 mt-0.5">开启后此节点将计入待办总数</p>
            </div>
            <button
              onClick={() => setCountInTodo(!countInTodo)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-all duration-200',
                countInTodo ? 'bg-indigo-500' : 'bg-gray-300'
              )}
            >
              <motion.div
                animate={{ x: countInTodo ? 22 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500
              hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-sm"
          >
            保存修改
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialog({ title, message, confirmText = '确认', cancelText = '取消', variant = 'default', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[400px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-500'
            )}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {variant === 'danger' ? (
                  <>
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </>
                ) : (
                  <circle cx="12" cy="12" r="10" />
                )}
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 ml-[52px]">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-sm',
              variant === 'danger'
                ? 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
            )}
          >
            {confirmText}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface NodeLibraryPanelProps {
  onSelectPreset: (type: WorkflowNodeTypeEnum) => void
  onCreateCustom: (name: string, icon: string, description: string) => void
  existingTypes: Set<string>
  onClose: () => void
}

function NodeLibraryPanel({ onSelectPreset, onCreateCustom, existingTypes, onClose }: NodeLibraryPanelProps) {
  const [tab, setTab] = useState<'preset' | 'custom'>('preset')
  const [customName, setCustomName] = useState('')
  const [customIcon, setCustomIcon] = useState('⚡')
  const [customDesc, setCustomDesc] = useState('')
  const [showIconPicker, setShowIconPicker] = useState(false)

  const presetNodes = DEFAULT_WORKFLOW_NODES
    .map((type) => ({
      type,
      label: WORKFLOW_NODE_LABELS[type],
      icon: WORKFLOW_NODE_ICONS[type],
      isExisting: existingTypes.has(type),
    }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[480px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800">添加节点</h3>
            <p className="text-sm text-gray-500 mt-0.5">选择预设节点或创建自定义节点</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex border-b border-gray-100 px-6">
          <button
            onClick={() => setTab('preset')}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-all',
              tab === 'preset' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            系统预设
            {tab === 'preset' && (
              <motion.div layoutId="libTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
          <button
            onClick={() => setTab('custom')}
            className={cn(
              'relative px-4 py-3 text-sm font-medium transition-all',
              tab === 'custom' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            创建自定义
            {tab === 'custom' && (
              <motion.div layoutId="libTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        </div>

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">
            {tab === 'preset' ? (
              <motion.div
                key="preset"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-2"
              >
                {presetNodes.map((preset) => (
                  <button
                    key={preset.type}
                    onClick={() => onSelectPreset(preset.type)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border text-left group transition-all',
                      preset.isExisting
                        ? 'border-gray-100 bg-gray-50 hover:bg-gray-100'
                        : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/30'
                    )}
                  >
                    <span className={cn('text-xl', preset.isExisting && 'opacity-50')}>{preset.icon}</span>
                    <div className="flex-1">
                      <p className={cn(
                        'text-sm font-medium transition-colors',
                        preset.isExisting ? 'text-gray-500' : 'text-gray-800 group-hover:text-indigo-600'
                      )}>
                        {preset.label}
                      </p>
                      <p className={cn('text-xs', preset.isExisting ? 'text-gray-400' : 'text-gray-400')}>系统预设节点</p>
                    </div>
                    {preset.isExisting ? (
                      <span className="flex items-center gap-1 text-xs text-gray-400 font-medium px-2 py-0.5 rounded-full bg-gray-100">
                        <Plus size={12} />
                        已添加
                      </span>
                    ) : (
                      <Plus size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                    )}
                  </button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">节点名称</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="如：学习情况记录"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800
                      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                      transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">节点图标</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowIconPicker(!showIconPicker)}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50
                        hover:bg-gray-100 transition-all w-full text-left"
                    >
                      <span className="text-2xl">{customIcon}</span>
                      <span className="text-sm text-gray-500">点击选择图标</span>
                    </button>
                    {showIconPicker && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg p-3 z-10">
                        <div className="grid grid-cols-7 gap-1.5">
                          {PRESET_ICONS.map((ic) => (
                            <button
                              key={ic}
                              onClick={() => { setCustomIcon(ic); setShowIconPicker(false) }}
                              className={cn(
                                'w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all hover:bg-indigo-50',
                                customIcon === ic && 'bg-indigo-100 ring-2 ring-indigo-300'
                              )}
                            >
                              {ic}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">描述</label>
                  <textarea
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="输入节点描述（可选）"
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm text-gray-800
                      placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300
                      transition-all resize-none"
                  />
                </div>

                <button
                  onClick={() => {
                    if (!customName.trim()) return
                    onCreateCustom(customName.trim(), customIcon, customDesc)
                  }}
                  disabled={!customName.trim()}
                  className="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-purple-500
                    hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-sm
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  创建并添加节点
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function WorkflowCanvas({ courseType, templateOverride, onTemplateChange }: WorkflowCanvasProps) {
  const [template, setTemplate] = useState<WorkflowTemplate | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingNode, setEditingNode] = useState<WorkflowNodeType | null>(null)
  const [showNodeLibrary, setShowNodeLibrary] = useState(false)
  const [deleteConfirmNode, setDeleteConfirmNode] = useState<WorkflowNodeType | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  useEffect(() => {
    if (templateOverride) {
      setTemplate(templateOverride)
    } else {
      const existing = getOrCreateWorkflowTemplate(courseType)
      setTemplate(existing)
    }
    setError(null)
  }, [courseType, templateOverride])

  const handleSave = useCallback(() => {
    if (!template) return
    saveWorkflowTemplate({
      courseType: template.courseType,
      name: template.name,
      nodes: template.nodes,
    }, template.id)
    const label = COURSE_TYPE_LABELS[template.courseType]
    toast.success('工作流已同步', {
      description: `${label}课程课中工作流已同步至仪表盘分班待办中心`,
      duration: 3000,
    })
    onTemplateChange?.(template)
  }, [template, onTemplateChange])

  const handleToggle = useCallback((nodeId: string) => {
    if (!template) return
    const node = template.nodes.find((n) => n.id === nodeId)
    if (!node) return
    const updated = updateWorkflowNode(template.id, nodeId, { enabled: !node.enabled })
    if (updated) {
      setTemplate(updated)
    }
  }, [template])

  const handleDelete = useCallback((nodeId: string) => {
    if (!template) return
    const node = template.nodes.find((n) => n.id === nodeId)
    if (node) {
      setDeleteConfirmNode({ ...node })
    }
  }, [template])

  const handleConfirmDelete = useCallback(() => {
    if (!template || !deleteConfirmNode) return

    if (template.nodes.length <= 1) {
      setError('工作流至少需要保留一个节点')
      setTimeout(() => setError(null), 2000)
      setDeleteConfirmNode(null)
      return
    }

    const updated = deleteWorkflowNode(template.id, deleteConfirmNode.id)
    if (updated) {
      setTemplate(updated)
    }
    setDeleteConfirmNode(null)
  }, [template, deleteConfirmNode])

  const handleEdit = useCallback((nodeId: string) => {
    if (!template) return
    const node = template.nodes.find((n) => n.id === nodeId)
    if (node) setEditingNode({ ...node })
  }, [template])

  const handleEditSave = useCallback((updates: Partial<WorkflowNodeType>) => {
    if (!template || !editingNode) return
    const updated = updateWorkflowNode(template.id, editingNode.id, updates)
    if (updated) {
      setTemplate(updated)
    }
    setEditingNode(null)
  }, [template, editingNode])

  const handleDragStart = useCallback((nodeId: string) => {
    setDraggingId(nodeId)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault()
    setDragOverId(nodeId)
  }, [])

  const handleDragEnd = useCallback(() => {
    if (!template || !draggingId || !dragOverId || draggingId === dragOverId) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    const nodeIds = template.nodes
      .sort((a, b) => a.order - b.order)
      .map((n) => n.id)

    const fromIndex = nodeIds.indexOf(draggingId)
    const toIndex = nodeIds.indexOf(dragOverId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggingId(null)
      setDragOverId(null)
      return
    }

    nodeIds.splice(fromIndex, 1)
    nodeIds.splice(toIndex, 0, draggingId)

    const updated = reorderWorkflowNodes(template.id, nodeIds)
    if (updated) {
      setTemplate(updated)
    }

    setDraggingId(null)
    setDragOverId(null)
  }, [template, draggingId, dragOverId])

  const handleReset = useCallback(() => {
    if (!template) return
    setShowResetConfirm(true)
  }, [template])

  const handleConfirmReset = useCallback(() => {
    if (!template) return
    const updated = resetWorkflowTemplate(template.id)
    if (updated) {
      setTemplate(updated)
    }
    setShowResetConfirm(false)
  }, [template])

  const handleOpenNodeLibrary = useCallback(() => {
    setShowNodeLibrary(true)
  }, [])

  const handleSelectPreset = useCallback((type: WorkflowNodeTypeEnum) => {
    if (!template) return

    const newNode: WorkflowNodeType = {
      id: generateId(),
      type,
      enabled: true,
      order: template.nodes.length,
      nodeCategory: 'required',
      countInTodo: true,
      isCustom: false,
    }

    const updatedNodes = [...template.nodes, newNode]
    const updated = saveWorkflowTemplate({
      courseType: template.courseType,
      name: template.name,
      nodes: updatedNodes,
    }, template.id)
    setTemplate(updated)
    setShowNodeLibrary(false)
  }, [template])

  const handleCreateCustom = useCallback((name: string, icon: string, description: string) => {
    if (!template) return

    const newNode: WorkflowNodeType = {
      id: generateId(),
      type: 'custom',
      enabled: true,
      order: template.nodes.length,
      customName: name,
      customIcon: icon,
      description,
      nodeCategory: 'required',
      countInTodo: true,
      isCustom: true,
    }

    const updatedNodes = [...template.nodes, newNode]
    const updated = saveWorkflowTemplate({
      courseType: template.courseType,
      name: template.name,
      nodes: updatedNodes,
    }, template.id)
    setTemplate(updated)
    setShowNodeLibrary(false)
  }, [template])

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-gray-400">加载工作流...</div>
      </div>
    )
  }

  const sortedNodes = [...template.nodes].sort((a, b) => a.order - b.order)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {template.name}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {sortedNodes.filter((n) => n.enabled).length}/{sortedNodes.length} 个节点已启用
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={handleOpenNodeLibrary}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium
              text-indigo-600 bg-indigo-50 hover:bg-indigo-100
              rounded-xl transition-all duration-200
              border border-indigo-200/50"
          >
            <Plus size={15} />
            <span>添加节点</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium
              text-gray-500 bg-gray-50 hover:bg-gray-100
              rounded-xl transition-all duration-200
              border border-gray-200/50"
          >
            <RotateCcw size={15} />
            <span>重置</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
              text-white bg-gradient-to-r from-indigo-500 to-purple-500
              hover:from-indigo-600 hover:to-purple-600
              rounded-xl transition-all duration-200 shadow-sm"
          >
            <Save size={15} />
            <span>保存</span>
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium"
        >
          {error}
        </motion.div>
      )}

      <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={16} className="text-indigo-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            课中工作流程 · {template.isCustom ? (template.courseLabel || '自定义') : COURSE_TYPE_LABELS[courseType]}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <AnimatePresence mode="popLayout">
            {sortedNodes.map((node, index) => (
              <motion.div
                key={node.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <WorkflowNode
                  node={node}
                  index={index}
                  total={sortedNodes.length}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingId === node.id}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {sortedNodes.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">暂无工作流节点</p>
              <button
                onClick={handleOpenNodeLibrary}
                className="mt-2 text-indigo-500 hover:text-indigo-600 text-sm font-medium"
              >
                点击添加节点
              </button>
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>拖拽调整节点顺序</span>
            <span>点击编辑修改节点属性</span>
            <span>保存后自动同步至待办中心</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {editingNode && (
          <EditNodeModal
            node={editingNode}
            onSave={handleEditSave}
            onClose={() => setEditingNode(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmNode && (
          <ConfirmDialog
            title="删除节点"
            message={`确定要删除「${deleteConfirmNode.customName || WORKFLOW_NODE_LABELS[deleteConfirmNode.type] || '自定义节点'}」吗？删除后可通过「添加节点」重新添加。`}
            confirmText="确认删除"
            cancelText="取消"
            variant="danger"
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteConfirmNode(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <ConfirmDialog
            title="重置工作流"
            message="确定要重置此工作流为默认配置吗？所有自定义修改将被清除，系统预设节点将恢复默认。"
            confirmText="确认重置"
            cancelText="取消"
            variant="danger"
            onConfirm={handleConfirmReset}
            onCancel={() => setShowResetConfirm(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNodeLibrary && (
          <NodeLibraryPanel
            existingTypes={new Set(template.nodes.map((n) => n.type))}
            onSelectPreset={handleSelectPreset}
            onCreateCustom={handleCreateCustom}
            onClose={() => setShowNodeLibrary(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
