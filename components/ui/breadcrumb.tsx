'use client'

import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

const PATH_MAP: Record<string, string> = {
  'dashboard': '工作台',
  'classes': '班级管理',
  'homework': '作业管理',
  'quizzes': '小测管理',
  'feedback': '课程反馈',
  'knowledge-base': '知识库',
  'students': '学生管理',
  'stats': '数据看板',
  'settings': '设置',
  'workflow': '工作流',
  'help': '帮助',
  'resources': '资源',
  'assistant-management': '助教管理',
  'push-logs': '推送日志',
  'admin': '管理员',
}

export function Breadcrumb() {
  const pathname = usePathname()
  
  const segments = pathname.split('/').filter(Boolean)
  
  const items: BreadcrumbItem[] = [{ label: '首页', href: '/dashboard' }]
  
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    if (seg === '(app)') continue
    
    const href = '/' + segments.slice(0, i + 1).join('/')
    const label = PATH_MAP[seg] || seg
    
    if (i === segments.length - 1) {
      items.push({ label })
    } else {
      items.push({ label, href })
    }
  }
  
  if (items.length <= 1) return null
  
  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-4" aria-label="面包屑导航">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          {item.href ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}
