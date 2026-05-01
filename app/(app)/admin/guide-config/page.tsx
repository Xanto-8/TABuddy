'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-store'
import { useRouter } from 'next/navigation'
import { useRoleAccess } from '@/lib/use-role-access'
import { toast } from 'sonner'
import { Loader2, Save, ExternalLink } from 'lucide-react'

export default function GuideConfigPage() {
  const { getToken } = useAuth()
  const { isSuperAdmin } = useRoleAccess()
  const router = useRouter()

  const [adminGuideUrl, setAdminGuideUrl] = useState('')
  const [assistantGuideUrl, setAssistantGuideUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/dashboard')
      return
    }

    const fetchConfig = async () => {
      try {
        const token = getToken()
        const res = await fetch('/api/admin/guide-config', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const result = await res.json()
        if (result.data) {
          setAdminGuideUrl(result.data.adminGuideUrl || '')
          setAssistantGuideUrl(result.data.assistantGuideUrl || '')
        }
      } catch (error) {
        console.error('获取配置失败:', error)
        toast.error('获取配置失败')
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [isSuperAdmin, router, getToken])

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/guide-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminGuideUrl: adminGuideUrl.trim(),
          assistantGuideUrl: assistantGuideUrl.trim(),
        }),
      })

      if (res.ok) {
        toast.success('配置保存成功')
      } else {
        const result = await res.json()
        toast.error(result.error || '保存失败')
      }
    } catch {
      toast.error('网络错误，保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">加载配置中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">系统配置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理新用户首次登录时弹出的使用说明书语雀文档链接
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            班级管理员说明书语雀链接
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            班级管理员角色（含超级管理员）首次登录时将看到此文档
          </p>
          <input
            type="url"
            value={adminGuideUrl}
            onChange={(e) => setAdminGuideUrl(e.target.value)}
            placeholder="https://www.yuque.com/..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground
              placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30
              text-sm transition-shadow"
          />
          {adminGuideUrl && (
            <a
              href={adminGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              预览链接
            </a>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            助教说明书语雀链接
          </label>
          <p className="text-xs text-muted-foreground mb-3">
            普通助教角色首次登录时将看到此文档
          </p>
          <input
            type="url"
            value={assistantGuideUrl}
            onChange={(e) => setAssistantGuideUrl(e.target.value)}
            placeholder="https://www.yuque.com/..."
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground
              placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30
              text-sm transition-shadow"
          />
          {assistantGuideUrl && (
            <a
              href={assistantGuideUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              预览链接
            </a>
          )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-800">
            <strong>提示：</strong>请确保语雀文档已设置为「公开」，任何人可查看。
            链接为空时将使用默认的说明书链接。
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl
              font-medium text-sm hover:bg-primary/90 transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                保存配置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
