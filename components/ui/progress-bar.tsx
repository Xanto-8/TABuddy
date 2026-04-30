'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient'
}

const variantClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  gradient: 'bg-gradient-to-r from-primary to-secondary',
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  size = 'md',
  variant = 'default',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  return (
    <div className="space-y-2">
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', sizeClasses[size], className)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            variantClasses[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">进度</span>
          <span className="font-medium">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  )
}