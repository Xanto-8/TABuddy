'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const SIDEBAR_STORAGE_KEY = 'tabuddy_sidebar_open'
const DESKTOP_BREAKPOINT = 1200

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  setOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsOpen(stored === 'true')
    } else {
      setIsOpen(window.innerWidth >= DESKTOP_BREAKPOINT)
    }
  }, [])

  const toggle = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next))
      return next
    })
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setIsOpen(open)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open))
  }, [])

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}
