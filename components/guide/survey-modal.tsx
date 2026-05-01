'use client'

import React, { useState } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

interface SurveyModalProps {
  surveyUrl: string
  onConfirm: () => Promise<void>
}

export function SurveyModal({ surveyUrl, onConfirm }: SurveyModalProps) {
  const [loading, setLoading] = useState(false)
  const [iframeError, setIframeError] = useState(false)
  const [iframeLoading, setIframeLoading] = useState(true)

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-purple-50 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              问卷调查
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              请填写以下问卷，提交后点击底部按钮进入系统
            </p>
          </div>
        </div>

        <div className="flex-1 relative bg-gray-50 min-h-0">
          {iframeLoading && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">正在加载问卷...</p>
              </div>
            </div>
          )}

          {iframeError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="flex flex-col items-center gap-3 text-center max-w-md">
                <AlertTriangle className="w-12 h-12 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-700">问卷加载失败</h3>
                <p className="text-sm text-gray-500">
                  无法加载问卷，请检查网络连接后刷新页面重试。
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  如果问题持续存在，请联系系统管理员。
                </p>
              </div>
            </div>
          ) : (
            <iframe
              src={surveyUrl}
              className="w-full h-full border-0"
              title="问卷调查"
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
              '已提交反馈并关闭'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
