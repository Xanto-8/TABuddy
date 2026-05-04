'use client'

import React, { useState, useEffect } from 'react'
import { Users, ChevronDown, Check } from 'lucide-react'
import {
  getBoundTeachers,
  getSelectedTeacherId,
  setSelectedTeacherId,
} from '@/lib/store'
import { cn } from '@/lib/utils'

export function TeacherSwitcher() {
  const [open, setOpen] = useState(false)
  const [teachers, setTeachers] = useState<{ id: string; username: string; displayName: string }[]>([])
  const [selectedId, setSelectedIdState] = useState<string | null>(null)

  const refresh = () => {
    setTeachers(getBoundTeachers())
    setSelectedIdState(getSelectedTeacherId())
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener('classDataChanged', handler)
    window.addEventListener('teacherChanged', handler)
    return () => {
      window.removeEventListener('classDataChanged', handler)
      window.removeEventListener('teacherChanged', handler)
    }
  }, [])

  const handleSelect = (teacherId: string | null) => {
    setSelectedTeacherId(teacherId)
    setSelectedIdState(teacherId)
    setOpen(false)
  }

  const selectedTeacher = teachers.find(t => t.id === selectedId)
  const displayName = selectedId && selectedTeacher
    ? selectedTeacher.displayName || selectedTeacher.username
    : '全部班级'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:border-primary/30 hover:bg-accent/50 transition-all text-sm"
      >
        <Users className="w-4 h-4 text-primary" />
        <span className="font-medium text-foreground">{displayName}</span>
        {teachers.length > 1 && (
          <ChevronDown className={cn(
            'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )} />
        )}
      </button>

      {open && teachers.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 w-64 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
            <div className="p-2">
              <button
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  !selectedId
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">全部班级</p>
                  <p className="text-xs text-muted-foreground">查看所有绑定老师的班级</p>
                </div>
                {!selectedId && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>

              <div className="my-1 border-t border-border" />

              {teachers.map((t) => {
                const isSelected = t.id === selectedId
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {(t.displayName || t.username).charAt(0)}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{t.displayName || t.username}</p>
                      <p className="text-xs text-muted-foreground">{t.username}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
