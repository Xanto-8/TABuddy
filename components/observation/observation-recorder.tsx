'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PenLine, X, Trash2, Search, GripHorizontal, Clock, Users } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getClasses, getStudentsByClass, getCurrentClassByTime, getObservationRecords, saveObservationRecord, deleteObservationRecord } from '@/lib/store'
import type { Class, Student, ObservationRecord } from '@/types'

export function ObservationRecorder() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [records, setRecords] = useState<ObservationRecord[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [currentClass, setCurrentClass] = useState<Class | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState('')
  const [showClassPicker, setShowClassPicker] = useState(false)
  const [tick, setTick] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const syncCurrentClass = useCallback((force = false) => {
    const allClasses = getClasses()
    setClasses(allClasses)
    const active = getCurrentClassByTime()
    if (active) {
      setCurrentClass(active)
      if (!selectedClassId || force || selectedClassId !== active.id) {
        setSelectedClassId(active.id)
        const classStudents = getStudentsByClass(active.id)
        setStudents(classStudents)
        if (!selectedStudent || force) {
          setSelectedStudent(null)
        }
      }
    } else if (force || !selectedClassId) {
      setCurrentClass(null)
      setStudents([])
      setSelectedStudent(null)
    }
  }, [selectedClassId, selectedStudent])

  useEffect(() => {
    syncCurrentClass(true)
    const interval = setInterval(() => syncCurrentClass(), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedClassId) {
      const allRecords = getObservationRecords(selectedClassId, selectedStudent?.id)
      setRecords(allRecords)
    }
  }, [selectedClassId, selectedStudent?.id, tick])

  const handleClassSelect = useCallback((classId: string) => {
    if (!classId) {
      setSelectedClassId('')
      setStudents([])
      setSelectedStudent(null)
      setShowClassPicker(false)
      return
    }
    setSelectedClassId(classId)
    const cls = classes.find(c => c.id === classId)
    if (cls) {
      setCurrentClass(cls)
      const classStudents = getStudentsByClass(classId)
      setStudents(classStudents)
    }
    setSelectedStudent(null)
    setShowClassPicker(false)
  }, [classes])

  const handleSave = useCallback(() => {
    if (!inputValue.trim() || !selectedStudent) return
    const cls = classes.find(c => c.id === selectedClassId)
    saveObservationRecord({
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      className: cls?.name || '',
      content: inputValue.trim(),
    })
    setInputValue('')
    setTick(t => t + 1)
    toast.success('记录已保存')
    inputRef.current?.focus()
  }, [inputValue, selectedStudent, selectedClassId, classes])

  const handleDelete = useCallback((id: string) => {
    deleteObservationRecord(id)
    setTick(t => t + 1)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
  }, [handleSave])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!panelRef.current) return
    setIsDragging(true)
    const rect = panelRef.current.getBoundingClientRect()
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y })
    }
    const handleMouseUp = () => setIsDragging(false)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students
    return students.filter(s => s.name.includes(searchQuery))
  }, [students, searchQuery])

  const formatTime = (d: Date) => {
    const date = new Date(d)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const toggleButton = (
    <button
      onClick={() => {
        setIsOpen(!isOpen)
        if (!isOpen) syncCurrentClass()
        setTick(t => t + 1)
      }}
      className={cn(
        'fixed right-20 bottom-6 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all',
        isOpen
          ? 'bg-primary text-primary-foreground'
          : currentClass
            ? 'bg-amber-500 text-white animate-pulse-subtle'
            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50'
      )}
      title={currentClass ? `正在记录：${currentClass.name}` : '随堂记录'}
    >
      <PenLine className="h-5 w-5" />
    </button>
  )

  return (
    <>
      {toggleButton}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            style={position.x ? { position: 'fixed', left: position.x, top: position.y } : {}}
            className={cn(
              'fixed right-20 bottom-20 z-50 w-80 max-h-[520px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden',
              !position.x && 'right-20 bottom-20'
            )}
          >
            <div
              onMouseDown={handleMouseDown}
              className="flex items-center justify-between px-4 py-3 border-b border-border cursor-grab active:cursor-grabbing select-none shrink-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-semibold text-foreground">随堂记录</span>
                {currentClass && (
                  <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                    {currentClass.name}
                  </span>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-4 py-2 border-b border-border/50 shrink-0">
              {currentClass ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-xs text-primary font-medium truncate">
                      正在上课：{currentClass.name}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {currentClass.type}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowClassPicker(!showClassPicker)}
                    className="text-[10px] text-muted-foreground hover:text-foreground underline shrink-0"
                  >
                    切换
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>当前没有上课班级</span>
                </div>
              )}
            </div>

            <AnimatePresence>
              {(!currentClass || showClassPicker) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-2 border-b border-border/50 shrink-0 overflow-hidden"
                >
                  <select
                    value={selectedClassId}
                    onChange={(e) => handleClassSelect(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">手动选择班级...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} · {c.type}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {!selectedClassId ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2">
                <Users className="h-8 w-8 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground">
                  {currentClass ? '已自动选中上课班级，选择学生开始记录' : '请选择班级开始记录'}
                </span>
              </div>
            ) : (
              <>
                <div className="px-4 py-2 border-b border-border/50 shrink-0">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="搜索学生..."
                      className="w-full rounded-lg border border-border bg-background pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  {filteredStudents.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
                      {filteredStudents.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedStudent(s); setTick(t => t + 1) }}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                            selectedStudent?.id === s.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-foreground'
                          )}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground py-2 text-center">
                      暂无学生
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2 min-h-[100px] max-h-[180px]">
                  {selectedStudent ? (
                    records.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        暂无 {selectedStudent.name} 的记录
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {records.map(r => (
                          <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground break-words">{r.content}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{formatTime(r.createdAt)}</p>
                            </div>
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-4">
                      点击上方学生开始记录
                    </div>
                  )}
                </div>

                <div className="px-4 py-3 border-t border-border shrink-0">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={selectedStudent ? `记录 ${selectedStudent.name} 的表现...` : '请先选择学生'}
                      disabled={!selectedStudent}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSave}
                      disabled={!inputValue.trim() || !selectedStudent}
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                    >
                      保存
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Enter 保存 · Shift+Enter 换行</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
