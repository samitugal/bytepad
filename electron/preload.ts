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

  // MCP Server
  mcp: {
    getServerInfo: () => ipcRenderer.invoke('mcp:getServerInfo'),
    start: () => ipcRenderer.invoke('mcp:start'),
    stop: () => ipcRenderer.invoke('mcp:stop'),
    getApiKey: () => ipcRenderer.invoke('mcp:getApiKey'),
    regenerateApiKey: () => ipcRenderer.invoke('mcp:regenerateApiKey'),
    setEnabled: (enabled: boolean) => ipcRenderer.invoke('mcp:setEnabled', enabled),
    setPort: (port: number) => ipcRenderer.invoke('mcp:setPort', port),
    setDockerEnabled: (enabled: boolean) => ipcRenderer.invoke('mcp:setDockerEnabled', enabled),
  },

  // Docker
  docker: {
    isInstalled: () => ipcRenderer.invoke('docker:isInstalled'),
    isRunning: () => ipcRenderer.invoke('docker:isRunning'),
    getStatus: () => ipcRenderer.invoke('docker:getStatus'),
    start: () => ipcRenderer.invoke('docker:start'),
    stop: () => ipcRenderer.invoke('docker:stop'),
    remove: () => ipcRenderer.invoke('docker:remove'),
    getLogs: (lines?: number) => ipcRenderer.invoke('docker:logs', lines),
    imageExists: () => ipcRenderer.invoke('docker:imageExists'),
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

  // Listen for app quit event to trigger sync
  onBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('app:before-quit', () => callback())
  },

  removeBeforeQuitListener: () => {
    ipcRenderer.removeAllListeners('app:before-quit')
  },

  // Check if running in Electron
  isElectron: true,

  // Store bridge for MCP server
  storeBridge: {
    // Register handler for store requests from main process
    onStoreRequest: (handler: (channel: string, requestId: string, ...args: unknown[]) => void) => {
      const channels = ['store:getAll', 'store:getById', 'store:create', 'store:update', 'store:delete', 'store:search', 'store:action', 'store:getState']
      channels.forEach(channel => {
        // Remove any existing listeners first to prevent duplicates from HMR
        ipcRenderer.removeAllListeners(channel);
        ipcRenderer.on(channel, (_event: unknown, requestId: string, ...args: unknown[]) => {
          handler(channel, requestId, ...args)
        })
      });
    },
    // Send response back to main process
    sendResponse: (requestId: string, data: unknown, error?: string) => {
      ipcRenderer.send('store:response', requestId, data, error)
    },
    // Notify about store changes
    notifyChange: (storeName: string, action: string, data: unknown) => {
      ipcRenderer.send('store:changed', storeName, action, data)
    },
  },
})
