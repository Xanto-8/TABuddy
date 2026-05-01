import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth-utils'
import { onNotification, type NotificationEvent } from '@/lib/notification-event-bus'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return new Response('Unauthorized', { status: 401 })
  }

  const payload = verifyToken(token)
  if (!payload) {
    return new Response('Unauthorized', { status: 401 })
  }

  const userId = payload.userId

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const sendEvent = (eventName: string, data: string) => {
        try {
          controller.enqueue(encoder.encode(`event: ${eventName}\n`))
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {}
      }

      const keepalive = setInterval(() => {
        sendEvent('ping', JSON.stringify({ time: Date.now() }))
      }, 15000)

      const cleanup = onNotification((event: NotificationEvent) => {
        if (event.userId === userId || event.userId === '*') {
          sendEvent('notification', JSON.stringify(event.notification))
        }
      })

      request.signal.addEventListener('abort', () => {
        clearInterval(keepalive)
        cleanup()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
