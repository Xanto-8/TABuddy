'use client'

import { memo, useEffect, useMemo, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, BookOpen, ClipboardList, GraduationCap, FileText,
  MessageSquare, Settings,
  HelpCircle, X, GitBranch, Sun, Moon, Shield, Users, Activity,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { useAuth } from '@/lib/auth-store'
import { useRoleAccess } from '@/lib/use-role-access'
import { cn } from '@/lib/utils'

const MAIN_MENU_ITEMS = [
  { icon: LayoutDashboard, label: '仪表盘', href: '/dashboard' },
  { icon: GitBranch, label: '我的工作流', href: '/workflow' },
  { icon: GraduationCap, label: '班级管理', href: '/classes' },
  { icon: FileText, label: '作业管理', href: '/homework' },
  { icon: ClipboardList, label: '随堂测验', href: '/quizzes' },
  { icon: MessageSquare, label: '反馈管理', href: '/feedback' },
  { icon: BookOpen, label: '知识库管理', href: '/knowledge-base' },
] as const

const SECONDARY_MENU_ITEMS = [
  { icon: Settings, label: '设置', href: '/settings' },
] as const

interface NavItemProps {
  icon: typeof LayoutDashboard
  label: string
  href: string
  expanded: boolean
  isActive: boolean
  isSecondary?: boolean
}

const NavItem = memo(function NavItem({ icon: Icon, label, href, expanded, isActive, isSecondary }: NavItemProps) {
  return (
    <Link href={href} className="block">
      <div
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors duration-150',
          expanded ? 'justify-start' : 'justify-center',
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
          isSecondary && 'text-xs'
        )}
        title={label}
      >
        <Icon size={isSecondary ? 16 : 20} className={cn('shrink-0', isActive && 'text-primary')} />
        {expanded && <span className="truncate">{label}</span>}
      </div>
    </Link>
  )
})

function Logo({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn(
      'flex items-center h-16 px-4 border-b border-border shrink-0',
      expanded ? 'justify-start gap-3' : 'justify-center'
    )}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm shrink-0">
        T
      </div>
      {expanded && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">TABuddy</p>
          <p className="text-[10px] text-muted-foreground">助教工作台</p>
        </div>
      )}
    </div>
  )
}

function SidebarDivider({ expanded }: { expanded: boolean }) {
  return (
    <div className={cn('py-2', expanded ? 'px-3' : 'px-0 flex justify-center')}>
      <div className={cn('border-t border-border', expanded ? 'flex-1' : 'w-8')} />
    </div>
  )
}

function NavArea({ expanded }: { expanded: boolean }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isSuperAdmin, isClassAdmin } = useRoleAccess()

  const mainItems = useMemo(() =>
    MAIN_MENU_ITEMS.map(item => ({
      ...item,
      isActive: pathname === item.href
    })),
    [pathname]
  )

  const superAdminItems = useMemo(() =>
    [
      { icon: Activity, label: '超级管理员面板', href: '/admin/dashboard' },
      { icon: Users, label: '班级管理', href: '/admin/classes' },
      { icon: Shield, label: '公共知识库管理', href: '/admin/knowledge-base' },
      { icon: Users, label: '用户管理', href: '/admin/users' },
    ].map(item => ({
      ...item,
      isActive: pathname === item.href
    })),
    [pathname]
  )

  const secondaryItems = useMemo(() =>
    SECONDARY_MENU_ITEMS.map(item => ({
      ...item,
      isActive: pathname === item.href
    })),
    [pathname]
  )

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1 scrollbar-none">
      {mainItems.map((item) => (
        <NavItem key={item.href} {...item} expanded={expanded} />
      ))}
      {isSuperAdmin && (
        <>
          <SidebarDivider expanded={expanded} />
          {superAdminItems.map((item) => (
            <NavItem key={item.href} {...item} expanded={expanded} isSecondary />
          ))}
        </>
      )}
      <SidebarDivider expanded={expanded} />
      {secondaryItems.map((item) => (
        <NavItem key={item.label} {...item} expanded={expanded} isSecondary />
      ))}
    </nav>
  )
}

function BottomSection({ expanded, onManualToggle }: { expanded: boolean; onManualToggle: () => void }) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const isHelpActive = pathname === '/help'

  return (
    <div className="border-t border-border shrink-0">
      <Link href="/help" className="block">
        <div
          className={cn(
            'flex items-center gap-3 w-full h-11 px-4 text-xs transition-colors duration-150',
            expanded ? 'justify-start' : 'justify-center',
            isHelpActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
          )}
          title="帮助与反馈"
        >
          <HelpCircle size={16} className="shrink-0" />
          {expanded && <span className="truncate">帮助与反馈</span>}
        </div>
      </Link>
      <div className="flex items-center justify-between h-12 px-4 border-t border-border">
        <button
          onClick={() => {
            onManualToggle()
            setTheme(isDark ? 'light' : 'dark')
          }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? <Sun size={16} className="shrink-0" /> : <Moon size={16} className="shrink-0" />}
          {expanded && <span className="text-xs">{isDark ? '浅色模式' : '深色模式'}</span>}
        </button>
      </div>
    </div>
  )
}

function SidebarContent({ expanded, onClose }: { expanded: boolean; onClose: () => void }) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-end h-16 px-4 border-b border-border shrink-0 lg:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label="关闭侧边栏"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <NavArea expanded={expanded} />
    </div>
  )
}

export const Sidebar = memo(function Sidebar() {
  const { isOpen: expanded, setOpen: setExpanded } = useSidebar()
  const { setTheme } = useTheme()
  const userManuallySet = useRef(false)

  useEffect(() => {
    if (userManuallySet.current) return
    const hour = new Date().getHours()
    const initialTheme = hour >= 6 && hour < 18 ? 'light' : 'dark'
    setTheme(initialTheme)

    const interval = setInterval(() => {
      if (userManuallySet.current) return
      const currentHour = new Date().getHours()
      const targetTheme = currentHour >= 6 && currentHour < 18 ? 'light' : 'dark'
      setTheme(targetTheme)
    }, 60000)

    return () => clearInterval(interval)
  }, [setTheme])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && expanded) {
        setExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown, { passive: true })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [expanded, setExpanded])

  const handleManualToggle = useCallback(() => {
    userManuallySet.current = true
  }, [])

  const handleClose = useCallback(() => {
    setExpanded(false)
  }, [setExpanded])

  const sidebarClasses = cn(
    'fixed left-0 top-0 z-40 flex-col bg-card border-r border-border shadow-lg shadow-black/5',
    'h-screen',
    'w-[220px] will-change-transform',
    expanded ? 'translate-x-0' : '-translate-x-full'
  )

  const sidebarTransition = { transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)' }

  return (
    <>
      <aside
        className={cn(sidebarClasses, 'hidden lg:flex')}
        style={sidebarTransition}
      >
        <Logo expanded />
        <SidebarContent expanded onClose={handleClose} />
        <BottomSection expanded onManualToggle={handleManualToggle} />
      </aside>

      {expanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={handleClose}
        />
      )}

      <aside
        className={cn(sidebarClasses, 'lg:hidden flex')}
        style={sidebarTransition}
      >
        <Logo expanded />
        <SidebarContent expanded onClose={handleClose} />
        <BottomSection expanded onManualToggle={handleManualToggle} />
      </aside>
    </>
  )
})

export { MAIN_MENU_ITEMS }
