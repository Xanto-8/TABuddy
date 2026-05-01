'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Search, Shield, User, ChevronDown, Key, X, Check, Users as UsersIcon, RefreshCw, MapPin, Globe, Clock } from 'lucide-react'

interface BoundMember {
  bindId: string
  bindedAt: string | null
  assistant: {
    id: string
    username: string
    password: string
    displayName: string
    role: string
    classGroupId: string | null
    className: string | null
    lastActiveAt: string | null
    lastLoginIp: string
    lastLoginCountry: string
    lastLoginCity: string
    lastLoginRegion: string
    createdAt: string
    avatar: string
  } | null
}

function getRoleStyle(role: string) {
  switch (role) {
    case 'superadmin':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    case 'classadmin':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    case 'assistant':
    case 'student':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'superadmin': return '超级管理员'
    case 'classadmin': return '班级管理员'
    case 'assistant': return '助教'
    default: return '助教'
  }
}

function getIpVersion(ip: string): { label: string; color: string } | null {
  if (!ip || ip === '暂无' || ip === 'unknown' || ip === '') return null
  if (ip.includes(':')) return { label: 'IPv6', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800' }
  return { label: 'IPv4', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800' }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '从未'
  const diff = Date.now() - new Date(dateStr).getTime()
  if (diff < 0) return '刚刚'
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}秒前`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hour = Math.floor(min / 60)
  if (hour < 24) return `${hour}小时前`
  return new Date(dateStr).toLocaleString('zh-CN')
}

export default function BoundMembersPage() {
  const { user, getToken } = useAuth()
  const [members, setMembers] = useState<BoundMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingMember, setEditingMember] = useState<BoundMember | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tick, setTick] = useState(0)

  const token = getToken()

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/invite-code/bound-members', {
        headers: { authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.data) setMembers(result.data)
    } catch {
      setMessage({ type: 'error', text: '加载数据失败' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  useEffect(() => {
    if (!user || user.role !== 'classadmin') return
    const id = setInterval(fetchMembers, 8000)
    return () => clearInterval(id)
  }, [fetchMembers, user?.role])

  if (!user || user.role !== 'classadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">无权访问，仅班级管理员可查看</p>
      </div>
    )
  }

  const filteredMembers = members.filter(m => {
    if (!m.assistant) return false
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      m.assistant.username.toLowerCase().includes(q) ||
      (m.assistant.displayName || '').toLowerCase().includes(q)
    )
  })

  const handleEditSubmit = async () => {
    if (!editingMember || !editingMember.assistant) return
    setSaving(true)
    setMessage(null)

    const body: Record<string, string> = {}

    if (newPassword) {
      body.password = newPassword
    }

    if (newDisplayName !== editingMember.assistant.displayName) {
      body.displayName = newDisplayName
    }

    if (Object.keys(body).length === 0) {
      setMessage({ type: 'error', text: '没有需要更新的字段' })
      setSaving(false)
      return
    }

    try {
      const res = await fetch(`/api/invite-code/bound-members/${editingMember.assistant.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.data) {
        setMessage({ type: 'success', text: '更新成功' })
        setEditingMember(null)
        setNewPassword('')
        setNewDisplayName('')
        fetchMembers()
      } else {
        setMessage({ type: 'error', text: result.error || '更新失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setSaving(false)
    }
  }

  function isOnline(lastActiveAt: string | null): boolean {
    if (!lastActiveAt) return false
    const diff = Date.now() - new Date(lastActiveAt).getTime()
    return diff < 5 * 60 * 1000
  }

  function onlineText(lastActiveAt: string | null): { label: string; color: string; dot: string } {
    const online = isOnline(lastActiveAt)
    if (online) {
      return { label: '在线', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800', dot: 'bg-green-500' }
    }
    if (!lastActiveAt) {
      return { label: '从未上线', color: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800', dot: 'bg-gray-300' }
    }
    return { label: `${Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60000)}分钟前离线`, color: 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800', dot: 'bg-gray-300' }
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
            已绑定成员管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">查看已绑定助教的详细信息，管理密码等账户数据</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            <Shield className="w-3 h-3 inline mr-0.5" />
            班级管理员
          </span>
        </div>
      </div>

      {message && (
        <div className={`animate-slide-in p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.type === 'success' ? <Check className="w-4 h-4 inline mr-1" /> : <X className="w-4 h-4 inline mr-1" />}
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索成员用户名..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={fetchMembers}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-3">
        {filteredMembers.map((m, index) => {
          if (!m.assistant) return null
          const a = m.assistant
          const isExpanded = expandedId === a.id
          return (
            <div
              key={a.id}
              className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md animate-slide-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : a.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getRoleStyle(a.role)}`}>
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{a.displayName || a.username}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getRoleStyle(a.role)}`}>
                      {getRoleLabel(a.role)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">@{a.username}</span>
                    {a.className && (
                      <span className="text-xs text-muted-foreground">{a.className}</span>
                    )}
                    {m.bindedAt && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        绑定 {timeAgo(m.bindedAt)}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${onlineText(a.lastActiveAt).color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${onlineText(a.lastActiveAt).dot}`} />
                      {onlineText(a.lastActiveAt).label}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                <div className="border-t border-border p-4 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">ID:</span>
                      <span className="font-mono text-xs truncate">{a.id}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground shrink-0">密码:</span>
                      <span className="font-mono text-xs truncate">{a.password}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground shrink-0">注册时间:</span>
                      <span className="text-xs">{new Date(a.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground shrink-0">最后活跃:</span>
                      <span className="text-xs">{a.lastActiveAt ? timeAgo(a.lastActiveAt) : '从未'}</span>
                      {a.lastActiveAt && (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-none ${isOnline(a.lastActiveAt) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-900/30 dark:text-gray-400'}`}>
                          {isOnline(a.lastActiveAt) ? '在线' : '离线'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">登录IP:</span>
                      <span className="font-mono text-xs">{a.lastLoginIp || '暂无'}</span>
                      {getIpVersion(a.lastLoginIp) && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium leading-none border ${getIpVersion(a.lastLoginIp)!.color}`}>
                          {getIpVersion(a.lastLoginIp)!.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground shrink-0">登录地点:</span>
                      <span className="text-xs">{a.lastLoginCountry || a.lastLoginRegion ? `${a.lastLoginCountry} ${a.lastLoginRegion} ${a.lastLoginCity}`.trim() : '未知'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setEditingMember(m)
                        setNewDisplayName(a.displayName || '')
                        setNewPassword('')
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Key className="w-3 h-3" />
                      修改密码
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        {filteredMembers.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">暂无已绑定成员</div>
        )}
      </div>

      {editingMember && editingMember.assistant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setEditingMember(null)}>
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full space-y-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold">修改密码 - {editingMember.assistant.displayName || editingMember.assistant.username}</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">显示名称</label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={e => setNewDisplayName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="显示名称"
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">新密码（留空不修改）</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="至少6位"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
