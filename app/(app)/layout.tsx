'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthGuard } from '@/components/auth/auth-guard'
import { GuideGuard } from '@/components/guide/guide-guard'
import { Sidebar } from '@/components/layout/sidebar'
import { ContentArea } from '@/components/layout/content-area'
import { FloatingChatAssistant } from '@/components/floating-chat/floating-chat-assistant'
import { DataLoadingScreen } from '@/components/layout/data-loading-screen'
import { isCacheLoaded } from '@/lib/store'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [dataReady, setDataReady] = useState(false)

  useEffect(() => {
    if (isCacheLoaded()) {
      setDataReady(true)
      return
    }
    const handler = () => setDataReady(true)
    window.addEventListener('appDataReady', handler)
    return () => window.removeEventListener('appDataReady', handler)
  }, [])

  return (
    <AuthGuard>
      <GuideGuard>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <ContentArea>
            <AnimatePresence mode="wait">
              {dataReady ? (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              ) : (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <DataLoadingScreen />
                </motion.div>
              )}
            </AnimatePresence>
          </ContentArea>
        </div>
      </GuideGuard>
      <FloatingChatAssistant />
    </AuthGuard>
  )
}
