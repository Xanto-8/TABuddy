'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Plus, X, Check, Users, Trash2, Edit2, Shield } from 'lucide-react'

interface ClassGroupItem {
  id: string
  name: string
  userCount: number
  createdAt: string
}

export default function AdminClassesPage() {
  const { user, getToken } = useAuth()
  const [classGroups, setClassGroups] = useState<ClassGroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const token = getToken()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/class-groups', {
        headers: { authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.data) setClassGroups(data.data)
    } catch {
      setMessage({ type: 'error', text: '加载班级列表失败' })
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
        <p className="text-muted-foreground">无权访问，仅超级管理员可管理班级</p>
      </div>
    )
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/class-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const result = await res.json()
      if (result.data) {
        setMessage({ type: 'success', text: `班级 "${newName}" 创建成功` })
        setNewName('')
        setShowCreate(false)
        fetchData()
      } else {
        setMessage({ type: 'error', text: result.error || '创建失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (id: string) => {
    if (!editingName.trim()) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/class-groups/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingName.trim() }),
      })
      const result = await res.json()
      if (result.data) {
        setMessage({ type: 'success', text: '更新成功' })
        setEditingId(null)
        setEditingName('')
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

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`确定要删除班级 "${name}" 吗？`)) return
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/class-groups/${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.ok) {
        setMessage({ type: 'success', text: `班级 "${name}" 已删除` })
        fetchData()
      } else {
        setMessage({ type: 'error', text: result.error || '删除失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            班级管理
          </h1>
          <p className="text-sm text-muted-foreground mt-1">创建和管理系统中的班级组织</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建班级
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.type === 'success' ? <Check className="w-4 h-4 inline mr-1" /> : <X className="w-4 h-4 inline mr-1" />}
          {message.text}
        </div>
      )}

      {showCreate && (
        <div className="flex items-center gap-2 p-4 rounded-xl border border-border bg-card">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="输入班级名称"
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
          />
          <button
            onClick={handleCreate}
            disabled={saving || !newName.trim()}
            className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? '创建中...' : '创建'}
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewName('') }}
            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {classGroups.map(cg => (
          <div key={cg.id} className="rounded-xl border border-border bg-card p-4">
            {editingId === cg.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleEdit(cg.id)}
                />
                <button
                  onClick={() => handleEdit(cg.id)}
                  disabled={saving}
                  className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? '保存...' : '保存'}
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditingName('') }}
                  className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{cg.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cg.userCount} 人 · 创建于 {new Date(cg.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditingId(cg.id); setEditingName(cg.name) }}
                    className="p-2 rounded-lg hover:bg-accent transition-colors"
                    title="编辑"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(cg.id, cg.name)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {classGroups.length === 0 && !loading && (
          <div className="text-center py-12 text-muted-foreground">
            暂无班级，点击"新建班级"创建第一个
          </div>
        )}
      </div>
    </div>
  )
}
