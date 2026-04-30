import { Redis } from '@upstash/redis'

function createRedisClient(): Redis | null {
  const url = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (url && token) {
    return new Redis({ url, token })
  }

  try {
    return Redis.fromEnv()
  } catch {
    return null
  }
}

export const redis = createRedisClient()

export const KV_KEY = 'tabuddy_public_knowledge_base'
