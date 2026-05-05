const { app, BrowserWindow, Tray, Menu, nativeImage, globalShortcut, ipcMain, Notification, shell, dialog } = require('electron')
const path = require('path')
const config = require('./config')
const { setupAutoUpdater } = require('./updater')

let mainWindow = null
let tray = null
let isQuitting = false

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: config.WINDOW_WIDTH,
    height: config.WINDOW_HEIGHT,
    minWidth: config.WINDOW_MIN_WIDTH,
    minHeight: config.WINDOW_MIN_HEIGHT,
    frame: false,
    backgroundColor: '#f5f5f5',
    roundedCorners: true,
    icon: config.ICON_PATH,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'shell.html'))

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.center()
  })

  if (config.DISABLE_DEVTOOLS) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (
        (input.key === 'F12') ||
        (input.control && input.shift && input.key === 'I') ||
        (input.control && input.shift && input.key === 'J') ||
        (input.control && input.shift && input.key === 'C')
      ) {
        event.preventDefault()
      }
    })
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  const iconPath = config.ICON_PATH
  let trayIcon
  try {
    const img = nativeImage.createFromPath(iconPath)
    trayIcon = img.resize({ width: 16, height: 16 })
  } catch {
    trayIcon = nativeImage.createEmpty()
  }

  tray = new Tray(trayIcon)
  tray.setToolTip(config.APP_NAME_CN)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `显示${config.APP_NAME_CN}`,
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
          mainWindow.center()
        }
      },
    },
    { type: 'separator' },
    {
      label: '刷新',
      click: () => {
        if (mainWindow) {
          const webview = mainWindow.webContents
          if (webview) {
            webview.executeJavaScript('document.querySelector("webview")?.reload()')
          }
        }
      },
    },
    { type: 'separator' },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: config.AUTO_START_ENABLED,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          args: ['--hidden'],
        })
      },
    },
    { type: 'separator' },
    {
      label: '退出程序',
      click: () => {
        isQuitting = true
        if (mainWindow) {
          mainWindow.removeAllListeners('close')
          mainWindow.close()
        }
        app.quit()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function registerGlobalShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+M', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  globalShortcut.register('CommandOrControl+Shift+Q', () => {
    if (mainWindow) {
      mainWindow.webContents.executeJavaScript('document.querySelector("webview")?.reload()')
    }
  })

  globalShortcut.register('Alt+X', () => {
    if (mainWindow && mainWindow.isVisible()) {
      mainWindow.hide()
    } else if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

function showDesktopNotification(title, body, linkData = null) {
  if (!Notification.isSupported()) return

  const notif = new Notification({
    title: title,
    body: body,
    icon: config.ICON_PATH,
  })

  notif.on('click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()

      if (linkData && linkData.link) {
        const webview = mainWindow.webContents
        if (webview) {
          setTimeout(() => {
            webview.executeJavaScript(`
              (function() {
                try {
                  window.__electronNavigate && window.__electronNavigate(${JSON.stringify(linkData.link)});
                } catch(e) {}
              })()
            `)
          }, 500)
        }
      }
    }
  })

  notif.show()
}

function extractHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return 'localhost'
  }
}

app.whenReady().then(() => {
  const gotTheLock = app.requestSingleInstanceLock()
  if (!gotTheLock) {
    app.quit()
    return
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  const hidden = process.argv.includes('--hidden')

  if (!hidden) {
    createMainWindow()
  } else {
    createMainWindow()
    mainWindow.hide()
  }

  createTray()
  registerGlobalShortcuts()

  const appDataPath = app.getPath('userData')
  setupAutoUpdater(config.UPDATE_FEED_URL, {
    onUpdateAvailable: () => {
      showDesktopNotification('发现新版本', '正在后台下载更新...', null)
    },
    onUpdateDownloaded: () => {
      showDesktopNotification('更新已就绪', '将在退出后自动安装新版本', null)

      if (mainWindow) {
        mainWindow.webContents.executeJavaScript(`
          (function() {
            try {
              window.__electronUpdateReady && window.__electronUpdateReady();
            } catch(e) {}
          })()
        `)
      }
    },
    onError: (err) => {
      console.error('Auto updater error:', err)
    },
  })

  ipcMain.on('get-app-config', (event) => {
    event.returnValue = {
      appName: config.APP_NAME,
      appNameCn: config.APP_NAME_CN,
      targetUrl: config.TARGET_URL,
      feedbackUrl: config.FEEDBACK_URL,
      fileServerUrl: config.FILE_SERVER_URL,
      titlebarHeight: config.TITLEBAR_HEIGHT,
      localIconPath: `file:///${config.LOCAL_ICON_PATH.replace(/\\/g, '/')}`,
      webviewPreload: `file://${path.join(__dirname, 'webview-preload.js').replace(/\\/g, '/')}`,
    }
  })

  ipcMain.on('window-minimize', () => {
    if (mainWindow) mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  })

  ipcMain.on('window-close', () => {
    if (mainWindow) mainWindow.hide()
  })

  ipcMain.handle('window-is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false
  })

  ipcMain.on('show-desktop-notification', (event, { title, body, link }) => {
    showDesktopNotification(title, body, link ? { link } : null)
  })

  ipcMain.handle('open-external-link', (event, url) => {
    shell.openExternal(url)
  })
})

app.on('window-all-closed', () => {})

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show()
    mainWindow.focus()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
