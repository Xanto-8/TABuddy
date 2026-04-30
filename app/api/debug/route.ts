import { NextResponse } from 'next/server'
import { redis, KV_KEY } from '@/lib/server/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const envUrl = !!process.env.UPSTASH_REDIS_REST_URL
  const envToken = !!process.env.UPSTASH_REDIS_REST_TOKEN
  const envUrlValue = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_URL || '(not set)'
  const kvUrl = !!process.env.KV_URL
  const kvToken = !!process.env.KV_REST_API_TOKEN
  const vercelEnv = !!process.env.VERCEL
  const nodeEnv = process.env.NODE_ENV || 'unknown'

  let redisTest = 'not_tested'
  let redisRaw: any = null
  let redisType = 'unknown'
  let entryCount = 0
  if (redis) {
    try {
      const test = await redis.get<unknown>(KV_KEY)
      if (test !== null && test !== undefined) {
        redisType = typeof test
        if (Array.isArray(test)) {
          entryCount = test.length
          redisRaw = `Array(${test.length})`
        } else if (typeof test === 'string') {
          try {
            const parsed = JSON.parse(test)
            entryCount = Array.isArray(parsed) ? parsed.length : 0
            redisRaw = `string(${test.length}), parses to ${typeof parsed}`
          } catch {
            redisRaw = `string(${test.length}), not JSON`
          }
        } else if (typeof test === 'object') {
          redisRaw = `object: ${JSON.stringify(test).substring(0, 100)}...`
        } else {
          redisRaw = `${typeof test}: ${String(test)}`
        }
      } else {
        redisRaw = 'null (key not found)'
      }
      redisTest = 'connected'
    } catch (e: any) {
      redisTest = `error: ${e?.message || e}`
      redisRaw = e?.toString?.() || String(e)
    }
  } else {
    redisTest = 'null (redis client not created)'
  }

  // Also test a write
  let writeTest = 'not_tested'
  if (redis) {
    try {
      const pingKey = 'tabuddy_diag_ping'
      await redis.set(pingKey, 'ok', { ex: 60 })
      writeTest = 'write_ok'
    } catch (e: any) {
      writeTest = `write_error: ${e?.message || e}`
    }
  }

  return NextResponse.json({
    redis_available: redis !== null,
    env: {
      VERCEL: vercelEnv,
      NODE_ENV: nodeEnv,
      UPSTASH_REDIS_REST_URL: envUrl,
      UPSTASH_REDIS_REST_TOKEN: envToken,
      KV_URL: kvUrl,
      KV_REST_API_TOKEN: kvToken,
      _url_value_masked: envUrlValue.substring(0, 20) + '...',
    },
    redis_test: redisTest,
    redis_data: redisRaw,
    entry_count: entryCount,
    write_test: writeTest,
    kv_key: KV_KEY,
    timestamp: new Date().toISOString(),
  })
}