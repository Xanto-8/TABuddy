'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export type ShortcutCategory = 'navigation' | 'list' | 'action'

export interface ShortcutAction {
  id: string
  label: string
  category: ShortcutCategory
  description: string
  defaultKeys: string[]
  keys: string[]
}

export const BROWSER_CONFLICTS: { keys: string[]; label: string }[] = [
  { keys: ['Control', 'c'], label: '复制 (Ctrl+C)' },
  { keys: ['Control', 'v'], label: '粘贴 (Ctrl+V)' },
  { keys: ['Control', 'x'], label: '剪切 (Ctrl+X)' },
  { keys: ['Control', 'z'], label: '撤销 (Ctrl+Z)' },
  { keys: ['Control', 'y'], label: '重做 (Ctrl+Y)' },
  { keys: ['Control', 'a'], label: '全选 (Ctrl+A)' },
  { keys: ['Control', 's'], label: '保存页面 (Ctrl+S)' },
  { keys: ['Control', 'p'], label: '打印 (Ctrl+P)' },
  { keys: ['Control', 'f'], label: '查找 (Ctrl+F)' },
  { keys: ['Control', 'o'], label: '打开 (Ctrl+O)' },
  { keys: ['Control', 'w'], label: '关闭标签页 (Ctrl+W)' },
  { keys: ['Control', 't'], label: '新建标签页 (Ctrl+T)' },
  { keys: ['Control', 'n'], label: '新建窗口 (Ctrl+N)' },
  { keys: ['Control', 'Shift', 'c'], label: '开发者工具 (Ctrl+Shift+C)' },
  { keys: ['Control', 'Shift', 'i'], label: '开发者工具 (Ctrl+Shift+I)' },
  { keys: ['Control', 'Shift', 'j'], label: '控制台 (Ctrl+Shift+J)' },
  { keys: ['Alt', 'ArrowLeft'], label: '浏览器后退 (Alt+←)' },
  { keys: ['Alt', 'ArrowRight'], label: '浏览器前进 (Alt+→)' },
  { keys: ['F1'], label: '浏览器帮助 (F1)' },
  { keys: ['F5'], label: '刷新 (F5)' },
  { keys: ['F12'], label: '开发者工具 (F12)' },
]

const DEFAULT_SHORTCUTS: ShortcutAction[] = [
  {
    id: 'nav-homework',
    label: '跳转作业管理',
    category: 'navigation',
    description: '一键跳转到作业管理页面',
    defaultKeys: ['Alt', '1'],
    keys: ['Alt', '1'],
  },
  {
    id: 'nav-quiz',
    label: '跳转随堂测验',
    category: 'navigation',
    description: '一键跳转到随堂测验页面',
    defaultKeys: ['Alt', '2'],
    keys: ['Alt', '2'],
  },
  {
    id: 'nav-feedback',
    label: '跳转反馈管理',
    category: 'navigation',
    description: '一键跳转到反馈管理页面',
    defaultKeys: ['Alt', '3'],
    keys: ['Alt', '3'],
  },
  {
    id: 'nav-classes',
    label: '跳转班级管理',
    category: 'navigation',
    description: '一键跳转到班级管理页面',
    defaultKeys: ['Alt', '4'],
    keys: ['Alt', '4'],
  },
  {
    id: 'list-up',
    label: '上移选中项',
    category: 'list',
    description: '在学生/班级列表中切换到上一个条目',
    defaultKeys: ['ArrowUp'],
    keys: ['ArrowUp'],
  },
  {
    id: 'list-down',
    label: '下移选中项',
    category: 'list',
    description: '在学生/班级列表中切换到下一个条目',
    defaultKeys: ['ArrowDown'],
    keys: ['ArrowDown'],
  },
  {
    id: 'list-enter',
    label: '进入详情',
    category: 'list',
    description: '进入选中学生/班级的详情页',
    defaultKeys: ['Enter'],
    keys: ['Enter'],
  },
  {
    id: 'action-copy',
    label: '一键复制',
    category: 'action',
    description: '一键复制当前页面的内容（反馈/成绩等）',
    defaultKeys: ['Control', 'Shift', 'c'],
    keys: ['Control', 'Shift', 'c'],
  },
  {
    id: 'action-save',
    label: '快速保存/提交',
    category: 'action',
    description: '保存或提交当前表单（作业、小测、反馈等）',
    defaultKeys: ['Control', 's'],
    keys: ['Control', 's'],
  },
  {
    id: 'action-search',
    label: '唤起全局搜索',
    category: 'action',
    description: '一键聚焦页面顶部的搜索框',
    defaultKeys: ['Control', 'k'],
    keys: ['Control', 'k'],
  },
]

