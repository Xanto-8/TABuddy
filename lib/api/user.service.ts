import { httpClient } from './client'
import type { UserProfileDto } from './types'
import { getClasses } from '@/lib/store'

class UserService {
  async getProfile(): Promise<UserProfileDto> {
    try {
      return await httpClient.get<UserProfileDto>('/user/profile')
    } catch {
      return {
        id: 'local-user',
        username: 'tabuddy',
        displayName: '助教老师',
        avatar: '',
        role: 'assistant',
        email: '',
        createdAt: new Date().toISOString(),
      }
    }
  }

  async getTeachingClasses(userId?: string): Promise<{ id: string; name: string; type: string }[]> {
    try {
      const params = userId ? `?userId=${userId}` : ''
      return await httpClient.get<{ id: string; name: string; type: string }[]>(
        `/user/classes${params}`
      )
    } catch {
      return getClasses().map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
      }))
    }
  }

  async updateProfile(data: Partial<UserProfileDto>): Promise<UserProfileDto> {
    return httpClient.put<UserProfileDto>('/user/profile', data)
  }
}

export const userService = new UserService()
