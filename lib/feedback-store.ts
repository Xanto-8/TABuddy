import { UserFeedback } from '@/types'
import { getCache, isCacheLoaded, triggerSync } from './store'

let localFallback: UserFeedback[] = []

function getLocalFeedbacks(): UserFeedback[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('tabuddy_user_feedback')
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

function saveLocalFeedbacks(feedbacks: UserFeedback[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('tabuddy_user_feedback', JSON.stringify(feedbacks))
  } catch { }
}

export function getUserFeedbacks(): UserFeedback[] {
  if (isCacheLoaded()) {
    return getCache().userFeedbacks
  }
  const local = getLocalFeedbacks()
  localFallback = local
  return local
}

export function submitFeedback(feedback: UserFeedback): void {
  addUserFeedback(feedback)
}

export function addUserFeedback(feedback: UserFeedback): void {
  if (isCacheLoaded()) {
    getCache().userFeedbacks.push(feedback)
    triggerSync()
  } else {
    localFallback.push(feedback)
    saveLocalFeedbacks(localFallback)
  }
}

export function deleteUserFeedback(id: string): void {
  if (isCacheLoaded()) {
    const feedbacks = getCache().userFeedbacks
    const index = feedbacks.findIndex(f => f.id === id)
    if (index !== -1) {
      feedbacks.splice(index, 1)
      triggerSync()
    }
  } else {
    const index = localFallback.findIndex(f => f.id === id)
    if (index !== -1) {
      localFallback.splice(index, 1)
      saveLocalFeedbacks(localFallback)
    }
  }
}
