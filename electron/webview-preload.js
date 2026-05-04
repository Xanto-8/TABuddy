const { ipcRenderer } = require('electron')

let lastNotifTitle = ''
let lastNotifBody = ''
let lastNotifTime = 0

function sendNotification(title, body, link) {
  const now = Date.now()
  const key = title + '|' + body
  if (key === lastNotifTitle + '|' + lastNotifBody && now - lastNotifTime < 5000) {
    return
  }
  lastNotifTitle = title
  lastNotifBody = body
  lastNotifTime = now

  playNotificationSound()

  try {
    ipcRenderer.sendToHost('notification', JSON.stringify({
      title: String(title).substring(0, 100),
      body: String(body).substring(0, 200),
      link: link || '',
    }))
  } catch (e) {
    console.error('[electron] sendNotification error:', e)
  }
}

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return
    const ctx = new AudioContext()
    const now = ctx.currentTime

    const gain = ctx.createGain()
    gain.connect(ctx.destination)

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.value = 523.25
    osc1.connect(gain)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.value = 659.25
    osc2.connect(gain)

    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.08)
    gain.gain.linearRampToValueAtTime(0, now + 0.1)

    osc1.start(now)
    osc1.stop(now + 0.1)

    gain.gain.setValueAtTime(0, now + 0.14)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.15)
    gain.gain.linearRampToValueAtTime(0.3, now + 0.18)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.22)
    gain.gain.linearRampToValueAtTime(0, now + 0.28)

    osc2.start(now + 0.14)
    osc2.stop(now + 0.28)

    setTimeout(function () {
      ctx.close()
    }, 500)
  } catch (e) {
  }
}

function overrideNotificationAPI() {
  try {
    const OrigNotification = window.Notification

    function PatchedNotification(title, options) {
      const body = (options && options.body) || ''
      sendNotification(title, body, '')

      try {
        return new OrigNotification(title, options)
      } catch (e) {
        return {
          onclick: null,
          close: function() {},
          addEventListener: function() {},
          removeEventListener: function() {},
        }
      }
    }

    PatchedNotification.prototype = OrigNotification ? OrigNotification.prototype : {}
    PatchedNotification.permission = 'granted'
    PatchedNotification.requestPermission = function() {
      return Promise.resolve('granted')
    }
    PatchedNotification.maxActions = 0

    window.Notification = PatchedNotification
  } catch (e) {
    console.error('[electron] Failed to override Notification API:', e)
  }
}

function findClosestLink(el) {
  let current = el
  while (current && current !== document.body) {
    if (current.tagName === 'A' && current.href) {
      return current.href
    }
    current = current.parentElement
  }
  return null
}

function checkForNotifications(root) {
  const text = (root.textContent || '').toLowerCase()
  const keywords = ['提醒', '通知', '待办', '作业提醒', '重测', '消息', '提示', '您有', '检测到', '请及时', '即将开始']
  const hasKeyword = keywords.some((kw) => text.includes(kw))
  if (!hasKeyword) return

  const ariaRole = root.getAttribute('role') || ''
  const className = (root.className || '').toLowerCase()
  const isNotificationElement =
    ariaRole.includes('alert') ||
    ariaRole.includes('dialog') ||
    ariaRole.includes('status') ||
    className.includes('toast') ||
    className.includes('notification') ||
    className.includes('alert') ||
    className.includes('snackbar') ||
    className.includes('modal') ||
    className.includes('dialog') ||
    className.includes('popup') ||
    className.includes('reminder') ||
    className.includes('notice')

  const dialogEl = root.closest('[role="dialog"], [role="alert"], [role="status"]')

  if (isNotificationElement || dialogEl) {
    const titleEl = root.querySelector('h1, h2, h3, h4, strong, [class*="title"], [class*="header"]')
    const title = titleEl ? titleEl.textContent.trim() : document.title || '通知'

    let body = root.textContent.trim()
    body = body.replace(/\s+/g, ' ').substring(0, 200)

    const link = findClosestLink(root) || ''

    if (body.length > 0) {
      sendNotification(title, body, link)
    }
  }
}

function setupMutationObserver() {
  try {
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'TITLE', 'BASE'])

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1 && !ignoredTags.has(node.tagName)) {
              checkForNotifications(node)
            }
          }
        }
      }
    })

    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true,
    })
  } catch (e) {
    console.error('[electron] Failed to setup MutationObserver:', e)
  }
}

function listenForCustomEvents() {
  document.addEventListener('notify-electron', function(e) {
    try {
      const detail = e.detail || {}
      sendNotification(detail.title || '通知', detail.body || '', detail.link || '')
    } catch (err) {
      console.error('[electron] Custom event error:', err)
    }
  })
}

function injectBridgeAPI() {
  try {
    Object.defineProperty(window, '__electronNotifyDesktop', {
      value: function(title, body, link) {
        sendNotification(title, body, link)
      },
      writable: false,
      configurable: false,
    })

    Object.defineProperty(window, '__electronNavigate', {
      value: function(path) {
        const currentUrl = window.location.href
        const baseUrl = currentUrl.replace(/\/[^\/]*$/, '')
        const targetUrl = path.startsWith('http') ? path : (baseUrl + '/' + path.replace(/^\//, ''))
        window.location.href = targetUrl
      },
      writable: false,
      configurable: false,
    })

    Object.defineProperty(window, '__electronUpdateProgress', {
      value: function(progress) {
        console.log('[electron] Update progress:', progress.percent)
      },
      writable: false,
      configurable: false,
    })

    Object.defineProperty(window, '__electronUpdateReady', {
      value: function() {
        console.log('[electron] Update ready to install')
      },
      writable: false,
      configurable: false,
    })
  } catch (e) {
    console.error('[electron] Failed to inject bridge API:', e)
  }
}

function disableRightClick() {
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault()
    e.stopPropagation()
    return false
  }, true)
}

function disableDevToolsKeys() {
  document.addEventListener('keydown', function(e) {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, true)
}

function init() {
  disableRightClick()
  disableDevToolsKeys()
  overrideNotificationAPI()
  setupMutationObserver()
  listenForCustomEvents()
  injectBridgeAPI()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
