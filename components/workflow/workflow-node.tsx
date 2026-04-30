'use client'

import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2, XCircle, GripVertical, Trash2, Pencil,
} from 'lucide-react'
import type { WorkflowNode as WorkflowNodeType, WorkflowNodeType as WorkflowNodeTypeEnum } from '@/types'
import { WORKFLOW_NODE_LABELS, WORKFLOW_NODE_ICONS } from '@/types'
import { cn } from '@/lib/utils'

const NODE_COLORS: Record<string, { bg: string; border: string; dot: string }> = {
  grade_homework: { bg: 'from-blue-50 to-blue-100/50', border: 'border-blue-200', dot: 'bg-blue-500' },
  homework_feedback: { bg: 'from-emerald-50 to-emerald-100/50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  grade_quiz: { bg: 'from-violet-50 to-violet-100/50', border: 'border-violet-200', dot: 'bg-violet-500' },
  quiz_analysis: { bg: 'from-amber-50 to-amber-100/50', border: 'border-amber-200', dot: 'bg-amber-500' },
  course_feedback: { bg: 'from-rose-50 to-rose-100/50', border: 'border-rose-200', dot: 'bg-rose-500' },
  send_content: { bg: 'from-cyan-50 to-cyan-100/50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  send_homework: { bg: 'from-orange-50 to-orange-100/50', border: 'border-orange-200', dot: 'bg-orange-500' },
  sync_quiz: { bg: 'from-purple-50 to-purple-100/50', border: 'border-purple-200', dot: 'bg-purple-500' },
  retest_list: { bg: 'from-red-50 to-red-100/50', border: 'border-red-200', dot: 'bg-red-500' },
  custom: { bg: 'from-gray-50 to-gray-100/50', border: 'border-gray-300', dot: 'bg-gray-500' },
}

const CUSTOM_AVATAR_COLORS = [
  { bg: 'from-pink-50 to-pink-100/50', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'from-teal-50 to-teal-100/50', border: 'border-teal-200', dot: 'bg-teal-500' },
  { bg: 'from-indigo-50 to-indigo-100/50', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  { bg: 'from-sky-50 to-sky-100/50', border: 'border-sky-200', dot: 'bg-sky-500' },
  { bg: 'from-lime-50 to-lime-100/50', border: 'border-lime-200', dot: 'bg-lime-500' },
  { bg: 'from-yellow-50 to-yellow-100/50', border: 'border-yellow-200', dot: 'bg-yellow-500' },
]

function getCustomNodeColor(nodeId: string) {
  let hash = 0
  for (let i = 0; i < nodeId.length; i++) {
    hash = nodeId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CUSTOM_AVATAR_COLORS[Math.abs(hash) % CUSTOM_AVATAR_COLORS.length]
}

interface WorkflowNodeProps {
  node: WorkflowNodeType
  index: number
  total: number
  onToggle: (nodeId: string) => void
  onDelete: (nodeId: string) => void
  onEdit: (nodeId: string) => void
  onDragStart: (nodeId: string) => void
  onDragOver: (e: React.DragEvent, nodeId: string) => void
  onDragEnd: () => void
  isDragging: boolean
}

export function WorkflowNode({
  node,
  index,
  total,
  onToggle,
  onDelete,
  onEdit,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
}: WorkflowNodeProps) {
  const colors = node.type === 'custom'
    ? getCustomNodeColor(node.id)
    : NODE_COLORS[node.type] || NODE_COLORS.custom

  const displayName = node.customName || WORKFLOW_NODE_LABELS[node.type] || '自定义节点'
  const displayIcon = node.customIcon || WORKFLOW_NODE_ICONS[node.type] || '⚡'
  const displayCategory = node.nodeCategory === 'optional' ? '可选' : '必填'

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        layout
        draggable
        onDragStart={() => onDragStart(node.id)}
        onDragOver={(e) => onDragOver(e, node.id)}
        onDragEnd={onDragEnd}
        className={cn(
          'relative group cursor-grab active:cursor-grabbing',
          'w-[360px] rounded-xl border-2',
          'bg-gradient-to-br shadow-sm hover:shadow-md',
          'transition-all duration-200',
          colors.bg, colors.border,
          !node.enabled && 'opacity-55 grayscale-[0.3]',
          isDragging && 'opacity-50 scale-95 shadow-lg',
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {node.isCustom && (
          <div className="absolute -top-2.5 -right-2.5 z-10">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-sm">
              自定义
            </span>
          </div>
        )}

        {node.nodeCategory === 'optional' && (
          <div className="absolute -top-2.5 left-3 z-10">
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shadow-sm">
              可选
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors">
            <GripVertical size={18} />
          </div>

          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center text-lg',
            'shadow-sm border border-white/50',
            node.enabled
              ? colors.dot.replace('bg-', 'bg-').replace('-500', '-100') + ' ' + colors.dot.replace('bg-', 'text-').replace('-500', '-600')
              : 'bg-gray-100 text-gray-400'
          )}>
            {displayIcon}
          </div>

          <div className="flex-1 min-w-0">
            <p className={cn(
              'text-sm font-semibold truncate',
              node.enabled ? 'text-gray-800' : 'text-gray-400'
            )}>
              {displayName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 whitespace-nowrap">
              <span>{node.enabled ? '已启用' : '已关闭'}</span>
              <span>·</span>
              <span>{displayCategory}</span>
              {node.countInTodo !== false && (
                <>
                  <span>·</span>
                  <span>计入待办</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(node.id) }}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                'text-gray-400 hover:bg-indigo-50 hover:text-indigo-500'
              )}
              title="编辑节点"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => onToggle(node.id)}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                node.enabled
                  ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600'
                  : 'text-gray-300 hover:bg-gray-100 hover:text-gray-400'
              )}
              title={node.enabled ? '关闭此节点' : '开启此节点'}
            >
              {node.enabled ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </button>

            <button
              onClick={() => onDelete(node.id)}
              className={cn(
                'p-1.5 rounded-lg transition-all duration-200',
                'text-gray-400 hover:bg-red-50 hover:text-red-500'
              )}
              title="删除此节点"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {index < total - 1 && (
        <div className="flex flex-col items-center py-1">
          <svg width="24" height="32" viewBox="0 0 24 32" className="text-gray-300">
            <line x1="12" y1="0" x2="12" y2="32" stroke="currentColor" strokeWidth="2" strokeDasharray="4,3" />
            <polygon points="8,24 12,32 16,24" fill="currentColor" />
          </svg>
        </div>
      )}
    </div>
  )
}
