'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useRoleAccess } from '@/lib/use-role-access'
import { toast } from 'sonner'
import {
  Loader2, Bug, Lightbulb, HelpCircle, MessageSquare,
  CheckCircle, XCircle, Clock, Trash2, Reply, Send,
  ChevronDown, Search, AlertTriangle,
} from 'lucide-react'

type FilterStatus = 'all' | 'pending' | 'resolved' | 'closed'

interface FeedbackItem {
  id: string
  type: string
  description: string
  screenshot: string
  status: string
  reply: string
  repliedAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string
    displayName: string
    role: string
  }
}

const TYPE_CONFIG = {
  bug: { icon: Bug, label: 'Bug 反馈', color: 'text-red-500', bg: 'bg-red-50' },
  suggestion: { icon: Lightbulb, label: '功能建议', color: 'text-amber-500', bg: 'bg-amber-50' },
  other: { icon: HelpCircle, label: '其他', color: 'text-blue-500', bg: 'bg-blue-50' },
} as const

const STATUS_CONFIG = {
  pending: { icon: Clock, label: '待处理', color: 'text-amber-600', bg: 'bg-amber-50' },
  resolved: { icon: CheckCircle, label: '已回复', color: 'text-green-600', bg: 'bg-green-50' },
  closed: { icon: XCircle, label: '已关闭', color: 'text-gray-500', bg: 'bg-gray-50' },
} as const

const ROLE_LABEL: Record<string, string> = {
  superadmin: '超级管理员',
  classadmin: '班级管理员',
  assistant: '助教',
}

export default function AdminFeedbackPage() {
  const { getToken } = useAuth()
  const { isSuperAdmin } = useRoleAccess()
  const router = useRouter()

  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [searchText, setSearchText] = useState('')

  const [replyingId, setReplyingId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/dashboard')
      return
    }
    fetchFeedbacks()
  }, [isSuperAdmin, router, statusFilter])

  const fetchFeedbacks = async () => {
    setLoading(true)
    try {
      const token = getToken()
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : ''
      const res = await fetch(`/api/admin/feedback${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (result.data) {
        setFeedbacks(result.data)
      }
    } catch (error) {
      console.error('获取反馈列表失败:', error)
      toast.error('获取反馈列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error('请输入回复内容')
      return
    }
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply: replyText.trim(),
          status: 'resolved',
        }),
      })

      if (res.ok) {
        toast.success('回复成功')
        setReplyingId(null)
        setReplyText('')
        fetchFeedbacks()
      } else {
        const result = await res.json()
        toast.error(result.error || '回复失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (res.ok) {
        toast.success('状态已更新')
        fetchFeedbacks()
      } else {
        const result = await res.json()
        toast.error(result.error || '更新失败')
      }
    } catch {
      toast.error('网络错误')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条反馈吗？此操作不可撤销。')) return
    setDeletingId(id)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        toast.success('已删除')
        fetchFeedbacks()
      } else {
        const result = await res.json()
        toast.error(result.error || '删除失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredFeedbacks = feedbacks.filter((fb) => {
    if (!searchText.trim()) return true
    const q = searchText.toLowerCase()
    return (
      fb.description.toLowerCase().includes(q) ||
      fb.user.displayName.toLowerCase().includes(q) ||
      fb.user.username.toLowerCase().includes(q)
    )
  })

  const FilterButton = ({ value, label }: { value: FilterStatus; label: string }) => (
    <button
      onClick={() => setStatusFilter(value)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        statusFilter === value
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {label}
    </button>
  )

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <AlertTriangle className="w-12 h-12 text-amber-500" />
          <p className="text-muted-foreground">无权访问，仅超级管理员可查看</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">反馈管理</h1>
          <p className="text-sm text-muted-foreground">查看和回复用户的反馈建议</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1.5">
          <FilterButton value="all" label="全部" />
          <FilterButton value="pending" label="待处理" />
          <FilterButton value="resolved" label="已回复" />
          <FilterButton value="closed" label="已关闭" />
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="搜索反馈内容或用户名..."
            className="pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-sm text-foreground
              placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">加载中...</p>
          </div>
        </div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">暂无反馈</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {statusFilter !== 'all' ? '当前筛选条件下没有反馈' : '还没有用户提交反馈'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((fb) => {
            const typeConfig = TYPE_CONFIG[fb.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.other
            const statusConfig = STATUS_CONFIG[fb.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending
            const TypeIcon = typeConfig.icon

            return (
              <div
                key={fb.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl ${typeConfig.bg} flex items-center justify-center shrink-0`}>
                        <TypeIcon className={`w-5 h-5 ${typeConfig.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig.bg} ${typeConfig.color}`}>
                            {typeConfig.label}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            <span className="flex items-center gap-1">
                              <statusConfig.icon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-2 whitespace-pre-wrap leading-relaxed">
                          {fb.description}
                        </p>

                        {fb.screenshot && (
                          <div className="mt-3">
                            <img
                              src={fb.screenshot}
                              alt="反馈截图"
                              className="max-h-48 rounded-lg border border-border object-contain bg-muted/30"
                            />
                          </div>
                        )}

                        {fb.reply && (
                          <div className="mt-3 pl-3 border-l-2 border-primary/40">
                            <p className="text-xs text-muted-foreground font-medium mb-1">管理员回复：</p>
                            <p className="text-sm text-foreground/80">{fb.reply}</p>
                            {fb.repliedAt && (
                              <p className="text-xs text-muted-foreground/60 mt-1">
                                {new Date(fb.repliedAt).toLocaleString('zh-CN')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {fb.user.displayName || fb.user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {ROLE_LABEL[fb.user.role] || fb.user.role}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground/60">
                      {new Date(fb.createdAt).toLocaleString('zh-CN')}
                    </p>
                    <div className="flex items-center gap-2">
                      {replyingId === fb.id ? (
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="输入回复内容..."
                            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground
                              placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-60"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleReply(fb.id)
                              if (e.key === 'Escape') { setReplyingId(null); setReplyText('') }
                            }}
                          />
                          <button
                            onClick={() => handleReply(fb.id)}
                            disabled={saving || !replyText.trim()}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium
                              hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {saving ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            发送
                          </button>
                          <button
                            onClick={() => { setReplyingId(null); setReplyText('') }}
                            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {fb.status !== 'closed' && (
                            <button
                              onClick={() => setReplyingId(fb.id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                            >
                              <Reply className="w-3.5 h-3.5" />
                              回复
                            </button>
                          )}
                          {fb.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(fb.id, 'closed')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-muted text-muted-foreground hover:bg-accent transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              关闭
                            </button>
                          )}
                          {fb.status === 'closed' && (
                            <button
                              onClick={() => handleStatusChange(fb.id, 'pending')}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                                bg-muted text-muted-foreground hover:bg-accent transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              重新打开
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(fb.id)}
                            disabled={deletingId === fb.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                              text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deletingId === fb.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
