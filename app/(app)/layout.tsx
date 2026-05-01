'use client'

import React from 'react'
import { AuthGuard } from '@/components/auth/auth-guard'
import { GuideGuard } from '@/components/guide/guide-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { ContentArea } from '@/components/layout/content-area'
import { FloatingChatAssistant } from '@/components/floating-chat/floating-chat-assistant'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <GuideGuard>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <ContentArea>
            {children}
          </ContentArea>
        </div>
      </GuideGuard>
      <FloatingChatAssistant />
    </AuthGuard>
  )
}
