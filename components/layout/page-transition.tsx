'use client'

import { usePathname } from 'next/navigation'
import { ReactNode, useEffect, useRef } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    el.classList.remove('page-enter-active')
    el.classList.add('page-exit-active')

    const exitDuration = 80
    setTimeout(() => {
      el.classList.remove('page-exit-active')
      el.classList.add('page-enter-active')
    }, exitDuration)

    const enterDuration = 150
    setTimeout(() => {
      el.classList.remove('page-enter-active')
    }, exitDuration + enterDuration)
  }, [pathname])

  return (
    <div
      ref={containerRef}
      className="w-full relative z-10 page-enter-active"
      style={{
        willChange: 'opacity',
      }}
    >
      {children}
    </div>
  )
}
