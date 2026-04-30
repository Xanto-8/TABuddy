'use client'

import React, { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, User, Lock, Eye, EyeOff, Upload, UserCircle2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCharacterInteraction } from './character-interaction-context'

interface LoginFormProps {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<boolean>
  onSwitchToRegister: () => void
}

interface RegisterFormProps {
  onRegister: (username: string, password: string, avatar?: string) => Promise<boolean>
  onSwitchToLogin: () => void
}

function InputField({
  label,
  type = 'text',
  value,
  onChange,
  onFocus,
  onBlur,
  icon,
  placeholder,
  showToggle,
  toggleValue,
  onToggle,
  disabled,
  interactionField,
}: {
  label: string
  type?: string
  value: string
  onChange: (val: string) => void
  onFocus?: () => void
  onBlur?: () => void
  icon: React.ReactNode
  placeholder?: string
  showToggle?: boolean
  toggleValue?: boolean
  onToggle?: () => void
  disabled?: boolean
  interactionField?: 'username' | 'password'
}) {
  const [focused, setFocused] = useState(false)
  const { onUsernameFocus, onUsernameBlur, onPasswordFocus, onPasswordBlur } = useCharacterInteraction()

  const handleFocus = () => {
    setFocused(true)
    if (interactionField === 'username') onUsernameFocus()
    if (interactionField === 'password') onPasswordFocus()
    onFocus?.()
  }

  const handleBlur = () => {
    setFocused(false)
    if (interactionField === 'username') onUsernameBlur()
    if (interactionField === 'password') onPasswordBlur()
    onBlur?.()
  }

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className={cn(
          'relative flex items-center rounded-xl border transition-all duration-200',
          focused ? 'border-primary ring-2 ring-primary/20' : 'border-input',
          'bg-background'
        )}
      >
        <span className="pl-3 text-muted-foreground">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-muted-foreground disabled:opacity-50"
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="pr-3 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {toggleValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  )
}

function AvatarUpload({
  avatar,
  onChange,
}: {
  avatar: string
  onChange: (avatar: string) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="text-sm font-medium text-foreground">头像</label>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="group relative cursor-pointer"
      >
        <div
          className={cn(
            'w-20 h-20 rounded-full flex items-center justify-center border-2 border-dashed transition-all duration-200',
            avatar
              ? 'border-primary bg-primary/5'
              : 'border-input bg-muted/50 group-hover:border-primary/50 group-hover:bg-primary/5'
          )}
        >
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserCircle2 className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <div
          className={cn(
            'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-all',
            avatar
              ? 'bg-primary text-white'
              : 'bg-background border border-input text-muted-foreground group-hover:text-primary'
          )}
        >
          {avatar ? <Check className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      {avatar && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          移除头像
        </button>
      )}
    </div>
  )
}

export function LoginForm({ onLogin, onSwitchToRegister }: LoginFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onLogin(username, password, rememberMe)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">欢迎回来</h1>
        <p className="text-sm text-muted-foreground">请输入您的账号信息</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <InputField
          label="用户名"
          value={username}
          onChange={setUsername}
          icon={<User className="h-4 w-4" />}
          placeholder="请输入用户名"
          interactionField="username"
        />
        <InputField
          label="密码"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          icon={<Lock className="h-4 w-4" />}
          placeholder="请输入密码"
          showToggle
          toggleValue={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          interactionField="password"
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div
              onClick={() => setRememberMe(!rememberMe)}
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center transition-all',
                rememberMe
                  ? 'bg-primary border-primary'
                  : 'border-input group-hover:border-primary/50'
              )}
            >
              {rememberMe && <Check className="h-3 w-3 text-white" />}
            </div>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              记住我
            </span>
          </label>
        </div>

        <Button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full h-11 text-sm font-medium"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            '登录'
          )}
        </Button>
      </form>

      <div className="text-center">
        <span className="text-sm text-muted-foreground">还没有账号？</span>
        <button
          onClick={onSwitchToRegister}
          className="ml-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          注册账号
        </button>
      </div>
    </div>
  )
}

export function RegisterForm({ onRegister, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [avatar, setAvatar] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const passwordsDiffer = confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordsMatch) return
    setLoading(true)
    try {
      await onRegister(username, password, avatar || undefined)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-sm mx-auto space-y-5">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold text-foreground">创建账号</h1>
        <p className="text-sm text-muted-foreground">加入 TABuddy，开始高效助教之旅</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        <AvatarUpload avatar={avatar} onChange={setAvatar} />

        <InputField
          label="用户名"
          value={username}
          onChange={setUsername}
          icon={<User className="h-4 w-4" />}
          placeholder="请输入用户名"
          interactionField="username"
        />
        <InputField
          label="密码"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          icon={<Lock className="h-4 w-4" />}
          placeholder="请设置密码"
          showToggle
          toggleValue={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
          interactionField="password"
        />
        <InputField
          label="确认密码"
          type={showConfirmPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={setConfirmPassword}
          icon={<Lock className="h-4 w-4" />}
          placeholder="请再次输入密码"
          showToggle
          toggleValue={showConfirmPassword}
          onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
        />
        {passwordsDiffer && (
          <p className="text-xs text-destructive -mt-2">两次输入的密码不一致</p>
        )}

        <Button
          type="submit"
          disabled={loading || !username || !password || !confirmPassword || !passwordsMatch}
          className="w-full h-11 text-sm font-medium"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            '注册'
          )}
        </Button>
      </form>

      <div className="text-center">
        <span className="text-sm text-muted-foreground">已有账号？</span>
        <button
          onClick={onSwitchToLogin}
          className="ml-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          立即登录
        </button>
      </div>
    </div>
  )
}

export function FlipAuthCard({
  onLogin,
  onRegister,
}: {
  onLogin: (username: string, password: string, rememberMe: boolean) => Promise<boolean>
  onRegister: (username: string, password: string, avatar?: string) => Promise<boolean>
}) {
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div
      className="w-full max-w-md mx-auto"
      style={{ perspective: '1200px' }}
    >
      <div
        className="relative w-full"
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        <div
          className="w-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-lg p-6 md:p-8">
            <LoginForm
              onLogin={onLogin}
              onSwitchToRegister={() => setIsFlipped(true)}
            />
          </div>
        </div>

        <div
          className="absolute inset-0 w-full"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-lg p-6 md:p-8">
            <RegisterForm
              onRegister={onRegister}
              onSwitchToLogin={() => setIsFlipped(false)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
