'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'
import { PageContainer } from '@/components/ui/page-container'
import { KeyRound, RefreshCw, Copy, Loader2, CheckCheck, User, ShieldCheck, Clock, XCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface CodeRecord {
  id: string
  code: string
  isActive: boolean
  createdAt: string
}

export default function TeacherCodeManagementPage() {
  const router = useRouter()
  const { user, getToken } = useAuth()
  const { isClassAdmin, isSuperAdmin } = useRoleAccess()

  const authHeaders = (): Record<string, string> => {
    const token = getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const [activeCode, setActiveCode] = useState<CodeRecord | null>(null)
  const [history, setHistory] = useState<CodeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher-code/my', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) {
        setActiveCode(data.data?.active || null)
        setHistory(data.data?.history || [])
      }
    } catch {
      toast.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isClassAdmin && !isSuperAdmin) {
      router.push('/dashboard')
      return
    }
    fetchData()
  }, [isClassAdmin, isSuperAdmin, router, fetchData])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/teacher-code/generate', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(activeCode ? '注册码已重置' : '新注册码已生成')
        fetchData()
      } else {
        toast.error(data.error || '生成失败')
      }
    } catch {
      toast.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success('已复制')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const canManage = isClassAdmin || isSuperAdmin

  return (
    <PageContainer>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">老师注册码</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              生成老师注册码，分享给新老师完成注册
            </p>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 mb-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">使用说明</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 leading-relaxed">
                新老师在注册页面选择「任课老师」身份，输入此注册码即可完成注册，账号自动成为<strong>班级管理员</strong>。
                注册码可<strong>多人重复使用</strong>，不会一次性失效。如需更换，点击「重置注册码」即可生成新的码，旧码自动失效。
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">当前注册码</h2>
              {canManage && (
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
                  {generating ? '生成中...' : activeCode ? '重置注册码' : '生成注册码'}
                </button>
              )}
            </div>

            {!activeCode ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <KeyRound className="w-12 h-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">暂无老师注册码</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  点击「生成注册码」创建，分享给新老师使用
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5 rounded-xl border border-emerald-200 bg-white dark:border-emerald-800 dark:bg-emerald-950/20 mb-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <CheckCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-2xl font-mono font-bold tracking-[0.25em] text-emerald-700 dark:text-emerald-300">
                      {activeCode.code}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      已启用
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>创建于 {new Date(activeCode.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeCode.code)}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 transition-colors border-none cursor-pointer"
                >
                  {copied ? (
                    <CheckCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            )}

            {history.length > 1 && (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-xs font-semibold text-muted-foreground">历史记录</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {history.length - 1} 条
                  </span>
                </div>
                <div className="space-y-2">
                  {history.slice(1).map(code => (
                    <div
                      key={code.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card opacity-60"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono tracking-[0.2em] text-muted-foreground line-through">
                            {code.code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                            已失效
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(code.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageContainer>
  )
}
