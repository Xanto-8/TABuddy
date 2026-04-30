import { 
  CompletionStatus, 
  HandwritingQuality, 
  HomeworkAssessmentForm 
} from '@/types'

// 格式化日期
export function formatDate(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'short') {
    return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  } else if (format === 'medium') {
    return d.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    })
  } else {
    return d.toLocaleDateString('zh-CN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }
}

// 格式化时间
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 计算任务进度
export function calculateTaskProgress(total: number, completed: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// 生成作业反馈（面向家长的委婉表达）
export function generateHomeworkFeedback(
  completion: CompletionStatus,
  handwriting: HandwritingQuality,
  accuracy: number,
  teacherFeedback?: string,
  studentName?: string
): string {
  const name = studentName
    ? (studentName.length === 2 ? studentName : studentName.slice(-2))
    : '孩子'

  const parts: string[] = []

  if (completion === 'completed') {
    parts.push('本次作业已按时完成')
  } else if (completion === 'partial') {
    parts.push('本次作业部分未完成')
  } else {
    parts.push('本次作业暂未提交')
  }

  if (completion === 'not_done') {
    parts.push('书写和正确率基础不错')
  } else {
    if (handwriting === 'excellent') {
      parts.push('书写工整美观')
    } else if (handwriting === 'good') {
      parts.push('书写清晰整洁')
    } else if (handwriting === 'fair') {
      parts.push('在书写整洁度上可以再稍加注意')
    } else {
      parts.push('书写方面还有提升空间，可以多关注字迹的工整度')
    }

    if (accuracy >= 90) {
      parts.push('正确率很高，表现亮眼')
    } else if (accuracy >= 70) {
      parts.push('正确率不错')
    } else if (accuracy >= 50) {
      parts.push('正确率还有提升空间')
    }
  }

  if (accuracy >= 90) {
    parts.push('知识点掌握扎实')
  } else if (accuracy >= 70) {
    parts.push('知识点掌握较为扎实')
  } else if (accuracy >= 50) {
    parts.push('部分知识点已掌握，继续巩固会有更好表现')
  } else {
    parts.push('部分知识点还需加强练习，相信多加努力会有明显进步')
  }

  if (completion === 'partial') {
    parts.push('建议课后把剩余部分补上，保持完整的学习节奏哦')
  } else if (completion === 'not_done') {
    parts.push('建议课后及时补上，养成按时完成作业的好习惯哦')
  }

  if (teacherFeedback && teacherFeedback.trim()) {
    parts.push(teacherFeedback.trim())
  }

  const encouragement = accuracy >= 80 ? `期待${name}继续保持，不断进步！` :
                       accuracy >= 60 ? `继续加油，相信${name}会越来越棒！` :
                       `多加练习，期待${name}的进步！`

  return `${parts.join('，')}。${encouragement}`
}

// 生成个性化话术
export function generatePersonalizedFeedback(
  studentName: string,
  performance: string,
  improvementAreas?: string[]
): string {
  const templates = [
    `${studentName}同学${performance}，${improvementAreas?.length ? `建议在${improvementAreas.join('、')}方面加强练习。` : '继续保持！'}`,
    `本次课堂${studentName}${performance}，${improvementAreas?.length ? `需要注意${improvementAreas.join('和')}。` : '表现很好！'}`,
    `${studentName}${performance}，${improvementAreas?.length ? `${improvementAreas.join('、')}还有提升空间。` : '非常棒！'}`
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

// 计算成绩等级
export function calculateGrade(score: number, total: number = 100): string {
  const percentage = (score / total) * 100
  
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  return 'D'
}

// 生成随机ID
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 防抖函数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// 节流函数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 验证邮箱格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 验证手机号格式
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

// 数组分块
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// 深度合并对象
export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const output = { ...target }
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (isObject(target[key]) && isObject(source[key])) {
        output[key as keyof T] = deepMerge(target[key] as object, source[key] as object) as T[keyof T]
      } else {
        output[key as keyof T] = source[key] as T[keyof T]
      }
    }
  }
  
  return output
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// 生成颜色根据字符串
export function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  const hue = hash % 360
  return `hsl(${hue}, 70%, 65%)`
}

// 获取首字母头像
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}