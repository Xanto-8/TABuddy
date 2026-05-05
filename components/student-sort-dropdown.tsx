'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { getStudentSortBy, setStudentSortBy } from '@/lib/store'
import type { StudentSortBy } from '@/lib/store'
import { cn } from '@/lib/utils'

const sortOptions: { value: StudentSortBy; label: string }[] = [
  { value: 'createdAt', label: '导入顺序' },
  { value: 'name_asc', label: '姓名 A-Z' },
  { value: 'name_desc', label: '姓名 Z-A' },
]

export default function StudentSortDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [sortBy, setSortBy] = useState<StudentSortBy>(getStudentSortBy())
  const ref = useRef<HTMLDivElement>(null)

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

  const handleChange = (value: StudentSortBy) => {
    setStudentSortBy(value)
    setSortBy(value)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-3 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent transition-colors text-sm font-medium whitespace-nowrap gap-1.5"
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="hidden sm:inline">
          {sortOptions.find(o => o.value === sortBy)?.label}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-1 z-50 w-40 rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
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
  )
}
