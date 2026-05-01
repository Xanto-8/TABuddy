'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Shield, UserCog, Key, Lock, Search, X, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-store'
import { PageContainer } from '@/components/ui/page-container'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UserInfo {
  id: string
  username: string
  displayName: string
  role: string
  createdAt: string
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, getToken } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingUser, setEditingUser] = useState<UserInfo | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'ta'>('ta')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (isAuthenticated && user && !user.isAdmin) {
      router.replace('/dashboard')
    }
  }, [isAuthenticated, user, router])

  const loadUsers = useCallback(async () => {
    if (!user?.isAdmin) return
    setLoading(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('加载失败')
      const result = await res.json()
      setUsers(result.data || [])
    } catch {
      toast.error('加载用户列表失败')
    }
    setLoading(false)
  }, [user, getToken])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleResetPassword = async (targetUser: UserInfo) => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('密码长度不能少于6位')
      return
    }
    if (!window.confirm(`确定要重置用户 "${targetUser.displayName || targetUser.username}" 的密码吗？`)) return
    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUser.id, password: newPassword }),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '重置失败')
      }
      toast.success('密码已重置')
      setEditingUser(null)
      setNewPassword('')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重置失败')
    }
  }

  const handleUpdateUser = async (targetUser: UserInfo) => {
    const updates: Record<string, string> = {}
    if (newDisplayName && newDisplayName !== targetUser.displayName) updates.displayName = newDisplayName
    if (newRole !== targetUser.role) updates.role = newRole

    if (Object.keys(updates).length === 0) {
      toast.error('没有需要修改的信息')
      return
    }

    try {
      const token = getToken()
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUser.id, ...updates }),
      })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || '更新失败')
      }
      toast.success('用户信息已更新')
      setEditingUser(null)
      setNewDisplayName('')
      loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    }
  }

  const openEditPanel = (targetUser: UserInfo) => {
    setEditingUser(targetUser)
    setNewDisplayName(targetUser.displayName)
    setNewRole(targetUser.role as 'admin' | 'ta')
    setNewPassword('')
  }

  const filtered = users.filter(u => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      u.username.toLowerCase().includes(q) ||
      u.displayName.toLowerCase().includes(q)
    )
  })

  if (!user?.isAdmin) return null

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">成员管理</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <Shield className="w-3 h-3 inline mr-0.5" />
              管理员
            </span>
          </div>
          <p className="text-muted-foreground mt-1">查看所有注册成员，管理账号信息和密码</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索用户名..."
            className="w-full h-10 pl-10 pr-4 text-sm rounded-xl border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40 animate-pulse" />
            <p className="text-sm">加载中...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{searchQuery ? '没有匹配的成员' : '暂无注册成员'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === u.id ? null : u.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                    u.role === 'admin'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  )}>
                    {(u.displayName || u.username)[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{u.displayName || u.username}</span>
                      {u.role === 'admin' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                          管理员
                        </span>
                      )}
                      {u.role === 'ta' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                          助教
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{u.username}
                      {` · ${new Date(u.createdAt).toLocaleDateString('zh-CN')} 注册`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditPanel(u) }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      title="管理账号"
                    >
                      <UserCog className="w-4 h-4" />
                    </button>
                    {expandedId === u.id ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {expandedId === u.id && (
                  <div className="px-4 pb-3 pt-0 border-t border-border">
                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">用户ID</span>
                        <p className="font-mono text-foreground mt-0.5 break-all">{u.id}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">用户名</span>
                        <p className="text-foreground mt-0.5">{u.username}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">显示名称</span>
                        <p className="text-foreground mt-0.5">{u.displayName || '-'}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-muted/30">
                        <span className="text-muted-foreground">角色</span>
                        <p className="text-foreground mt-0.5">{u.role === 'admin' ? '管理员' : '助教'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                管理账号
                <span className="text-sm font-normal text-muted-foreground">@{editingUser.username}</span>
              </h2>
              <button onClick={() => setEditingUser(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <UserCog className="w-3.5 h-3.5" />
                  基本信息
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">显示名称</label>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={e => setNewDisplayName(e.target.value)}
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">角色</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setNewRole('ta')}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs rounded-lg border transition-all',
                          newRole === 'ta'
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                        助教
                      </button>
                      <button
                        onClick={() => setNewRole('admin')}
                        className={cn(
                          'flex-1 px-3 py-2 text-xs rounded-lg border transition-all',
                          newRole === 'admin'
                            ? 'border-amber-500 bg-amber-50 text-amber-700 font-medium dark:bg-amber-900/20 dark:text-amber-400'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <Shield className="w-3 h-3 inline mr-1" />
                        管理员
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateUser(editingUser)}
                    className="w-full px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                  >
                    保存信息修改
                  </button>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  重置密码
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">新密码（至少6位）</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="输入新密码..."
                      className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleResetPassword(editingUser)}
                    disabled={!newPassword || newPassword.length < 6}
                    className="w-full px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all disabled:opacity-40"
                  >
                    <Lock className="w-3.5 h-3.5 inline mr-1.5" />
                    重置密码
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  )
}
