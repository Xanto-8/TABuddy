'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-store'
import { User, Lock, Eye, EyeOff, ShieldCheck, Camera } from 'lucide-react'
import { toast } from 'sonner'

const AnimatedCharacters = dynamic(
  () => import('@/components/ui/animated-characters').then((m) => m.AnimatedCharacters),
  { ssr: false }
)

export default function LoginPage() {
  const router = useRouter()
  const { user, login, register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [regUsername, setRegUsername] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [regShowPassword, setRegShowPassword] = useState(false)
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)
  const [regAvatar, setRegAvatar] = useState<File | null>(null)
  const [regAvatarPreview, setRegAvatarPreview] = useState('')
  const [regRole, setRegRole] = useState<'assistant' | 'classadmin'>('assistant')
  const [regTeacherCode, setRegTeacherCode] = useState('')
  const [regCodeVerifying, setRegCodeVerifying] = useState(false)
  const [regCodeVerified, setRegCodeVerified] = useState<boolean | null>(null)
  const [regCodeError, setRegCodeError] = useState('')
  const [isConverging, setIsConverging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const usernameTimer = useRef<ReturnType<typeof setTimeout>>()
  const passwordTimer = useRef<ReturnType<typeof setTimeout>>()

  if (user) {
    router.push('/dashboard')
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
    setIsTyping(true)
    clearTimeout(usernameTimer.current)
    usernameTimer.current = setTimeout(() => setIsTyping(false), 1000)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    clearTimeout(passwordTimer.current)
    passwordTimer.current = setTimeout(() => setIsTyping(false), 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const success = await login(username, password)
      if (success) {
        router.prefetch('/')
        setIsConverging(true)
      } else {
        setLoading(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败')
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')

    if (!regUsername || !regPassword || !regConfirmPassword) {
      setRegError('请填写所有注册信息')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('两次输入的密码不一致')
      return
    }

    if (regPassword.length < 6) {
      setRegError('密码长度至少为6位')
      return
    }

    if (regRole === 'classadmin' && !regTeacherCode.trim()) {
      setRegError('请填写老师注册码')
      return
    }

    setRegLoading(true)
    try {
      const code = regRole === 'classadmin' ? regTeacherCode.trim().toUpperCase() : undefined
      await register(regUsername, regPassword, code)
      toast.success('注册成功，请登录')
      setIsRegistering(false)
      setRegUsername('')
      setRegPassword('')
      setRegConfirmPassword('')
      setRegAvatar(null)
      setRegAvatarPreview('')
      setRegRole('assistant')
      setRegTeacherCode('')
      setRegCodeVerified(null)
      setRegCodeError('')
    } catch (err) {
      setRegError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setRegLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setRegAvatar(file)
      setRegAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveAvatar = () => {
    setRegAvatar(null)
    setRegAvatarPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <motion.div
      className="min-h-screen grid grid-cols-1 lg:grid-cols-2"
      animate={isConverging ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.85, ease: 'easeInOut' }}
      onAnimationComplete={() => {
        if (isConverging) router.push('/dashboard')
      }}
      style={{ transformOrigin: 'center center' }}
    >
      {/* Left Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #0f172a 0%, #1e3a8a 50%, #1e40af 100%)'
        }}
      >
        {/* Decorative blurs */}
        <div className="absolute top-[15%] right-[10%] w-[300px] h-[300px] rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(59, 130, 246, 0.25)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none z-0"
          style={{ background: 'rgba(30, 64, 175, 0.3)', filter: 'blur(100px)' }}
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Brand */}
        <div className="relative z-20 flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="white" fillOpacity="0.15" />
              <rect x="5" y="5" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
              <rect x="15" y="5" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="5" y="15" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="15" y="15" width="8" height="8" rx="2" fill="white" fillOpacity="0.3" />
            </svg>
          </div>
          <span className="text-white text-xl font-bold tracking-wider">TABuddy</span>
        </div>

        {/* Characters */}
        <div className="relative z-20 flex items-end justify-center" style={{ height: '500px' }}>
          <AnimatedCharacters
            isTyping={isTyping}
            showPassword={showPassword}
            passwordLength={password.length}
            isPasswordGuardMode={passwordFocused}
          />
        </div>

        <div />
      </div>

      {/* Right Panel */}
      <div className="flex items-start lg:items-center justify-center p-4 sm:p-6 md:p-12 overflow-y-auto min-h-0"
        style={{
          background: `
            radial-gradient(circle at 20% 0%, rgba(241, 245, 255, 0.9), transparent 35%),
            radial-gradient(circle at 90% 80%, rgba(221, 255, 246, 0.9), transparent 40%),
            linear-gradient(160deg, #f8fafc 0%, #eef2ff 52%, #ecfeff 100%)
          `,
        }}
      >
        {/* 3D Card Flip Container */}
        <div className="w-full max-w-[430px]" style={{ perspective: '1200px' }}>
          <motion.div
            className="relative min-h-[480px] sm:min-h-[520px]"
            style={{ transformStyle: 'preserve-3d' }}
            animate={{ rotateY: isRegistering ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Login Form (Front) */}
            <div
              className="rounded-2xl px-5 sm:px-8 py-[22px] sm:py-[30px] overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                background: 'rgba(255, 255, 255, 0.86)',
                border: '1px solid rgba(148, 163, 184, 0.24)',
                boxShadow: '0 24px 50px rgba(30, 41, 59, 0.12)',
                backdropFilter: 'blur(14px)',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148,163,184,0.4) transparent',
              }}
            >
              {/* WELCOME BACK Tag */}
              <p className="text-center mb-4 text-[11px] font-bold tracking-[0.14em] text-[#0f766e]">
                WELCOME BACK
              </p>

              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-3 sm:mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #ccfbf1 100%)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="2" fill="#1E40AF" fillOpacity="0.9" />
                    <rect x="15" y="5" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.7" />
                    <rect x="5" y="15" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.7" />
                    <rect x="15" y="15" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.4" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-[#0f172a]">TABuddy</span>
              </div>

              {/* Form Header */}
              <div className="text-center mb-7">
                <h1 className="text-[28px] font-bold tracking-[-0.03em] text-[#0b1220] mb-2 leading-tight">
                  进入 TABuddy 助教效率工具
                </h1>
                <p className="text-sm text-[#64748b] leading-relaxed">
                  高效管理你的助教任务与学生学情反馈
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    用户名
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      onFocus={() => setIsTyping(true)}
                      onBlur={() => setIsTyping(false)}
                      placeholder="请输入用户名"
                      className="w-full h-[50px] pl-11 pr-4 text-sm outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(248, 250, 252, 0.95)',
                        border: '1px solid #d8dee8',
                        borderRadius: '14px',
                        color: '#111827',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#14b8a6'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.matches(':focus')) {
                          e.currentTarget.style.borderColor = '#d8dee8'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = '#d8dee8'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                      }}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    访问密钥
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => {
                        setPasswordFocused(true)
                        setIsTyping(true)
                      }}
                      onBlur={() => {
                        setPasswordFocused(false)
                        setIsTyping(false)
                      }}
                      placeholder="请输入访问密钥"
                      className="w-full h-[50px] pl-11 pr-12 text-sm outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(248, 250, 252, 0.95)',
                        border: '1px solid #d8dee8',
                        borderRadius: '14px',
                        color: '#111827',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#14b8a6'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.matches(':focus')) {
                          e.currentTarget.style.borderColor = '#d8dee8'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = '#d8dee8'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                      }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f766e] transition-colors flex items-center"
                      tabIndex={-1}
                    >
                      {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-4 px-[14px] py-[11px] text-xs text-[#b91c1c] bg-[#fff1f2] border border-[#fecdd3] rounded-xl">
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: 0 }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-[46px] sm:h-[52px] text-[15px] font-semibold rounded-xl border-none tracking-wide cursor-pointer transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #22d3ee 100%)',
                      boxShadow: '0 14px 26px rgba(15, 118, 110, 0.24)',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 16px 28px rgba(15, 118, 110, 0.32)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 14px 26px rgba(15, 118, 110, 0.24)'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(1px)'
                      e.currentTarget.style.opacity = '0.85'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    {loading ? '安全验证中...' : '进入工作空间'}
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-[#64748b] mt-5 leading-relaxed" style={{ margin: '20px 6px 0' }}>
                By continuing, you agree to open collaboration and transparent development.
              </p>

              {/* Register Toggle Link */}
              <div className="text-center mt-5">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setError('') }}
                  className="text-sm text-[#0f766e] hover:text-[#14b8a6] font-medium transition-colors cursor-pointer bg-transparent border-none"
                >
                  还没有账号？<span className="underline underline-offset-2">注册</span>
                </button>
              </div>
            </div>

            {/* Register Form (Back) */}
            <div
              className="absolute inset-0 rounded-2xl px-5 py-[22px] sm:px-8 sm:py-[30px] overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                background: 'rgba(255, 255, 255, 0.86)',
                border: '1px solid rgba(148, 163, 184, 0.24)',
                boxShadow: '0 24px 50px rgba(30, 41, 59, 0.12)',
                backdropFilter: 'blur(14px)',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148,163,184,0.4) transparent',
              }}
            >
              {/* iOS scroll indicator hint */}
              <div className="sm:hidden flex justify-center mb-2 animate-bounce">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                </svg>
              </div>
              {/* Register Tag */}
              <p className="text-center mb-3 sm:mb-4 text-[11px] font-bold tracking-[0.14em] text-[#0f766e]">
                CREATE ACCOUNT
              </p>

              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe 0%, #ccfbf1 100%)',
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="2" fill="#1E40AF" fillOpacity="0.9" />
                    <rect x="15" y="5" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.7" />
                    <rect x="5" y="15" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.7" />
                    <rect x="15" y="15" width="8" height="8" rx="2" fill="#3B82F6" fillOpacity="0.4" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-[#0f172a]">TABuddy</span>
              </div>

              {/* Form Header */}
              <div className="text-center mb-4 sm:mb-7">
                <h1 className="text-[22px] sm:text-[28px] font-bold tracking-[-0.03em] text-[#0b1220] mb-1.5 sm:mb-2 leading-tight">
                  注册 TABuddy 账号
                </h1>
                <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
                  创建你的助教工作空间，提升效率
                </p>
              </div>

              {/* Register Form */}
              <form onSubmit={handleRegister}>
                <div className="mb-3 sm:mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    用户名
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                      <User size={15} />
                    </div>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="请输入用户名"
                      className="w-full h-[44px] sm:h-[50px] pl-11 pr-4 text-sm outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(248, 250, 252, 0.95)',
                        border: '1px solid #d8dee8',
                        borderRadius: '14px',
                        color: '#111827',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#14b8a6'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.matches(':focus')) {
                          e.currentTarget.style.borderColor = '#d8dee8'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = '#d8dee8'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                      }}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className="mb-3 sm:mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    密码
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                      <Lock size={15} />
                    </div>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="至少6位密码"
                      className="w-full h-[44px] sm:h-[50px] pl-11 pr-12 text-sm outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(248, 250, 252, 0.95)',
                        border: '1px solid #d8dee8',
                        borderRadius: '14px',
                        color: '#111827',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#14b8a6'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.matches(':focus')) {
                          e.currentTarget.style.borderColor = '#d8dee8'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = '#d8dee8'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                      }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setRegShowPassword(!regShowPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#0f766e] transition-colors flex items-center"
                      tabIndex={-1}
                    >
                      {regShowPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>

                <div className="mb-3 sm:mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    确认密码
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                      <ShieldCheck size={15} />
                    </div>
                    <input
                      type={regShowPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full h-[44px] sm:h-[50px] pl-11 pr-4 text-sm outline-none transition-all duration-200"
                      style={{
                        background: 'rgba(248, 250, 252, 0.95)',
                        border: '1px solid #d8dee8',
                        borderRadius: '14px',
                        color: '#111827',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#14b8a6'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.matches(':focus')) {
                          e.currentTarget.style.borderColor = '#d8dee8'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = '#0f766e'
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                        e.currentTarget.style.background = '#ffffff'
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = '#d8dee8'
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                      }}
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="mb-3 sm:mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    上传头像
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden cursor-pointer transition-all duration-200"
                      style={{
                        background: regAvatarPreview ? 'transparent' : 'rgba(248, 250, 252, 0.95)',
                        border: regAvatarPreview ? '2px solid #14b8a6' : '1px dashed #d8dee8',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {regAvatarPreview ? (
                        <img
                          src={regAvatarPreview}
                          alt="头像预览"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Camera size={22} className="text-[#94a3b8]" />
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#0f766e] hover:text-[#14b8a6] transition-colors bg-transparent border-none cursor-pointer text-left"
                      >
                        选择图片
                      </button>
                      {regAvatarPreview && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-xs text-[#94a3b8] hover:text-[#b91c1c] transition-colors bg-transparent border-none cursor-pointer text-left"
                        >
                          移除图片
                        </button>
                      )}
                      <span className="text-[10px] text-[#94a3b8]">支持 JPG、PNG 格式</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3 sm:mb-5">
                  <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                    注册身份
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { setRegRole('assistant'); setRegCodeVerified(null); setRegCodeError('') }}
                      className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer border"
                      style={{
                        background: regRole === 'assistant' ? 'rgba(20, 184, 166, 0.08)' : 'rgba(248, 250, 252, 0.95)',
                        borderColor: regRole === 'assistant' ? '#14b8a6' : '#d8dee8',
                      }}
                    >
                      <User size={20} className={regRole === 'assistant' ? 'text-[#0f766e]' : 'text-[#94a3b8]'} />
                      <span className="text-xs font-semibold mt-1.5" style={{ color: regRole === 'assistant' ? '#0f766e' : '#475569' }}>
                        普通助教
                      </span>
                      <span className="text-[10px] text-[#94a3b8] mt-0.5">无需注册码</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('classadmin')}
                      className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl transition-all duration-200 cursor-pointer border"
                      style={{
                        background: regRole === 'classadmin' ? 'rgba(20, 184, 166, 0.08)' : 'rgba(248, 250, 252, 0.95)',
                        borderColor: regRole === 'classadmin' ? '#14b8a6' : '#d8dee8',
                      }}
                    >
                      <ShieldCheck size={20} className={regRole === 'classadmin' ? 'text-[#0f766e]' : 'text-[#94a3b8]'} />
                      <span className="text-xs font-semibold mt-1.5" style={{ color: regRole === 'classadmin' ? '#0f766e' : '#475569' }}>
                        任课老师
                      </span>
                      <span className="text-[10px] text-[#94a3b8] mt-0.5">需老师注册码</span>
                    </button>

                  </div>
                </div>

                {regRole === 'classadmin' && (
                  <div className="mb-3 sm:mb-5">
                    <label className="block text-xs font-semibold text-[#334155] mb-1.5 tracking-wide uppercase">
                      老师注册码
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] z-10">
                        <ShieldCheck size={15} />
                      </div>
                      <input
                        type="text"
                        value={regTeacherCode}
                        onChange={(e) => {
                          setRegTeacherCode(e.target.value.toUpperCase())
                          setRegCodeVerified(null)
                          setRegCodeError('')
                        }}
                        placeholder="请输入老师注册码"
                        className="w-full h-[44px] sm:h-[50px] pl-11 pr-4 text-sm outline-none transition-all duration-200 tracking-widest font-mono uppercase"
                        style={{
                          background: 'rgba(248, 250, 252, 0.95)',
                          border: regCodeVerified === true ? '1px solid #14b8a6' : regCodeError ? '1px solid #b91c1c' : '1px solid #d8dee8',
                          borderRadius: '14px',
                          color: '#111827',
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.matches(':focus')) {
                            e.currentTarget.style.borderColor = '#14b8a6'
                            e.currentTarget.style.background = '#ffffff'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.matches(':focus')) {
                            e.currentTarget.style.borderColor = regCodeVerified === true ? '#14b8a6' : regCodeError ? '#b91c1c' : '#d8dee8'
                            e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                          }
                        }}
                        onFocusCapture={(e) => {
                          e.currentTarget.style.borderColor = '#0f766e'
                          e.currentTarget.style.boxShadow = '0 0 0 4px rgba(20, 184, 166, 0.15)'
                          e.currentTarget.style.background = '#ffffff'
                        }}
                        onBlurCapture={(e) => {
                          e.currentTarget.style.borderColor = regCodeVerified === true ? '#14b8a6' : regCodeError ? '#b91c1c' : '#d8dee8'
                          e.currentTarget.style.boxShadow = 'none'
                          e.currentTarget.style.background = 'rgba(248, 250, 252, 0.95)'
                        }}
                        autoComplete="off"
                      />
                      {regCodeVerified === true && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#14b8a6]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                      {regCodeError && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b91c1c]">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-1.5 ml-1">
                      向班级管理员或超级管理员获取老师注册码，通过后自动成为班级管理员
                    </p>
                  </div>
                )}

                {regError && (
                  <div className="mb-4 px-[14px] py-[11px] text-xs text-[#b91c1c] bg-[#fff1f2] border border-[#fecdd3] rounded-xl">
                    {regError}
                  </div>
                )}

                <div style={{ marginBottom: 0 }}>
                  <button
                    type="submit"
                    disabled={regLoading}
                    className="w-full h-[46px] sm:h-[52px] text-[15px] font-semibold rounded-xl border-none tracking-wide cursor-pointer transition-all duration-200 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 55%, #22d3ee 100%)',
                      boxShadow: '0 14px 26px rgba(15, 118, 110, 0.24)',
                    }}
                    onMouseEnter={(e) => {
                      if (!e.currentTarget.disabled) {
                        e.currentTarget.style.transform = 'translateY(-1px)'
                        e.currentTarget.style.boxShadow = '0 16px 28px rgba(15, 118, 110, 0.32)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 14px 26px rgba(15, 118, 110, 0.24)'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'translateY(1px)'
                      e.currentTarget.style.opacity = '0.85'
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)'
                      e.currentTarget.style.opacity = '1'
                    }}
                  >
                    {regLoading ? '注册中...' : '注册账号'}
                  </button>
                </div>
              </form>

              <p className="text-center text-xs text-[#64748b] mt-3 sm:mt-5 leading-relaxed" style={{ margin: '12px 6px 0' }}>
                By registering, you agree to open collaboration and transparent development.
              </p>

              {/* Login Toggle Link */}
              <div className="text-center mt-3 sm:mt-5">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setRegError('') }}
                  className="text-sm text-[#0f766e] hover:text-[#14b8a6] font-medium transition-colors cursor-pointer bg-transparent border-none"
                >
                  已有账号？<span className="underline underline-offset-2">返回登录</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
