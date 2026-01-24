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

  // Listen for app quit event to trigger sync
  onBeforeQuit: (callback: () => void) => {
    ipcRenderer.on('app:before-quit', () => callback())
  },

  removeBeforeQuitListener: () => {
    ipcRenderer.removeAllListeners('app:before-quit')
  },

  // Check if running in Electron
  isElectron: true,

  // Local API handlers for MCP integration
  api: {
    // Register handler for API requests from main process
    onApiRequest: (channel: string, handler: (requestId: string, data: unknown) => void) => {
      ipcRenderer.on(channel, (_, { requestId, data }) => {
        handler(requestId, data)
      })
    },
    // Send response back to main process
    sendResponse: (requestId: string, data: unknown, error?: string) => {
      ipcRenderer.send('api:response', { requestId, data, error })
    },
    // Remove API listeners
    removeApiListeners: () => {
      const channels = [
        'api:getTasks', 'api:createTask', 'api:updateTask', 'api:deleteTask', 'api:toggleTask',
        'api:getNotes', 'api:getNote', 'api:createNote', 'api:updateNote', 'api:deleteNote',
        'api:getHabits', 'api:createHabit', 'api:updateHabit', 'api:deleteHabit', 'api:toggleHabit',
        'api:getBookmarks', 'api:createBookmark', 'api:updateBookmark', 'api:deleteBookmark',
        'api:getJournal', 'api:createJournalEntry', 'api:updateJournalEntry', 'api:deleteJournalEntry',
        'api:getDailySummary', 'api:getWeeklySummary'
      ]
      channels.forEach(ch => ipcRenderer.removeAllListeners(ch))
    }
  },
})
