'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-store'
import { Shield, Ban, Trash2, Unlock, Search, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface BannedIP {
  id: string
  ip: string
  reason: string
  bannedByName: string
  createdAt: string
}

export default function BannedIPsPage() {
  const { user, token } = useAuth()
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [unbanning, setUnbanning] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/banned-ips', {
        headers: { authorization: `Bearer ${token}` },
      })
      const result = await res.json()
      if (res.ok && result.data) {
        setBannedIPs(result.data)
      }
    } catch {
      console.error('获取封禁列表失败')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (token) fetchData()
  }, [token, fetchData])

  const handleUnban = async (item: BannedIP) => {
    setUnbanning(item.id)
    try {
      const res = await fetch('/api/admin/banned-ips', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: item.id, ip: item.ip }),
      })
      const result = await res.json()
      if (res.ok) {
        setBannedIPs(prev => prev.filter(b => b.id !== item.id))
      } else {
        alert(result.error || '撤销封禁失败')
      }
    } catch {
      alert('网络错误')
    } finally {
      setUnbanning(null)
      setShowConfirm(null)
    }
  }

  const filteredIPs = bannedIPs.filter(item => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return item.ip.includes(q) || item.reason.toLowerCase().includes(q) || item.bannedByName.toLowerCase().includes(q)
  })

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Ban className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-muted-foreground">仅超级管理员可访问此页面</p>
          <Link href="/admin/users" className="text-sm text-primary hover:underline">返回用户管理</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href="/admin/users" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Ban className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              IP封禁管理
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">管理被封禁的IP地址，支持撤销封禁</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            刷新
          </button>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Shield className="w-3 h-3 inline mr-0.5" />
            超级管理员
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索IP地址、原因、操作人..."
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredIPs.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <Ban className="w-10 h-10 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">{searchQuery ? '未找到匹配的封禁记录' : '暂无封禁的IP地址'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">共 {filteredIPs.length} 条封禁记录</div>
          {filteredIPs.map(item => (
            <div key={item.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                    <Ban className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium">{item.ip}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.reason}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfirm(item.id)}
                  disabled={unbanning === item.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 shrink-0"
                >
                  {unbanning === item.id ? (
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5" />
                  )}
                  撤销封禁
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>操作人: {item.bannedByName}</span>
                <span>封禁时间: {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(null)}>
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-green-500">撤销封禁</h3>
                <p className="text-xs text-muted-foreground">确定要解封该IP地址吗？</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3 text-sm space-y-1">
              {(() => {
                const item = bannedIPs.find(b => b.id === showConfirm)
                return item ? (
                  <>
                    <p>IP: <strong>{item.ip}</strong></p>
                    <p>原因: {item.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">解封后该IP可以重新注册和登录</p>
                  </>
                ) : null
              })()}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={unbanning !== null}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const item = bannedIPs.find(b => b.id === showConfirm)
                  if (item) handleUnban(item)
                }}
                disabled={unbanning !== null}
                className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {unbanning ? (
                  '处理中...'
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    确认解封
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
