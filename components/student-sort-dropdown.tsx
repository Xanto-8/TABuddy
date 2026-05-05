'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowUpDown, ChevronDown, GripVertical, Check, X, Trash2 } from 'lucide-react'
import { getStudentSortBy, setStudentSortBy, getStudentCustomOrder, setStudentCustomOrder } from '@/lib/store'
import type { StudentSortBy } from '@/lib/store'
import type { Student } from '@/types'
import { cn } from '@/lib/utils'

const sortOptions: { value: StudentSortBy; label: string }[] = [
  { value: 'createdAt', label: '导入顺序' },
  { value: 'custom', label: '自定义排序' },
]

interface Props {
  students?: Student[]
  classId?: string
}

export default function StudentSortDropdown({ students, classId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [sortBy, setSortBy] = useState<StudentSortBy>(getStudentSortBy())
  const [showReorder, setShowReorder] = useState(false)
  const [order, setOrder] = useState<Student[]>([])
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const reorderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = () => setSortBy(getStudentSortBy())
    window.addEventListener('studentSortChanged', handler)
    return () => window.removeEventListener('studentSortChanged', handler)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (showReorder && students && students.length > 0) {
      const customOrder = classId ? getStudentCustomOrder(classId) : []
      if (customOrder.length > 0) {
        const orderMap = new Map(customOrder.map((id, i) => [id, i]))
        const sorted = [...students].sort((a, b) => {
          const ai = orderMap.get(a.id)
          const bi = orderMap.get(b.id)
          if (ai === undefined && bi === undefined) return 0
          if (ai === undefined) return 1
          if (bi === undefined) return -1
          return ai - bi
        })
        setOrder(sorted)
      } else {
        setOrder([...students])
      }
    }
  }, [showReorder, students, classId])

  const handleChange = (value: StudentSortBy) => {
    if (value === 'custom') {
      if (students && students.length > 0) {
        setShowReorder(true)
      }
      setIsOpen(false)
      return
    }
    setStudentSortBy(value)
    setSortBy(value)
    setIsOpen(false)
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setOverIndex(index)
  }

  const handleDragLeave = () => {
    setOverIndex(null)
  }

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    setOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(index, 0, moved)
      return next
    })
    setDragIndex(null)
    setOverIndex(null)
  }

  const handleConfirmOrder = () => {
    if (!classId) return
    setStudentCustomOrder(classId, order.map(s => s.id))
    setStudentSortBy('custom')
    setSortBy('custom')
    setShowReorder(false)
  }

  const handleCancelOrder = () => {
    setShowReorder(false)
    setDragIndex(null)
    setOverIndex(null)
  }

  const currentLabel = sortOptions.find(o => o.value === sortBy)?.label || '排序'

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium whitespace-nowrap gap-1.5"
        >
          <ArrowUpDown className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        {isOpen && (
          <div className="absolute right-0 mt-1 z-50 w-44 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleChange(option.value)}
                className={cn(
                  'w-full px-3.5 py-2.5 text-sm text-left transition-colors flex items-center gap-2',
                  sortBy === option.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                {sortBy === option.value && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
                <span className={sortBy === option.value ? '' : 'ml-[14px]'}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {showReorder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleCancelOrder}>
          <div
            ref={reorderRef}
            className="bg-background rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">自定义排序</h3>
                <button
                  onClick={handleCancelOrder}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">拖拽学生列表调整顺序，确定后保存排序</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
              {order.map((student, index) => (
                <div
                  key={student.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card transition-all select-none',
                    dragIndex === index ? 'opacity-40 scale-95' : '',
                    overIndex === index && dragIndex !== index ? 'border-primary shadow-md scale-[1.02]' : '',
                  )}
                >
                  <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-0.5">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-primary">{student.name.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 min-w-0 truncate">{student.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">#{index + 1}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelOrder}
                className="inline-flex items-center px-4 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent/50 transition-all text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmOrder}
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
              >
                <Check className="h-4 w-4 mr-1.5" />
                确定排序
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
