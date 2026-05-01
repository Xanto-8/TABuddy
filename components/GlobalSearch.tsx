'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Search, Users, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ROLE_LABELS: Record<string, string> = {
  superadmin: '超级管理员',
  classadmin: '班级管理员',
  assistant: '助教',
  student: '学生',
}

const ROLE_STYLES: Record<string, string> = {
  superadmin: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  classadmin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assistant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  student: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

function getColor(name: string) {
  const colors = [
    'bg-red-100 text-red-700', 'bg-orange-100 text-orange-700',
    'bg-amber-100 text-amber-700', 'bg-green-100 text-green-700',
    'bg-teal-100 text-teal-700', 'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700',
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
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
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
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => doSearch(value), 300)
  }

  const clearSearch = () => {
    setQuery('')
    setResults(null)
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < totalItems - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : totalItems - 1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      selectItem(selectedIndex)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const selectItem = (index: number) => {
    if (!results) return
    const userCount = results.users.length
    if (index < userCount) {
      const user = results.users[index]
    } else {
      const cls = results.classes[index - userCount]
    }
    setOpen(false)
    onResultClick?.()
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
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

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
          onFocus={() => { if (results) setOpen(true) }}
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
                    selectedIndex === i && 'bg-accent'
                  )}
                  onMouseEnter={() => setSelectedIndex(i)}
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
                const idx = results.users.length + i
                return (
                  <button
                    key={cls.id}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent transition-colors text-left',
                      selectedIndex === idx && 'bg-accent'
                    )}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => selectItem(idx)}
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
