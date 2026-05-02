'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'
import { PageContainer } from '@/components/ui/page-container'
import { Copy, RefreshCw, UserX, Loader2, CheckCheck, Clock, Infinity, Users, KeyRound, CalendarClock, AlertCircle, School } from 'lucide-react'
import { toast } from 'sonner'

type ValidPeriod = 'permanent' | '24h' | '7d'

interface InviteCodeData {
  id: string
  inviteCode: string
  validPeriod: ValidPeriod
  expiresAt: string | null
  status: string
  createdAt: string
}

interface BoundAssistant {
  id: string
  assistantId: string
  bindedAt: string
  assistant: {
    id: string
    username: string
    displayName: string
    avatar: string
    createdAt: string
  }
}

const PERIOD_OPTIONS: { value: ValidPeriod; label: string; icon: typeof Infinity }[] = [
  { value: 'permanent', label: '永久有效', icon: Infinity },
  { value: '24h', label: '24小时', icon: Clock },
  { value: '7d', label: '7天有效', icon: CalendarClock },
]

export default function AssistantManagementPage() {
  const router = useRouter()
  const { user, getToken } = useAuth()
  const { isClassAdmin } = useRoleAccess()

  const authHeaders = (): Record<string, string> => {
    const token = getToken()
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }

  const [inviteCodeData, setInviteCodeData] = useState<InviteCodeData | null>(null)
  const [validPeriod, setValidPeriod] = useState<ValidPeriod>('permanent')
  const [loadingCode, setLoadingCode] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [boundAssistants, setBoundAssistants] = useState<BoundAssistant[]>([])
  const [loadingAssistants, setLoadingAssistants] = useState(false)
  const [unbindingId, setUnbindingId] = useState<string | null>(null)

  const [campusCodeData, setCampusCodeData] = useState<{ inviteCode: string; validPeriod: string; expiresAt: string | null } | null>(null)
  const [loadingCampusCode, setLoadingCampusCode] = useState(false)
  const [generatingCampusCode, setGeneratingCampusCode] = useState(false)
  const [campusCodePeriod, setCampusCodePeriod] = useState<ValidPeriod>('permanent')

  const fetchInviteCode = useCallback(async () => {
    setLoadingCode(true)
    try {
      const res = await fetch('/api/invite-code/my', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok && data.data) {
        setInviteCodeData(data.data)
        setValidPeriod(data.data.validPeriod)
      } else {
        setInviteCodeData(null)
      }
    } catch {
      setInviteCodeData(null)
    } finally {
      setLoadingCode(false)
    }
  }, [])

  const fetchBoundAssistants = useCallback(async () => {
    setLoadingAssistants(true)
    try {
      const res = await fetch('/api/invite-code/bound-assistants', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok) {
        setBoundAssistants(data.data || [])
      }
    } catch {
      toast.error('获取已绑定助教列表失败')
    } finally {
      setLoadingAssistants(false)
    }
  }, [])

  const fetchCampusCode = useCallback(async () => {
    setLoadingCampusCode(true)
    try {
      const res = await fetch('/api/campus/code/my', { headers: authHeaders() })
      const data = await res.json()
      if (res.ok && data.data) {
        setCampusCodeData(data.data)
        setCampusCodePeriod(data.data.validPeriod)
      } else {
        setCampusCodeData(null)
      }
    } catch {
      setCampusCodeData(null)
    } finally {
      setLoadingCampusCode(false)
    }
  }, [])

  const handleGenerateCampusCode = async () => {
    setGeneratingCampusCode(true)
    try {
      const res = await fetch('/api/campus/code/generate', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ validPeriod: campusCodePeriod }),
      })
      const data = await res.json()
      if (res.ok) {
        setCampusCodeData(data.data)
        toast.success(campusCodeData ? '校区邀请码已重置' : '校区邀请码已生成')
      } else {
        toast.error(data.error || '生成失败')
      }
    } catch {
      toast.error('生成失败，请重试')
    } finally {
      setGeneratingCampusCode(false)
    }
  }

  const handleCopyCampusCode = async () => {
    if (!campusCodeData?.inviteCode) return
    try {
      await navigator.clipboard.writeText(campusCodeData.inviteCode)
      toast.success('校区邀请码已复制')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  useEffect(() => {
    if (!isClassAdmin) {
      router.push('/dashboard')
      return
    }
    fetchInviteCode()
    fetchBoundAssistants()
    fetchCampusCode()
  }, [isClassAdmin, router, fetchInviteCode, fetchBoundAssistants, fetchCampusCode])

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/invite-code/generate', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ validPeriod }),
      })
      const data = await res.json()
      if (res.ok) {
        setInviteCodeData(data.data)
        toast.success(inviteCodeData ? '邀请码已重置' : '邀请码已生成')
      } else {
        toast.error(data.error || '生成失败')
      }
    } catch {
      toast.error('生成失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!inviteCodeData?.inviteCode) return
    try {
      await navigator.clipboard.writeText(inviteCodeData.inviteCode)
      toast.success('邀请码已复制')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  const handleUnbind = async (bindId: string) => {
    setUnbindingId(bindId)
    try {
      const res = await fetch('/api/invite-code/unbind', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bindId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('已解除绑定')
        setBoundAssistants(prev => prev.filter(a => a.id !== bindId))
      } else {
        toast.error(data.error || '解绑失败')
      }
    } catch {
      toast.error('解绑失败，请重试')
    } finally {
      setUnbindingId(null)
    }
  }

  if (!isClassAdmin) {
    return null
  }

  const getExpiresAtText = () => {
    if (!inviteCodeData) return ''
    if (inviteCodeData.validPeriod === 'permanent') return '永久有效'
    if (inviteCodeData.expiresAt) {
      return `有效期至 ${new Date(inviteCodeData.expiresAt).toLocaleString('zh-CN')}`
    }
    return ''
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">助教与绑定管理</h1>
          <p className="text-muted-foreground mt-1">生成邀请码并管理已绑定的助教</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">我的邀请码（助教）</h2>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                将邀请码发给助教，对方输入后即可绑定您名下所有班级
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  有效期设置
                </label>
                <div className="flex gap-2">
                  {PERIOD_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setValidPeriod(opt.value)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                        validPeriod === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    邀请码
                  </label>
                  {inviteCodeData && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {getExpiresAtText()}
                    </span>
                  )}
                </div>

                {loadingCode ? (
                  <div className="h-14 rounded-xl border border-border bg-accent/30 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : inviteCodeData ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-14 rounded-xl border-2 border-primary/20 bg-primary/5 flex items-center justify-center">
                      <span className="text-2xl tracking-[0.4em] font-mono font-bold text-primary select-all">
                        {inviteCodeData.inviteCode}
                      </span>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="h-14 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 font-medium"
                      title="复制邀请码"
                    >
                      <Copy className="w-4 h-4" />
                      复制
                    </button>
                  </div>
                ) : (
                  <div className="h-14 rounded-xl border border-dashed border-border bg-accent/20 flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">还没有邀请码，点击下方生成</p>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {inviteCodeData ? '重置中...' : '生成中...'}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    {inviteCodeData ? '重新生成邀请码' : '生成邀请码'}
                  </>
                )}
              </button>

              {inviteCodeData && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    重新生成后，之前的邀请码将立即失效，已绑定的助教不受影响。
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-accent/30">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  已绑定我的助教
                </h2>
                <span className="ml-auto text-xs text-muted-foreground">
                  {boundAssistants.length} 人
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              {loadingAssistants ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : boundAssistants.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">暂无已绑定的助教</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    生成邀请码后发给助教即可绑定
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {boundAssistants.map(ba => (
                    <div
                      key={ba.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-accent/30 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-primary">
                          {(ba.assistant.displayName || ba.assistant.username).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {ba.assistant.displayName || ba.assistant.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{ba.assistant.username}
                          <span className="mx-1">·</span>
                          <span>绑定于 {formatDate(ba.bindedAt)}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`确定解除与「${ba.assistant.displayName || ba.assistant.username}」的绑定吗？\n\n解除后该助教将立即失去所有班级查看权限。`)) {
                            handleUnbind(ba.id)
                          }
                        }}
                        disabled={unbindingId === ba.id}
                        className="h-9 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-40"
                      >
                        {unbindingId === ba.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-accent/30">
            <div className="flex items-center gap-2">
              <School className="w-5 h-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">校区邀请码</h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              生成校区邀请码后发给校区班主任，对方输入后即可查看您名下所有班级的情况
            </p>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                有效期设置
              </label>
              <div className="flex gap-2">
                {PERIOD_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setCampusCodePeriod(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      campusCodePeriod === opt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                校区邀请码
              </label>
              {loadingCampusCode ? (
                <div className="h-14 rounded-xl border border-border bg-accent/30 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : campusCodeData ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-14 rounded-xl border-2 border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10 flex items-center justify-center">
                    <span className="text-2xl tracking-[0.4em] font-mono font-bold text-emerald-600 dark:text-emerald-400 select-all">
                      {campusCodeData.inviteCode}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyCampusCode}
                    className="h-14 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-2 font-medium"
                    title="复制校区邀请码"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                </div>
              ) : (
                <div className="h-14 rounded-xl border border-dashed border-border bg-accent/20 flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">还没有校区邀请码，点击下方生成</p>
                </div>
              )}
            </div>

            <button
              onClick={handleGenerateCampusCode}
              disabled={generatingCampusCode}
              className="w-full h-11 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {generatingCampusCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {campusCodeData ? '重置中...' : '生成中...'}
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  {campusCodeData ? '重新生成校区邀请码' : '生成校区邀请码'}
                </>
              )}
            </button>

            {campusCodeData && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  重新生成后，之前的校区邀请码将立即失效，已绑定的校区班主任不受影响。
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-accent/30">
            <h2 className="text-base font-semibold text-foreground">操作说明</h2>
          </div>
          <div className="px-6 py-5">
            <ul className="space-y-2">
              {[
                '邀请码绑定您的账号名下，助教绑定后自动拥有您全部班级的查看权限',
                '后续您新增的班级，已绑定的助教自动同步可见，无需重新邀请',
                '支持多人使用同一个邀请码，多位助教可同时绑定',
                '解除绑定后，助教将立即失去所有班级和相关资料的访问权限',
                '助教仅拥有查看权限，不能创建、编辑或删除任何班级内容',
                '助教拥有自己独立的私人知识库，可自由管理自己的私有内容',
              ].map((text, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