const STORAGE_KEY = 'tabuddy_shortcuts'

function loadShortcuts(): ShortcutAction[] {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUTS.map(s => ({ ...s }))
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAULT_SHORTCUTS.map(s => ({ ...s }))
    const parsed = JSON.parse(stored) as Record<string, string[]>
    return DEFAULT_SHORTCUTS.map(s => ({
      ...s,
      keys: parsed[s.id] || [...s.defaultKeys],
    }))
  } catch {
    return DEFAULT_SHORTCUTS.map(s => ({ ...s }))
  }
}

function saveShortcuts(shortcuts: ShortcutAction[]) {
  if (typeof window === 'undefined') return
  const map: Record<string, string[]> = {}
  shortcuts.forEach(s => { map[s.id] = s.keys })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function formatKeysForDisplay(keys: string[]): string {
  return keys
    .map(k => {
      switch (k) {
        case 'Control': return 'Ctrl'
        case 'Shift': return 'Shift'
        case 'Alt': return 'Alt'
        case 'Meta': return '⌘'
        case 'ArrowUp': return '↑'
        case 'ArrowDown': return '↓'
        case 'ArrowLeft': return '←'
        case 'ArrowRight': return '→'
        case 'Enter': return 'Enter'
        case ' ': return 'Space'
        case 'Escape': return 'Esc'
        case 'XButton1': return '鼠标侧键(后退)'
        case 'XButton2': return '鼠标侧键(前进)'
        default: return k.length === 1 ? k.toUpperCase() : k
      }
    })
    .join(' + ')
}

function keysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const norm = (k: string) => k.toLowerCase()
  const sortedA = [...a].map(norm).sort()
  const sortedB = [...b].map(norm).sort()
  return sortedA.every((v, i) => v === sortedB[i])
}

export function findConflict(keys: string[]): { keys: string[]; label: string } | null {
  return BROWSER_CONFLICTS.find(c => keysEqual(c.keys, keys)) || null
}

export function getKeysFromEvent(e: KeyboardEvent | React.KeyboardEvent): string[] {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('Control')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  const key = e.key
  const ignoreKeys = ['Control', 'Alt', 'Shift', 'Meta']
  if (key && !ignoreKeys.includes(key)) {
    parts.push(key)
  }
  return parts
}

interface ShortcutContextType {
  shortcuts: ShortcutAction[]
  updateShortcut: (id: string, keys: string[]) => void
  resetToDefaults: () => void
  getShortcut: (id: string) => ShortcutAction | undefined
}

const ShortcutStoreContext = createContext<ShortcutContextType | null>(null)

export function ShortcutStoreProvider({ children }: { children: ReactNode }) {
  const [shortcuts, setShortcuts] = useState<ShortcutAction[]>([])

  useEffect(() => {
    setShortcuts(loadShortcuts())
  }, [])

  const updateShortcut = useCallback((id: string, keys: string[]) => {
    setShortcuts(prev => {
      const next = prev.map(s => s.id === id ? { ...s, keys } : s)
      saveShortcuts(next)
      return next
    })
  }, [])

  const resetToDefaults = useCallback(() => {
    const defaults = DEFAULT_SHORTCUTS.map(s => ({ ...s, keys: [...s.defaultKeys] }))
    setShortcuts(defaults)
    saveShortcuts(defaults)
  }, [])

  const getShortcut = useCallback((id: string) => {
    return shortcuts.find(s => s.id === id)
  }, [shortcuts])

  return (
    <ShortcutStoreContext.Provider value={{ shortcuts, updateShortcut, resetToDefaults, getShortcut }}>
      {children}
    </ShortcutStoreContext.Provider>
  )
}

export function useShortcutStore() {
  const ctx = useContext(ShortcutStoreContext)
  if (!ctx) throw new Error('useShortcutStore must be used within ShortcutStoreProvider')
  return ctx
}
