import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

export function formatTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${formatDate(d)} ${formatTime(d)}`
}

export function truncateText(text: string, length: number) {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

export function generateAvatarColor(name: string) {
  const colors = [
    'bg-red-100 text-red-800',
    'bg-orange-100 text-orange-800',
    'bg-amber-100 text-amber-800',
    'bg-yellow-100 text-yellow-800',
    'bg-lime-100 text-lime-800',
    'bg-green-100 text-green-800',
    'bg-emerald-100 text-emerald-800',
    'bg-teal-100 text-teal-800',
    'bg-cyan-100 text-cyan-800',
    'bg-sky-100 text-sky-800',
    'bg-blue-100 text-blue-800',
    'bg-indigo-100 text-indigo-800',
    'bg-violet-100 text-violet-800',
    'bg-purple-100 text-purple-800',
    'bg-fuchsia-100 text-fuchsia-800',
    'bg-pink-100 text-pink-800',
    'bg-rose-100 text-rose-800',
  ]
  
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const index = Math.abs(hash) % colors.length
  return colors[index]
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function calculateProgress(current: number, total: number) {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function isToday(date: Date) {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

export function isThisWeek(date: Date) {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)
  
  return date >= startOfWeek && date <= endOfWeek
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function generateId() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}