'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProgress } from '@/components/providers/progress-provider'
import { Search, User, ChevronDown, Home, Menu, LogOut, Settings, RefreshCw, UserPlus, Trash2, Shield, Check, X, Loader2, SearchX } from 'lucide-react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { Button } from '@/components/ui/button'
import { ConfettiEffect } from '@/components/ui/confetti-effect'
import { useSidebar } from '@/components/providers/sidebar-provider'
import { NotificationCenter } from '@/components/notification/notification-center'
import { useAuth } from '@/lib/auth-store'
import { getSavedAccounts, saveAccount, removeAccount, savePassword, removePassword, type SavedAccount, ACCOUNT_PROFILES } from '@/lib/account-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function Header() {
  const router = useRouter()
  const { isOpen: expanded, setOpen, toggle } = useSidebar()
  const { courseTotalTasks, courseCompletedTasks, courseProgress, currentClass, showCelebration, dismissCelebration } = useProgress()
  const { user, logout } = useAuth()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const profile = user ? ACCOUNT_PROFILES[user.username] : null

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (mobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [mobileSearchOpen])

  const goHome = () => {
    setOpen(true)
    router.push('/dashboard')
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    router.push('/auth/login')
  }

  const handleSwitchClick = () => {
    setDropdownOpen(false)
    setShowSwitchModal(true)
  }

  return (
    <>
      <ConfettiEffect active={showCelebration} onComplete={dismissCelebration} />
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-6">
      <div className="flex flex-1 items-center gap-2 md:gap-4">
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title="切换菜单"
        >
          <Menu className="h-5 w-5" />
        </button>
        <button
          onClick={toggle}
          className="hidden lg:flex p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
          title={expanded ? '收起侧栏' : '展开侧栏'}
        >
          <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" y="0.5" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="7" y1="3" x2="7" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        </button>

        {mobileSearchOpen ? (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="relative flex-1 max-w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="search"
                placeholder="搜索任务、学生或资源..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="搜索"
            >
              <Search className="h-5 w-5" />
            </button>
            <div className="hidden lg:block flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="搜索任务、学生或资源..."
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            <div className="hidden lg:block ml-6 w-64">
              {currentClass ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">当前课程进度</span>
                    <span className="text-muted-foreground">
                      {courseCompletedTasks}/{courseTotalTasks} 任务
                    </span>
                  </div>
                  <ProgressBar value={courseProgress} />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>还有 {courseTotalTasks - courseCompletedTasks} 个任务待完成</span>
                    <span>{courseProgress}%</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  暂无课程
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 md:gap-3 ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={goHome}
                className="hover:bg-accent text-muted-foreground hover:text-foreground"
                title="回到主页"
              >
                <Home className="h-5 w-5" />
              </Button>
              <NotificationCenter />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 rounded-lg hover:bg-accent/50 transition-colors px-1 md:px-2 py-1.5"
                >
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-medium">{profile?.displayName || user?.username || '用户'}</p>
                    <p className="text-xs text-muted-foreground">{profile?.subtitle || ''}</p>
                  </div>
                  <div className="relative">
                    {user?.avatar ? (
                      <div className="h-8 w-8 md:h-9 md:w-9 rounded-full overflow-hidden border-2 border-background">
                        <img
                          src={user.avatar}
                          alt="头像"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling
                            if (fallback) (fallback as HTMLElement).style.display = 'flex'
                          }}
                        />
                        <div className="hidden h-full w-full rounded-full bg-gradient-to-r from-primary to-secondary items-center justify-center" style={{ display: 'none' }}>
                          <Shield className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 md:h-4 md:w-4 rounded-full border-2 border-background bg-success" />
                  </div>
                  <ChevronDown className={cn('hidden md:block h-4 w-4 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-border bg-card shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium text-foreground">{profile?.displayName || user?.username}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">@{user?.username}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setDropdownOpen(false); router.push('/profile') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <User className="w-4 h-4 text-muted-foreground" />
                        个人信息
                      </button>
                      <button
                        onClick={handleSwitchClick}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                        切换账号
                      </button>
                      <button
                        onClick={() => { setDropdownOpen(false); router.push('/settings') }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
                      >
                        <Settings className="w-4 h-4 text-muted-foreground" />
                        设置
                      </button>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>

      {showSwitchModal && (
        <SwitchAccountModal
          currentUsername={user?.username || ''}
          onClose={() => setShowSwitchModal(false)}
          onSwitch={async (targetUsername) => {
            setSwitching(true)
            try {
              logout()
              setShowSwitchModal(false)
              toast.info('已退出，请登录新账号')
            } catch {
              toast.error('账号切换失败，请重试')
              setSwitching(false)
            }
          }}
          switching={switching}
        />
      )}
    </>
  )
}

function SwitchAccountModal({
  currentUsername,
  onClose,
  onSwitch,
  switching,
}: {
  currentUsername: string
  onClose: () => void
  onSwitch: (username: string) => Promise<void>
  switching: boolean
}) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setAccounts(getSavedAccounts())
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleAddAccount = () => {
    if (!newUsername.trim() || !newPassword.trim()) {
      toast.error('请填写用户名和密码')
      return
    }
    const exists = accounts.find(a => a.username === newUsername.trim())
    if (exists) {
      toast.error('该账号已存在')
      return
    }

    const profile = ACCOUNT_PROFILES[newUsername.trim()]
    savePassword(newUsername.trim(), newPassword.trim())
    const newAccount: SavedAccount = {
      username: newUsername.trim(),
      subtitle: profile?.subtitle || '',
    }
    saveAccount(newAccount)
    setAccounts(getSavedAccounts())
    setNewUsername('')
    setNewPassword('')
    setShowAddForm(false)
    toast.success('账号已添加')
  }

  const handleRemoveAccount = (username: string) => {
    if (username === currentUsername) {
      toast.error('不能删除当前登录的账号')
      return
    }
    removeAccount(username)
    setAccounts(getSavedAccounts())
    toast.success('账号已移除')
  }

  const handleSwitch = async (username: string) => {
    if (username === currentUsername) {
      onClose()
      return
    }
    await onSwitch(username)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-background/60 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="w-full max-w-md mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">切换账号</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto space-y-2">
          {accounts.map(account => {
            const isCurrent = account.username === currentUsername
            return (
              <div
                key={account.username}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                  isCurrent
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-border hover:bg-accent/50 cursor-pointer'
                )}
                onClick={() => !isCurrent && !switching && handleSwitch(account.username)}
              >
                <div className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                  account.role === 'superadmin'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : account.role === 'classadmin'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gradient-to-r from-primary to-secondary text-white'
                )}>
                  {account.role === 'superadmin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{account.displayName}</p>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0 flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        当前
                      </span>
                    )}
                    {account.role === 'superadmin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                        超级管理员
                      </span>
                    )}
                    {account.role === 'classadmin' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shrink-0">
                        班级管理员
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{account.username}{account.subtitle ? ` · ${account.subtitle}` : ''}</p>
                </div>
                {!isCurrent && !switching && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoveAccount(account.username) }}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 md:opacity-0 md:group-hover:opacity-100"
                    title="移除账号"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })}

          {showAddForm ? (
            <div className="p-4 rounded-xl border border-border bg-accent/30 space-y-3">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">用户名</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="输入用户名"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="输入密码"
                  className="w-full h-9 px-3 text-sm rounded-lg border border-input bg-background placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleAddAccount}
                  disabled={!newUsername.trim() || !newPassword.trim()}
                  className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40"
                >
                  添加
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              添加新账号
            </button>
          )}
        </div>

        {switching && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在切换账号...
          </div>
        )}
      </div>
    </div>
  )
}
