'use client'

import React, { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface GuideModalProps {
  guideUrl: string
  role: string
  onConfirm: () => Promise<void>
}

export function GuideModal({ guideUrl, role, onConfirm }: GuideModalProps) {
  const [loading, setLoading] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)

  const roleLabel = role === 'classadmin' || role === 'superadmin' ? '班级管理员' : '助教'

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col w-[90vw] h-[90vh] max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {roleLabel}使用说明书
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              请仔细阅读以下使用说明，阅读完毕后点击底部按钮确认
            </p>
          </div>
        </div>

        <div className="flex-1 relative bg-gray-50 min-h-0">
          {iframeLoading && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">正在加载使用说明书...</p>
              </div>
            </div>
          )}

          {iframeError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3 text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-700">文档加载失败</h3>
                <p className="text-sm text-gray-500">
                  无法加载使用说明书，请检查网络连接后刷新页面重试。
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  如果问题持续存在，请联系系统管理员配置正确的文档链接。
                </p>
              </div>
            </div>
          ) : (
            <iframe
              src={guideUrl}
              className="w-full h-full border-0"
              title="使用说明书"
              onLoad={() => setIframeLoading(false)}
              onError={() => {
                setIframeError(true)
                setIframeLoading(false)
              }}
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-white shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm
              hover:bg-primary/90 transition-colors duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-sm"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                处理中...
              </span>
            ) : (
              '我已阅读并清楚'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
