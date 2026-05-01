'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Search, Shield, User, ChevronDown, ChevronUp, Key, X, Check, Users as UsersIcon, RefreshCw } from 'lucide-react'

interface ClassGroup {
  id: string
  name: string
  userCount: number
}

interface UserInfo {
  id: string
  username: string
  displayName: string
  role: string
  classGroupId: string | null
  className: string | null
  lastActiveAt: string | null
  createdAt: string
}

function getRoleStyle(role: string) {
  switch (role) {
    case 'superadmin':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
    case 'classadmin':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
    default:
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case 'superadmin': return '超级管理员'
    case 'classadmin': return '班级管理员'
    default: return '学生'
  }
}

export default function AdminUsersPage() {
  const { user, getToken } = useAuth()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newClassGroupId, setNewClassGroupId] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const token = getToken()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, classesRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { authorization: `Bearer ${token}` } }),
        fetch('/api/admin/class-groups', { headers: { authorization: `Bearer ${token}` } }),
      ])
      const [usersData, classesData] = await Promise.all([usersRes.json(), classesRes.json()])
      if (usersData.data) setUsers(usersData.data)
      if (classesData.data) setClassGroups(classesData.data)
    } catch (err) {
      setMessage({ type: 'error', text: '加载数据失败' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (user?.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">无权访问，仅超级管理员可查看</p>
      </div>
    )
  }

  const filteredUsers = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      (u.displayName || '').toLowerCase().includes(q)
    )
  })

  const handleEditSubmit = async () => {
    if (!editingUser) return
    setSaving(true)
    setMessage(null)

    const body: Record<string, unknown> = { userId: editingUser.id }
    if (newPassword) body.password = newPassword
    if (newDisplayName) body.displayName = newDisplayName
    if (newRole) body.role = newRole
    if (newClassGroupId !== undefined) body.classGroupId = newClassGroupId || null

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.data) {
        setMessage({ type: 'success', text: '更新成功' })
        setEditingUser(null)
        setNewPassword('')
        setNewDisplayName('')
        setNewRole('')
        setNewClassGroupId('')
        fetchData()
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

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UsersIcon className="w-6 h-6" />
            用户管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">管理所有注册用户的角色、班级和密码</p>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <Shield className="w-3 h-3 inline mr-0.5" />
          超级管理员
        </span>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.type === 'success' ? <Check className="w-4 h-4 inline mr-1" /> : <X className="w-4 h-4 inline mr-1" />}
          {message.text}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索用户名..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid gap-3">
        {filteredUsers.map(u => (
          <div
            key={u.id}
            className="rounded-xl border border-border bg-card overflow-hidden transition-all"
          >
            <button
              onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors text-left"
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${getRoleStyle(u.role)}`}>
                {u.role === 'superadmin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{u.displayName || u.username}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getRoleStyle(u.role)}`}>
                    {getRoleLabel(u.role)}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  {u.className && (
                    <span className="text-xs text-muted-foreground">{u.className}</span>
                  )}
                  <span className={`w-2 h-2 rounded-full ${isOnline(u.lastActiveAt) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                  <span className="text-xs text-muted-foreground">
                    {isOnline(u.lastActiveAt) ? '在线' : '离线'}
                  </span>
                </div>
              </div>
              {expandedId === u.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {expandedId === u.id && (
              <div className="border-t border-border p-4 space-y-3 bg-muted/30">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">ID:</span>
                    <span className="ml-2 font-mono text-xs">{u.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">注册时间:</span>
                    <span className="ml-2">{new Date(u.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">最后活跃:</span>
                    <span className="ml-2">{u.lastActiveAt ? new Date(u.lastActiveAt).toLocaleString('zh-CN') : '从未'}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingUser(u)
                      setNewDisplayName(u.displayName || '')
                      setNewRole(u.role)
                      setNewClassGroupId(u.classGroupId || '')
                      setNewPassword('')
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    编辑信息
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">暂无用户数据</div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)}>
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold">编辑用户 - {editingUser.displayName || editingUser.username}</h3>

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
                <label className="text-xs text-muted-foreground mb-1 block">角色</label>
                <select
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="student">学生</option>
                  <option value="classadmin">班级管理员</option>
                  <option value="superadmin">超级管理员</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">所属班级</label>
                <select
                  value={newClassGroupId}
                  onChange={e => setNewClassGroupId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={newRole === 'superadmin'}
                >
                  <option value="">无班级</option>
                  {classGroups.map(cg => (
                    <option key={cg.id} value={cg.id}>{cg.name} ({cg.userCount}人)</option>
                  ))}
                </select>
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
                onClick={() => setEditingUser(null)}
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
