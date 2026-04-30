'use client'

import { UserFeedback, FeedbackType } from '@/types'

const FEEDBACK_KEY = 'tabuddy_user_feedback'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

export function getFeedbacks(): UserFeedback[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(FEEDBACK_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function submitFeedback(type: FeedbackType, description: string, screenshot?: string): UserFeedback {
  const feedbacks = getFeedbacks()
  const newFeedback: UserFeedback = {
    id: generateId(),
    type,
    description,
    screenshot,
    createdAt: new Date(),
    status: 'pending',
  }
  feedbacks.unshift(newFeedback)
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks))
  return newFeedback
}

export function replyFeedback(id: string, reply: string): boolean {
  const feedbacks = getFeedbacks()
  const index = feedbacks.findIndex((f) => f.id === id)
  if (index === -1) return false
  feedbacks[index].reply = reply
  feedbacks[index].repliedAt = new Date()
  feedbacks[index].status = 'resolved'
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks))
  return true
}

export function updateFeedbackStatus(id: string, status: 'pending' | 'resolved' | 'closed'): boolean {
  const feedbacks = getFeedbacks()
  const index = feedbacks.findIndex((f) => f.id === id)
  if (index === -1) return false
  feedbacks[index].status = status
  localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks))
  return true
}
