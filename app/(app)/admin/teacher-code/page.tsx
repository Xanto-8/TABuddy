'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'
import { PageContainer } from '@/components/ui/page-container'
import { KeyRound, RefreshCw, Copy, Loader2, Eye, EyeOff, User, ShieldCheck, CheckCheck, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface CodeRecord {
  id: string
  code: string
  isActive: boolean
  createdAt: string
  creator: {
    id: string
    username: string
    displayName: string
  }
}

export default function AdminTeacherCodePage() {
  const router = useRouter()
  const { user, getToken } = useAuth()
  const { isSuperAdmin } = useRoleAccess()

  const authHeaders = (): Record<string, string> => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const [codes, setCodes] = useState<CodeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchCodes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/teacher-code', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) {
        setCodes(data.data?.codes || [])
      }
    } catch {
      toast.error('获取注册码列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSuperAdmin) {
      router.push('/dashboard')
      return
    }
    fetchCodes()
  }, [isSuperAdmin, router, fetchCodes])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/teacher-code/generate', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('新注册码已生成')
        fetchCodes()
      } else {
        toast.error(data.error || '生成失败')
      }
    } catch {
      toast.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleToggle = async (id: string) => {
    setTogglingId(id)
    try {
      const res = await fetch(`/api/admin/teacher-code/${id}`, {
        method: 'PATCH',
        headers: authHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(data.data?.isActive ? '注册码已启用' : '注册码已禁用')
        fetchCodes()
      } else {
        toast.error(data.error || '操作失败')
      }
    } catch {
      toast.error('操作失败')
    } finally {
      setTogglingId(null)
    }
  }

  const handleCopy = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      toast.success('已复制')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const activeCodes = codes.filter(c => c.isActive)
  const inactiveCodes = codes.filter(c => !c.isActive)

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">老师注册码管理</h1>
            <p className="text-xs text-muted-foreground mt-0.5">超级管理员 · 全局老师注册专用码设置</p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">说明</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                通过老师注册码注册的账号，将直接自动成为<strong>班级管理员（任课老师）</strong>身份。
                注册码支持多人重复使用，不会一次性失效。如需停用，可手动禁用该注册码。
                老师之间可以互相转发此注册码给新老师注册使用。
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">当前注册码</h2>
            {activeCodes.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                {activeCodes.length} 个活跃
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white transition-all duration-200 disabled:opacity-50 border-none cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #22d3ee 100%)',
              boxShadow: '0 4px 10px rgba(15, 118, 110, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 14px rgba(15, 118, 110, 0.3)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 10px rgba(15, 118, 110, 0.2)'
            }}
          >
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {generating ? '生成中...' : activeCodes.length > 0 ? '重置注册码' : '生成注册码'}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeCodes.length === 0 && inactiveCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <KeyRound className="w-12 h-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">暂无老师注册码</p>
            <p className="text-xs text-muted-foreground/60 mt-1">点击上方按钮生成第一个老师注册码</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeCodes.map(code => (
              <div
                key={code.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-emerald-950/20"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-mono font-bold tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                      {code.code}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 shrink-0">
                      已启用
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span>创建者: {code.creator.displayName || code.creator.username}</span>
                    <span>·</span>
                    <span>{new Date(code.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(code.code, code.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-none cursor-pointer"
                    title="复制注册码"
                  >
                    {copiedId === code.id ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(code.id)}
                    disabled={togglingId === code.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 border-none cursor-pointer disabled:opacity-50"
                    title="禁用注册码"
                  >
                    {togglingId === code.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}

            {inactiveCodes.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-4 pb-2">
                  <h3 className="text-xs font-semibold text-muted-foreground">历史记录</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {inactiveCodes.length} 条
                  </span>
                </div>
                {inactiveCodes.map(code => (
                  <div
                    key={code.id}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card opacity-60"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-mono tracking-[0.2em] text-muted-foreground line-through">
                          {code.code}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                          已禁用
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>创建者: {code.creator.displayName || code.creator.username}</span>
                        <span>·</span>
                        <span>{new Date(code.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggle(code.id)}
                      disabled={togglingId === code.id}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 border-none cursor-pointer disabled:opacity-50"
                      title="启用注册码"
                    >
                      {togglingId === code.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
