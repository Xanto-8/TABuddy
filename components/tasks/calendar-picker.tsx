'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react'
import { getClassSchedules, isMarkedDay } from '@/lib/store'
import { cn } from '@/lib/utils'

interface CalendarPickerProps {
  value: string
  onChange: (date: string) => void
  classId: string
}

function getDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDateStr(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

function formatDisplay(dateStr: string): string {
  if (!dateStr) return '选择日期'
  const d = parseDateStr(dateStr)
  const weekNames = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 周${weekNames[d.getDay()]}`
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function CalendarPicker({ value, onChange, classId }: CalendarPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const today = useMemo(() => getTodayStr(), [])

  const initialDate = value || today
  const initialDateObj = parseDateStr(initialDate)
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth())

  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const schedules = useMemo(() => getClassSchedules(classId), [classId])
  const classDayOfWeeks = useMemo(() => schedules.map(s => s.dayOfWeek), [schedules])

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d)
  }

  const hasClassOnDate = (day: number): boolean => {
    const dateStr = getDateStr(viewYear, viewMonth, day)
    const dateObj = parseDateStr(dateStr)
    const dayOfWeek = dateObj.getDay()
    return classDayOfWeeks.includes(dayOfWeek) || isMarkedDay(classId, dateStr)
  }

  const isSelectedDate = (day: number): boolean => {
    return value === getDateStr(viewYear, viewMonth, day)
  }

  const isTodayDate = (day: number): boolean => {
    return today === getDateStr(viewYear, viewMonth, day)
  }

  const handleSelectDay = (day: number) => {
    const dateStr = getDateStr(viewYear, viewMonth, day)
    onChange(dateStr)
    setIsOpen(false)
  }

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    onChange(today)
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setIsOpen(false)
  }

  const clearSelection = () => {
    onChange(today)
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setIsOpen(false)
  }

  const weekDayLabels = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm',
          'bg-background text-foreground border-border',
          'hover:bg-accent/50 hover:border-primary/30',
          'focus:outline-none focus:ring-2 focus:ring-primary/20',
          isOpen && 'border-primary/30 bg-accent/30'
        )}
      >
        <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-foreground">{formatDisplay(value)}</span>
        {isOpen && (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rotate-90 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50">
          <div
            className={cn(
              'w-[280px] rounded-2xl border shadow-2xl p-4',
              'bg-background/70 backdrop-blur-xl border-border/50'
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-foreground">
                {viewYear}年{viewMonth + 1}月
              </span>
              <button
                type="button"
                onClick={goToNextMonth}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {weekDayLabels.map((label) => (
                <div
                  key={label}
                  className="text-center text-xs font-medium text-muted-foreground py-1.5"
                >
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />
                }

                const selected = isSelectedDate(day)
                const isToday = isTodayDate(day)
                const hasClass = hasClassOnDate(day)

                return (
                  <div key={`day-${day}`} className="aspect-square p-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectDay(day)}
                      className={cn(
                        'relative w-full h-full rounded-xl text-sm font-medium flex flex-col items-center justify-center transition-all',
                        selected
                          ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                          : isToday
                            ? 'bg-primary/10 text-primary hover:bg-primary/15'
                            : 'text-foreground hover:bg-accent/50'
                      )}
                    >
                      <span className={cn(
                        'leading-none',
                        selected && 'font-semibold'
                      )}>
                        {day}
                      </span>
                      {hasClass && (
                        <span
                          className={cn(
                            'absolute bottom-1.5 w-1 h-1 rounded-full',
                            selected ? 'bg-primary-foreground/80' : 'bg-primary/60'
                          )}
                        />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
              <button
                type="button"
                onClick={goToToday}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-all px-2 py-1 rounded-lg hover:bg-primary/5"
              >
                今天
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-all px-2 py-1 rounded-lg hover:bg-accent/50"
              >
                <X className="h-3 w-3" />
                清除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
