'use client'

import React, { createContext, useContext, useRef, useCallback, useEffect, type ReactNode } from 'react'
import { useRegisterShortcut } from './shortcut-context'

type CopyHandler = () => void

interface CopyShortcutContextType {
  registerCopyHandler: (id: string, handler: CopyHandler) => void
  unregisterCopyHandler: (id: string) => void
}

const CopyShortcutContext = createContext<CopyShortcutContextType | null>(null)

export function CopyShortcutProvider({ children }: { children: ReactNode }) {
  const handlersRef = useRef<Map<string, CopyHandler>>(new Map())

  useRegisterShortcut('action-copy', () => {
    const handlers = Array.from(handlersRef.current.entries())
    if (handlers.length === 0) return
    const latest = handlers[handlers.length - 1][1]
    latest()
  })

  const registerCopyHandler = useCallback((id: string, handler: CopyHandler) => {
    handlersRef.current.set(id, handler)
  }, [])

  const unregisterCopyHandler = useCallback((id: string) => {
    handlersRef.current.delete(id)
  }, [])

  return (
    <CopyShortcutContext.Provider value={{ registerCopyHandler, unregisterCopyHandler }}>
      {children}
    </CopyShortcutContext.Provider>
  )
}

export function useCopyShortcut(id: string, handler: CopyHandler) {
  const ctx = useContext(CopyShortcutContext)
  if (!ctx) throw new Error('useCopyShortcut must be used within CopyShortcutProvider')
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    ctx.registerCopyHandler(id, () => handlerRef.current())
    return () => ctx.unregisterCopyHandler(id)
  }, [id, ctx])
}
