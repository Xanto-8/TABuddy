import { CompletionStatus, HandwritingQuality } from '@/types'

export const completionLabels: Record<CompletionStatus, string> = {
  completed: '已完成',
  partial: '部分完成',
  not_done: '未完成',
}

export const completionColors: Record<CompletionStatus, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  not_done: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const handwritingLabels: Record<HandwritingQuality, string> = {
  excellent: '非常工整',
  good: '清晰',
  fair: '一般',
  poor: '需改进',
}

export const handwritingColors: Record<HandwritingQuality, string> = {
  excellent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  good: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  fair: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
  poor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export const accuracyColor = (value: number | null) => {
  if (value === null) return 'text-muted-foreground'
  if (value >= 85) return 'text-green-600 dark:text-green-400'
  if (value >= 50) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}
