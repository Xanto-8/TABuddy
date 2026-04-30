'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  className?: string
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        'w-full max-w-[1200px] mx-auto p-4 sm:p-6',
        'box-border',
        className
      )}
      style={{ width: '100%' }}
    >
      {children}
    </div>
  )
}
