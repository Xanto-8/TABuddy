import { EventEmitter } from 'events'

export interface NotificationEvent {
  type: 'new_notification'
  userId: string
  notification: {
    id: string
    title: string
    message: string
    type: string
    link: string
    read: boolean
    createdAt: string
  }
}

const eventBus = new EventEmitter()
eventBus.setMaxListeners(100)

export function emitNotification(event: NotificationEvent) {
  eventBus.emit('notification', event)
}

export function onNotification(callback: (event: NotificationEvent) => void) {
  eventBus.on('notification', callback)
  return () => { eventBus.off('notification', callback) }
}
