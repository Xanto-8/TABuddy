'use client'

import React, { useRef, useEffect } from 'react'
import { BookOpen, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Class } from '@/types'

interface ClassSelectorProps {
  classes: Class[]
  selectedClassId: string
  onChange: (classId: string) => void
  isTeachingClass: (classId: string) => boolean
  isLoading?: boolean
  buttonClassName?: string
  align?: 'left' | 'right'
}

export function ClassSelector({
  classes,
  selectedClassId,
  onChange,
  isTeachingClass,
  isLoading,
  buttonClassName,
  align = 'left',
}: ClassSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedClass = classes.find(c => c.id === selectedClassId)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className={cn(
          'inline-flex items-center px-4 py-2.5 rounded-lg border border-border bg-background text-foreground hover:bg-accent/50 transition-all text-sm font-medium cursor-pointer',
          buttonClassName,
        )}
      >
        <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
        <span>
          {selectedClass ? selectedClass.name : '选择班级'}
          {selectedClass && isTeachingClass(selectedClass.id) && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              正在上课
            </span>
          )}
        </span>
        <ChevronDown className={cn('h-4 w-4 ml-2 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-full mt-1 z-50 min-w-[200px]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <div className="rounded-xl border border-border bg-background/95 backdrop-blur-sm shadow-2xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto">
                {classes.map((cls) => (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => { onChange(cls.id); setOpen(false) }}
                    className={cn(
                      'w-full px-4 py-3 text-left text-sm transition-all hover:bg-accent flex items-center justify-between',
                      selectedClassId === cls.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground',
                    )}
                  >
                    <span>
                      {cls.name}
                      {isTeachingClass(cls.id) && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          正在上课
                        </span>
                      )}
                    </span>
                    {selectedClassId === cls.id && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
