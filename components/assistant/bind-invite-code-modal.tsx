'use client'

import { useState } from 'react'
import { X, Loader2, KeyRound, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-store'

interface BindInviteCodeModalProps {
  onClose: () => void
  onSuccess: () => void
}

export function BindInviteCodeModal({ onClose, onSuccess }: BindInviteCodeModalProps) {
  const { getToken } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'input' | 'success'>('input')
  const [teacherName, setTeacherName] = useState('')

  const handleBind = async () => {
    const code = inviteCode.trim().toUpperCase()
    if (!code) {
      setError('请输入邀请码')
      return
    }
    if (code.length !== 6) {
      setError('邀请码为6位字符')
      return
    }

    setLoading(true)
    setError('')

    const token = getToken()

    try {
      const res = await fetch('/api/invite-code/bind', {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '绑定失败，请检查邀请码')
        return
      }

      setTeacherName(data.data?.teacher?.displayName || data.data?.teacher?.username || '老师')
      setStep('success')

      setTimeout(() => {
        onSuccess()
      }, 1500)
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            {step === 'input' ? '绑定老师班级' : '绑定成功'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'input' && (
          <div className="px-6 py-6 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
              <KeyRound className="w-5 h-5 text-primary shrink-0" />
              <p className="text-sm text-muted-foreground">
                请输入班级管理员提供给您的邀请码，绑定后将自动获取该老师名下所有班级的查看权限。
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                邀请码
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase())
                  setError('')
                }}
                placeholder="请输入6位邀请码"
                maxLength={6}
                className="w-full h-11 px-4 text-lg tracking-[0.3em] font-mono text-center rounded-xl border border-input bg-background placeholder:text-muted-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleBind()
                }}
              />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>

            <button
              onClick={handleBind}
              disabled={loading || !inviteCode.trim()}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在绑定...
                </>
              ) : (
                '确认绑定'
              )}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              绑定后，您将获得该老师名下所有班级的查看权限
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="px-6 py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">绑定成功！</p>
              <p className="text-sm text-muted-foreground mt-1">
                已成功绑定老师 <span className="font-medium text-foreground">{teacherName}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                正在加载班级数据...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
