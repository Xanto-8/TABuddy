const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronApp', {
  getConfig: () => ipcRenderer.sendSync('get-app-config'),

  minimizeWindow: () => ipcRenderer.send('window-minimize'),

  maximizeWindow: () => ipcRenderer.send('window-maximize'),

  closeWindow: () => ipcRenderer.send('window-close'),

  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  showDesktopNotification: (title, body, link) => {
    ipcRenderer.send('show-desktop-notification', { title, body, link })
  },

  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
})
