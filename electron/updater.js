const { autoUpdater } = require('electron-updater')
const { BrowserWindow } = require('electron')
const config = require('./config')

autoUpdater.autoDownload = true
autoUpdater.autoInstallOnAppQuit = true
autoUpdater.allowPrerelease = false

function setupAutoUpdater(feedUrl, callbacks) {
  const { onUpdateAvailable, onUpdateDownloaded, onError } = callbacks

  if (feedUrl && feedUrl !== '') {
    try {
      const url = new URL(feedUrl)
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: feedUrl,
      })
    } catch (e) {
      console.log('Update feed URL not configured, auto-update disabled.')
      return
    }
  } else {
    console.log('Update feed URL not configured, auto-update disabled.')
    return
  }

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info)
    if (onUpdateAvailable) onUpdateAvailable(info)
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info)
  })

  autoUpdater.on('download-progress', (progress) => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.executeJavaScript(`
        (function() {
          try {
            window.__electronUpdateProgress && window.__electronUpdateProgress(${JSON.stringify(progress)});
          } catch(e) {}
        })()
      `).catch(() => {})
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info)
    if (onUpdateDownloaded) onUpdateDownloaded(info)
  })

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err)
    if (onError) onError(err)
  })

  autoUpdater.checkForUpdates().catch((err) => {
    console.log('Initial update check failed (expected in dev):', err.message)
  })

  setInterval(() => {
    autoUpdater.checkForUpdates().catch(() => {})
  }, 3600000)
}

module.exports = { setupAutoUpdater }
