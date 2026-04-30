'use client'

import React, { use } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { ContentArea } from '@/components/layout/content-area'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <ContentArea>
        {children}
      </ContentArea>
    </div>
  )
}

import { usePathname } from 'next/navigation'
