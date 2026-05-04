'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextType | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within a Tabs provider')
  return ctx
}

interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn('flex border-b border-border', className)} role="tablist">
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabsContext()
  const isActive = selectedValue === value

  const handleClick = useCallback(() => {
    onValueChange(value)
  }, [onValueChange, value])

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={handleClick}
      className={cn(
        'px-4 py-2.5 text-sm font-medium transition-all relative',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
      )}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  if (selectedValue !== value) return null

  return (
    <div
      role="tabpanel"
      data-state={selectedValue === value ? 'active' : 'inactive'}
      className={cn('pt-4', className)}
    >
      {children}
    </div>
  )
}
