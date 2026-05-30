'use client'

import { useState, useEffect, useCallback } from 'react'
import { Check, X, Bell, RefreshCw } from 'lucide-react'

interface PendingSync {
  id: string
  className: string
  classType: string
  color: string
  assistantId: string
  assistantName: string
  teacherName: string
  status: string
  createdAt: string
}

export function PendingSyncRequests() {
  const [requests, setRequests] = useState<PendingSync[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('tabuddy_auth_token')
      if (!token) return
      const res = await fetch('/api/data/pending-syncs', {
        headers: { authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.data) setRequests(data.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessing(requestId)
    setMessage(null)
    try {
      const token = localStorage.getItem('tabuddy_auth_token')
      if (!token) return
      const res = await fetch('/api/data/pending-syncs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ requestId, action }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.data?.message || '操作成功' })
        setRequests(prev => prev.filter(r => r.id !== requestId))
        import('@/lib/store').then(m => m.loadAllDataFromAPI()).catch(console.error)
        setTimeout(() => window.dispatchEvent(new CustomEvent('classDataChanged')), 500)
      } else {
        setMessage({ type: 'error', text: data.error || '操作失败' })
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误' })
    } finally {
      setProcessing(null)
    }
  }

  if (requests.length === 0 && !loading) return null

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-900/20 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-amber-200 dark:border-amber-900/50">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            待审批的班级同步请求
          </h3>
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
            {requests.length}
          </span>
        </div>
        <button
          onClick={fetchRequests}
          className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-800/50 transition-colors"
          title="刷新"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
        </button>
      </div>

      {message && (
        <div className={`px-4 py-2 text-xs ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
          {message.text}
        </div>
      )}

      <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
        {requests.map(r => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{r.className}</p>
              <p className="text-xs text-muted-foreground">
                来自助教 <span className="font-medium">{r.assistantName}</span>
                {r.classType && <span> · {r.classType}</span>}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAction(r.id, 'reject')}
                disabled={processing === r.id}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-border hover:bg-accent transition-colors disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                拒绝
              </button>
              <button
                onClick={() => handleAction(r.id, 'approve')}
                disabled={processing === r.id}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                {processing === r.id ? (
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                通过
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
