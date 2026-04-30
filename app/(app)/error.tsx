'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-5">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">页面加载失败</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          {error.message || '渲染时发生了意外错误，请尝试刷新。'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all text-sm font-medium"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          重新加载
        </button>
      </div>
    </div>
  )
}
