const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),

  // Store operations (for data persistence)
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: unknown) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
    has: (key: string) => ipcRenderer.invoke('store:has', key),
  },

  // App info
  getVersion: () => ipcRenderer.invoke('app:version'),
  isPackaged: () => ipcRenderer.invoke('app:isPackaged'),

  // Shell operations
  openExternal: (url: string) => ipcRenderer.send('shell:openExternal', url),

  // Notifications
  showNotification: (title: string, body: string) => 
    ipcRenderer.send('notification:show', { title, body }),

  // Auto-start
  autostart: {
    get: () => ipcRenderer.invoke('autostart:get'),
    set: (enabled: boolean) => ipcRenderer.invoke('autostart:set', enabled),
  },

  // Listen for shortcuts from main process
  onShortcut: (callback: (action: string) => void) => {
    ipcRenderer.on('shortcut:quickAddTask', () => callback('quickAddTask'))
    ipcRenderer.on('shortcut:focusMode', () => callback('focusMode'))
    ipcRenderer.on('shortcut:settings', () => callback('settings'))
  },

  // Remove shortcut listeners
  removeShortcutListeners: () => {
    ipcRenderer.removeAllListeners('shortcut:quickAddTask')
    ipcRenderer.removeAllListeners('shortcut:focusMode')
    ipcRenderer.removeAllListeners('shortcut:settings')
  },

  // Check if running in Electron
  isElectron: true,
})
