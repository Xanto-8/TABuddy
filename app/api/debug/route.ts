import { NextResponse } from 'next/server'
import { redis, KV_KEY } from '@/lib/server/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const envUrl = !!process.env.UPSTASH_REDIS_REST_URL
  const envToken = !!process.env.UPSTASH_REDIS_REST_TOKEN
  const kvUrl = !!process.env.KV_URL
  const kvToken = !!process.env.KV_REST_API_TOKEN
  const vercelEnv = !!process.env.VERCEL

  let redisTest = 'not_tested'
  if (redis) {
    try {
      const test = await redis.get<string>(KV_KEY)
      redisTest = `connected, key_exists=${test !== null}, key_length=${test?.length ?? 0}`
    } catch (e: any) {
      redisTest = `error: ${e?.message || e}`
    }
  } else {
    redisTest = 'null (redis client not created)'
  }

  return NextResponse.json({
    redis_available: redis !== null,
    env: {
      VERCEL: vercelEnv,
      UPSTASH_REDIS_REST_URL: envUrl,
      UPSTASH_REDIS_REST_TOKEN: envToken,
      KV_URL: kvUrl,
      KV_REST_API_TOKEN: kvToken,
    },
    redis_test: redisTest,
    kv_key: KV_KEY,
  })
}