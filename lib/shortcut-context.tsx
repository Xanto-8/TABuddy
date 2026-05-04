'use client'

import React, { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { useShortcutStore, getKeysFromEvent } from './shortcut-store'

type ShortcutHandler = (e: KeyboardEvent) => void

interface ShortcutContextType {
  registerHandler: (id: string, handler: ShortcutHandler) => void
  unregisterHandler: (id: string) => void
}

const ShortcutContext = createContext<ShortcutContextType | null>(null)

const LIST_SHORTCUT_IDS = ['list-up', 'list-down', 'list-enter']

function isInputFocused(): boolean {
  const active = document.activeElement
  if (!active) return false
  const tag = active.tagName.toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true
  if ((active as HTMLElement).isContentEditable) return true
  return false
}

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const { shortcuts } = useShortcutStore()
  const handlersRef = useRef<Map<string, ShortcutHandler>>(new Map())

  const registerHandler = useCallback((id: string, handler: ShortcutHandler) => {
    handlersRef.current.set(id, handler)
  }, [])

  const unregisterHandler = useCallback((id: string) => {
    handlersRef.current.delete(id)
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isInInput = isInputFocused()
      const pressedKeys = getKeysFromEvent(e)

      for (const shortcut of shortcuts) {
        const shortcutKeys = shortcut.keys
        if (shortcutKeys.length !== pressedKeys.length) continue

        const normShortcut = shortcutKeys.map(k => k.toLowerCase()).sort().join('|')
        const normPressed = pressedKeys.map(k => k.toLowerCase()).sort().join('|')

        if (normShortcut !== normPressed) continue

        if (isInInput && LIST_SHORTCUT_IDS.includes(shortcut.id)) {
          return
        }

        e.preventDefault()
        e.stopPropagation()

        const handler = handlersRef.current.get(shortcut.id)
        if (handler) {
          handler(e)
        }
        return
      }
    }

    function handleMouseDown(e: MouseEvent) {
      const isInInput = isInputFocused()
      const buttonMap: Record<number, string> = {
        3: 'XButton1',
        4: 'XButton2',
      }
      const keyName = buttonMap[e.button]
      if (!keyName) return

      for (const shortcut of shortcuts) {
        const shortcutKeys = shortcut.keys
        if (shortcutKeys.length !== 1) continue
        if (shortcutKeys[0] !== keyName) continue

        if (isInInput && LIST_SHORTCUT_IDS.includes(shortcut.id)) {
          return
        }

        e.preventDefault()

        const handler = handlersRef.current.get(shortcut.id)
        if (handler) {
          handler(new KeyboardEvent('keydown', { key: keyName }))
        }
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    document.addEventListener('mousedown', handleMouseDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.removeEventListener('mousedown', handleMouseDown, true)
    }
  }, [shortcuts])

  return (
    <ShortcutContext.Provider value={{ registerHandler, unregisterHandler }}>
      {children}
    </ShortcutContext.Provider>
  )
}

export function useShortcutHandler() {
  const ctx = useContext(ShortcutContext)
  if (!ctx) throw new Error('useShortcutHandler must be used within ShortcutProvider')
  return ctx
}

export function useRegisterShortcut(id: string, handler: ShortcutHandler) {
  const { registerHandler, unregisterHandler } = useShortcutHandler()
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    const wrappedHandler = (e: KeyboardEvent) => handlerRef.current(e)
    registerHandler(id, wrappedHandler)
    return () => unregisterHandler(id)
  }, [id, registerHandler, unregisterHandler])
}
