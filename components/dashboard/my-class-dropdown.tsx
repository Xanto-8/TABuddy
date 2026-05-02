'use client'

import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Users, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Class } from '@/types'
import { getClasses, getClassTypeLabel, getClassTypeColor } from '@/lib/store'

export function MyClassDropdown() {
  const [classes, setClasses] = useState<Class[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})

  const refreshClasses = useCallback(() => {
    setClasses([...getClasses()])
  }, [])

  useEffect(() => {
    refreshClasses()
  }, [refreshClasses])

  useEffect(() => {
    const handleStorageChange = () => {
      refreshClasses()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('classDataChanged', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('classDataChanged', handleStorageChange)
    }
  }, [refreshClasses])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  // 计算面板位置：基于按钮的 getBoundingClientRect，使用 position:fixed 脱离父容器
  const updatePosition = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPanelStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        right: `${window.innerWidth - rect.right}px`,
        width: '320px',
        maxWidth: '90vw',
        maxHeight: 'calc(100vh - 40px)',
        zIndex: 99999,
      })
    }
  }, [])

  // 组件挂载时立即计算位置，不依赖鼠标交互，确保刷新后面板定位正确
  useLayoutEffect(() => {
    updatePosition()
  }, [updatePosition])

  // 窗口大小变化时重新计算位置
  useEffect(() => {
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [updatePosition])

  const handleToggle = () => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen((prev) => !prev)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    // 悬浮时先计算位置再显示，确保位置始终正确
    updatePosition()
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 100)
  }

  const displayText = classes.length === 0 ? '0 个班级' : `${classes.length} 个班级`

  return (
    <div
      ref={containerRef}
      className="inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={handleToggle}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer',
          'bg-background/50 border-border hover:bg-accent hover:border-primary/50',
          isOpen && 'bg-accent border-primary/50'
        )}
      >
        <BookOpen className="h-4 w-4 text-secondary shrink-0" />
        <span className="text-sm font-medium text-foreground select-none">
          {displayText}
        </span>
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {/* 使用 position:fixed 脱离父容器，避免被父容器的 overflow:hidden 裁剪 */}
      {/* useLayoutEffect 在组件挂载时初始化位置，鼠标悬浮时重新计算确保滚动后位置正确 */}
      <div
        ref={panelRef}
        style={panelStyle}
        className={cn(
          'rounded-xl border border-border/60 overflow-hidden',
          'bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(15,23,42,0.85)]',
          'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
          'backdrop-blur-[12px]',
          'transition-all duration-200 ease-out',
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 translate-y-[-10px] scale-95 pointer-events-none'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-foreground">我的班级</span>
          </div>
          <Link
            href="/classes"
            onClick={handleClose}
            className="text-xs text-primary hover:text-primary/80 transition-colors font-medium shrink-0"
          >
            查看全部
          </Link>
        </div>

        <div className="max-h-64 overflow-y-auto scrollbar-thin">
          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
                <Users className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">还没有创建班级</p>
              <Link
                href="/classes"
                onClick={handleClose}
                className="inline-flex items-center px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium"
              >
                去创建
              </Link>
            </div>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {classes.map((cls) => (
                <Link
                  key={cls.id}
                  href={`/classes/${cls.id}`}
                  onClick={handleClose}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors group/item"
                >
                  <div className="p-1.5 rounded-lg bg-primary/5 shrink-0">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {cls.name}
                      </span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
                          getClassTypeColor(cls.type)
                        )}
                      >
                        {getClassTypeLabel(cls.type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Users className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground">
                        {cls.studentCount} 名学生
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -ml-2 group-hover/item:opacity-100 group-hover/item:ml-0 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
