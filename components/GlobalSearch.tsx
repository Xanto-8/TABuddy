'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-store'
import { Search, Users, X, Loader2, Clock, ArrowUpLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  superadmin: '超级管理员',
  classadmin: '班级管理员',
  assistant: '助教',
  student: '学生',
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  classadmin: 'bg-slate-100 text-slate-700 dark:bg-orange-900/30 dark:text-orange-300',
  assistant: 'bg-stone-100 text-stone-700 dark:bg-orange-900/30 dark:text-orange-300',
  student: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const HISTORY_KEY = 'tabuddy_search_history'
const MAX_HISTORY = 5

function getHistory(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveHistory(items: string[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
  } catch {}
}

function addToHistory(q: string) {
  const trimmed = q.trim()
  if (!trimmed) return
  const history = getHistory().filter(h => h !== trimmed)
  history.unshift(trimmed)
  saveHistory(history.slice(0, MAX_HISTORY))
}

function getColor(name: string) {
  const colors = [
    'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700',
    'bg-orange-100 text-orange-700', 'bg-stone-100 text-stone-700',
    'bg-stone-100 text-teal-700', 'bg-slate-100 text-slate-700',
    'bg-slate-100 text-slate-700', 'bg-gray-100 text-gray-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 text-inherit rounded px-0.5">{part}</mark>
      : part
  )
}

interface SearchResult {
  users: Array<{
    id: string
    username: string
    displayName: string
    avatar: string
    role: string
    roleLabel: string
    classGroupId: string | null
    className: string
    lastActiveAt: string | null
  }>
  classes: Array<{
    id: string
    name: string
    userCount: number
  }>
}

interface GlobalSearchProps {
  className?: string
  placeholder?: string
  onResultClick?: () => void
}

export default function GlobalSearch({ className, placeholder = '搜索用户、班级...', onResultClick }: GlobalSearchProps) {
  const { getToken } = useAuth()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const totalItems = (results?.users.length || 0) + (results?.classes.length || 0)

  const doSearch = useCallback(async (q: string) => {
    const token = getToken()
    if (!token || !q.trim()) {
      setResults(null)
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
        headers: { authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('search failed')
      const json = await res.json()
      setResults(json.data)
      setOpen(true)
      setSelectedIndex(-1)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!value.trim()) {
      setResults(null)
      setOpen(true)
      setHistory(getHistory())
      return
    }

    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const clearSearch = () => {
    setQuery('')
    setResults(null)
    setOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const handleFocus = () => {
    if (!query.trim()) {
      setHistory(getHistory())
      setOpen(true)
    } else if (results) {
      setOpen(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const historyOffset = !query.trim() ? history.length : 0
    const actualTotal = totalItems + historyOffset

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < actualTotal - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : actualTotal - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      if (!query.trim() && selectedIndex < history.length) {
        applyHistory(history[selectedIndex])
      } else {
        selectItem(selectedIndex - historyOffset)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const selectItem = (index: number) => {
    if (!results) return
    const userCount = results.users.length
    addToHistory(query)
    setOpen(false)
    if (index < userCount) {
      const user = results.users[index]
      if (user.role === 'student') {
        router.push('/students')
      } else {
        router.push('/students')
      }
    } else {
      const cls = results.classes[index - userCount]
      router.push(`/classes/${cls.id}`)
    }
    onResultClick?.()
  }

  const applyHistory = (q: string) => {
    setQuery(q)
    setOpen(false)
    addToHistory(q)
    doSearch(q)
  }

  const removeHistoryItem = (q: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = history.filter(h => h !== q)
    setHistory(updated)
    saveHistory(updated)
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handleGlobalFocus = () => {
      inputRef.current?.focus()
      if (query.trim() && results) setOpen(true)
      if (!query.trim()) {
        setHistory(getHistory())
        setOpen(true)
      }
    }
    window.addEventListener('global-search:focus', handleGlobalFocus)
    return () => {
      window.removeEventListener('global-search:focus', handleGlobalFocus)
    }
  }, [query, results])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const showHistory = !query.trim() && history.length > 0

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <div className="relative">
        {loading ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-9 pl-9 pr-8 rounded-lg border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && showHistory && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
          <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            最近搜索
          </div>
          {history.map((q, i) => (
            <button
              key={q}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left',
                selectedIndex === i && 'bg-accent'
              )}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => applyHistory(q)}
            >
              <ArrowUpLeft className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{q}</span>
              <button
                onClick={(e) => removeHistoryItem(q, e)}
                className="p-0.5 rounded hover:bg-muted-foreground/20 transition-colors shrink-0"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            </button>
          ))}
        </div>
      )}

      {open && results && (results.users.length > 0 || results.classes.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {results.users.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                用户 ({results.users.length})
              </div>
              {results.users.map((user, i) => (
                <button
                  key={user.id}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left',
                    selectedIndex === i + history.length && 'bg-accent'
                  )}
                  onMouseEnter={() => setSelectedIndex(i + history.length)}
                  onClick={() => selectItem(i)}
                >
                  {user.avatar ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden ring-1 ring-border shrink-0">
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', getColor(user.displayName))}>
                      {user.displayName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {highlightText(user.displayName, query)}
                      </span>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0', ROLE_STYLES[user.role] || ROLE_STYLES.student)}>
                        {user.roleLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>@{highlightText(user.username, query)}</span>
                      {user.className && (
                        <>
                          <span>·</span>
                          <span>{highlightText(user.className, query)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {results.classes.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted/50 flex items-center gap-1.5 border-t border-border">
                <Users className="w-3 h-3" />
                班级 ({results.classes.length})
              </div>
              {results.classes.map((cls, i) => {
                const idx = results.users.length + i + history.length
                return (
                  <button
                    key={cls.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left',
                      selectedIndex === idx && 'bg-accent'
                    )}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => selectItem(results.users.length + i)}
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {highlightText(cls.name, query)}
                      </div>
                      <p className="text-xs text-muted-foreground">{cls.userCount} 人</p>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {open && query && !loading && results && results.users.length === 0 && results.classes.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 p-6 text-center">
          <p className="text-sm text-muted-foreground">未找到匹配的结果</p>
          <p className="text-xs text-muted-foreground mt-1">尝试其他关键词</p>
        </div>
      )}
    </div>
  )
}
