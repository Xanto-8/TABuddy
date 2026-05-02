'use client'

import React from 'react'
import { Sparkles } from 'lucide-react'

function SkeletonBlock({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-muted/60 via-muted/40 to-muted/60 bg-[length:200%_100%] animate-shimmer ${className}`}
      style={style}
    />
  )
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <SkeletonBlock className="w-5 h-5 rounded-lg" />
        <SkeletonBlock className="h-4 w-28 rounded" />
      </div>
      <div className="space-y-2.5">
        <SkeletonBlock className="h-3 w-full rounded" />
        <SkeletonBlock className="h-3 w-3/4 rounded" />
        <SkeletonBlock className="h-3 w-1/2 rounded" />
      </div>
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex gap-4">
          <SkeletonBlock className="h-10 w-16 rounded-lg" />
          <SkeletonBlock className="h-10 w-16 rounded-lg" />
          <SkeletonBlock className="h-10 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function DataLoadingScreen() {
  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-background rounded-xl p-4 sm:p-6 border border-border/50 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary/40" />
              <SkeletonBlock className="h-5 w-48 rounded" />
            </div>
            <div className="flex flex-wrap gap-3">
              {[120, 80, 96, 64].map((w, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <SkeletonBlock className="h-3.5 w-3.5 rounded" />
                  <SkeletonBlock className="h-3 rounded" style={{ width: w }} />
                </div>
              ))}
            </div>
          </div>
          <SkeletonBlock className="h-9 w-24 rounded-xl shrink-0" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-background/50 rounded-lg p-3 border border-border/30">
              <SkeletonBlock className="h-3 w-16 rounded mb-2" />
              <SkeletonBlock className="h-7 w-10 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-5 h-5 rounded-lg" />
              <SkeletonBlock className="h-4 w-28 rounded" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="w-6 h-6 rounded-lg" />
              <SkeletonBlock className="h-4 w-16 rounded" />
              <SkeletonBlock className="w-6 h-6 rounded-lg" />
            </div>
          </div>
          <SkeletonBlock className="h-[180px] w-full rounded-lg" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SkeletonBlock className="w-5 h-5 rounded-lg" />
            <SkeletonBlock className="h-4 w-28 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-accent/30 rounded-lg p-3 flex flex-col items-center gap-1.5">
                <SkeletonBlock className="w-8 h-8 rounded-xl" />
                <SkeletonBlock className="h-3 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SkeletonBlock className="w-5 h-5 rounded-lg" />
            <SkeletonBlock className="h-4 w-28 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SkeletonBlock className="w-2 h-2 rounded-full" />
                  <SkeletonBlock className="h-3 w-24 rounded" />
                </div>
                <SkeletonBlock className="h-3 w-10 rounded" />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-20 rounded" />
              <SkeletonBlock className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SkeletonBlock className="w-5 h-5 rounded-lg" />
            <SkeletonBlock className="h-4 w-28 rounded" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-3">
                <SkeletonBlock className="w-8 h-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonBlock className="h-3 w-32 rounded" />
                  <SkeletonBlock className="h-2.5 w-20 rounded" />
                </div>
                <SkeletonBlock className="h-5 w-12 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <SkeletonBlock className="w-5 h-5 rounded-lg" />
            <SkeletonBlock className="h-4 w-28 rounded" />
          </div>
          <div className="flex flex-col items-center gap-4 py-2">
            <SkeletonBlock className="w-32 h-32 rounded-full" />
            <SkeletonBlock className="h-4 w-24 rounded" />
            <div className="flex gap-3 w-full">
              <SkeletonBlock className="h-9 flex-1 rounded-xl" />
              <SkeletonBlock className="h-9 flex-1 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
