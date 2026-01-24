import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, shell, nativeImage, Notification } from 'electron'
import path from 'path'
import http from 'http'
import Store from 'electron-store'

// Initialize electron-store
const store = new Store()

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let apiServer: http.Server | null = null

const API_PORT = 31337

const isDev = process.env.NODE_ENV === 'development'

// Get the correct icon path for both dev and production
function getIconPath(): string {
  if (isDev) {
    return path.join(__dirname, '../../resources/icon.png')
  }
  // In production, resources are in the app's root
  return path.join(process.resourcesPath, 'icon.png')
}

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/index.cjs')
  console.log('[Main] Preload path:', preloadPath)
  console.log('[Main] __dirname:', __dirname)

  const isMac = process.platform === 'darwin'

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'bytepad',
    icon: getIconPath(),
    // Platform-specific title bar settings
    frame: isMac, // macOS needs frame for traffic lights
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden', // hiddenInset for macOS, hidden for Windows/Linux
    trafficLightPosition: isMac ? { x: 12, y: 12 } : undefined, // Position traffic lights on macOS
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#1E1E1E',
    show: false, // Show when ready
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  // Handle window close - minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function createTray() {
  const iconPath = getIconPath()

  // Create tray icon (resize for tray - 16x16 on Windows, 22x22 on Mac)
  let trayIcon = nativeImage.createFromPath(iconPath)

  // Resize for tray if loaded successfully
  if (!trayIcon.isEmpty()) {
    const size = process.platform === 'darwin' ? 22 : 16
    trayIcon = trayIcon.resize({ width: size, height: size })
  }

  tray = new Tray(trayIcon)

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open bytepad',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Quick Add Task',
      accelerator: 'CmdOrCtrl+Shift+T',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('shortcut:quickAddTask')
      }
    },
    {
      label: 'Start Focus Mode',
      accelerator: 'CmdOrCtrl+Shift+P',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('shortcut:focusMode')
      }
    },
    { type: 'separator' },
    {
      label: 'Settings',
      click: () => {
        mainWindow?.show()
        mainWindow?.webContents.send('shortcut:settings')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true
        app.quit()
      }
    }
  ])

  tray.setToolTip('bytepad')
  tray.setContextMenu(contextMenu)

  // Click to show/hide
  tray.on('click', () => {
    if (mainWindow?.isVisible()) {
      mainWindow.hide()
    } else {
      mainWindow?.show()
      mainWindow?.focus()
    }
  })
}

function registerGlobalShortcuts() {
  // NOTE: Ctrl+Shift+F removed - was bringing app to front when minimized (unwanted behavior)
  // Users can use tray icon or taskbar to show the app

  // Quick add task
  globalShortcut.register('CommandOrControl+Shift+T', () => {
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('shortcut:quickAddTask')
  })

  // Focus mode
  globalShortcut.register('CommandOrControl+Shift+P', () => {
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('shortcut:focusMode')
  })
}

// IPC Handlers
function setupIPC() {
  // Window controls
  ipcMain.on('window:minimize', () => mainWindow?.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow?.hide())

  // Store operations
  ipcMain.handle('store:get', (_, key: string) => {
    return store.get(key)
  })

  ipcMain.handle('store:set', (_, key: string, value: unknown) => {
    store.set(key, value)
  })

  ipcMain.handle('store:delete', (_, key: string) => {
    store.delete(key)
  })

  ipcMain.handle('store:has', (_, key: string) => {
    return store.has(key)
  })

  // App info
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:isPackaged', () => app.isPackaged)

  // Shell operations
  ipcMain.on('shell:openExternal', (_, url: string) => {
    shell.openExternal(url)
  })

  // Notifications
  ipcMain.on('notification:show', (_, { title, body }: { title: string; body: string }) => {
    const notification = new Notification({
      title,
      body,
      icon: getIconPath(),
    })

    // Click notification to show app
    notification.on('click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })

    notification.show()
  })

  // Auto-start
  ipcMain.handle('autostart:get', () => {
    return app.getLoginItemSettings().openAtLogin
  })

  ipcMain.handle('autostart:set', (_, enabled: boolean) => {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: true
    })
  })
}

// Extend app type for isQuitting property
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
}

// ============================================
// LOCAL API SERVER FOR MCP INTEGRATION
// ============================================

// Pending API requests waiting for renderer response
const pendingApiRequests = new Map<string, {
  resolve: (data: unknown) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}>()

function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

// Send API request to renderer and wait for response
async function sendToRenderer(channel: string, data: unknown): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      reject(new Error('App window not available'))
      return
    }

    const requestId = generateRequestId()

    // Set timeout for response
    const timeout = setTimeout(() => {
      pendingApiRequests.delete(requestId)
      reject(new Error('Request timeout'))
    }, 10000) // 10 second timeout

    pendingApiRequests.set(requestId, { resolve, reject, timeout })

    mainWindow.webContents.send(channel, { requestId, data })
  })
}

function setupLocalApiServer() {
  apiServer = http.createServer(async (req, res) => {
    // CORS headers for local requests
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.setHeader('Content-Type', 'application/json')

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url || '/', `http://localhost:${API_PORT}`)
    const pathname = url.pathname

    // Parse request body for POST/PATCH
    let body: unknown = null
    if (req.method === 'POST' || req.method === 'PATCH') {
      try {
        const chunks: Buffer[] = []
        for await (const chunk of req) {
          chunks.push(chunk)
        }
        const rawBody = Buffer.concat(chunks).toString()
        body = rawBody ? JSON.parse(rawBody) : null
      } catch {
        res.writeHead(400)
        res.end(JSON.stringify({ error: 'Invalid JSON body' }))
        return
      }
    }

    try {
      // Route handling
      let result: unknown

      // Health check
      if (pathname === '/api/health') {
        result = { status: 'ok', version: app.getVersion(), timestamp: new Date().toISOString() }
      }
      // Tasks
      else if (pathname === '/api/tasks' && req.method === 'GET') {
        result = await sendToRenderer('api:getTasks', null)
      }
      else if (pathname === '/api/tasks' && req.method === 'POST') {
        result = await sendToRenderer('api:createTask', body)
      }
      else if (pathname.match(/^\/api\/tasks\/[\w-]+$/) && req.method === 'PATCH') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:updateTask', { id, updates: body })
      }
      else if (pathname.match(/^\/api\/tasks\/[\w-]+$/) && req.method === 'DELETE') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:deleteTask', { id })
      }
      else if (pathname.match(/^\/api\/tasks\/[\w-]+\/toggle$/) && req.method === 'POST') {
        const id = pathname.split('/')[3]
        result = await sendToRenderer('api:toggleTask', { id })
      }
      // Notes
      else if (pathname === '/api/notes' && req.method === 'GET') {
        result = await sendToRenderer('api:getNotes', null)
      }
      else if (pathname.match(/^\/api\/notes\/[\w-]+$/) && req.method === 'GET') {
        const id = pathname.split('/').pop()
        console.log('[API] GET /api/notes/:id - Getting note:', id)
        result = await sendToRenderer('api:getNote', { id })
        if (result) {
          console.log('[API] GET /api/notes/:id - Note retrieved successfully')
        }
      }
      else if (pathname === '/api/notes' && req.method === 'POST') {
        result = await sendToRenderer('api:createNote', body)
      }
      else if (pathname.match(/^\/api\/notes\/[\w-]+$/) && req.method === 'PATCH') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:updateNote', { id, updates: body })
      }
      else if (pathname.match(/^\/api\/notes\/[\w-]+$/) && req.method === 'DELETE') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:deleteNote', { id })
      }
      // Habits
      else if (pathname === '/api/habits' && req.method === 'GET') {
        result = await sendToRenderer('api:getHabits', null)
      }
      else if (pathname === '/api/habits' && req.method === 'POST') {
        result = await sendToRenderer('api:createHabit', body)
      }
      else if (pathname.match(/^\/api\/habits\/[\w-]+$/) && req.method === 'PATCH') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:updateHabit', { id, updates: body })
      }
      else if (pathname.match(/^\/api\/habits\/[\w-]+$/) && req.method === 'DELETE') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:deleteHabit', { id })
      }
      else if (pathname.match(/^\/api\/habits\/[\w-]+\/toggle$/) && req.method === 'POST') {
        const id = pathname.split('/')[3]
        result = await sendToRenderer('api:toggleHabit', { id })
      }
      // Bookmarks
      else if (pathname === '/api/bookmarks' && req.method === 'GET') {
        result = await sendToRenderer('api:getBookmarks', null)
      }
      else if (pathname === '/api/bookmarks' && req.method === 'POST') {
        result = await sendToRenderer('api:createBookmark', body)
      }
      else if (pathname.match(/^\/api\/bookmarks\/[\w-]+$/) && req.method === 'PATCH') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:updateBookmark', { id, updates: body })
      }
      else if (pathname.match(/^\/api\/bookmarks\/[\w-]+$/) && req.method === 'DELETE') {
        const id = pathname.split('/').pop()
        result = await sendToRenderer('api:deleteBookmark', { id })
      }
      // Journal
      else if (pathname === '/api/journal' && req.method === 'GET') {
        result = await sendToRenderer('api:getJournal', null)
      }
      else if (pathname === '/api/journal' && req.method === 'POST') {
        result = await sendToRenderer('api:createJournalEntry', body)
      }
      else if (pathname.match(/^\/api\/journal\/[\d-]+$/) && req.method === 'PATCH') {
        const date = pathname.split('/').pop()
        result = await sendToRenderer('api:updateJournalEntry', { date, updates: body })
      }
      else if (pathname.match(/^\/api\/journal\/[\d-]+$/) && req.method === 'DELETE') {
        const date = pathname.split('/').pop()
        result = await sendToRenderer('api:deleteJournalEntry', { date })
      }
      // Summary endpoints
      else if (pathname === '/api/summary/daily' && req.method === 'GET') {
        result = await sendToRenderer('api:getDailySummary', null)
      }
      else if (pathname === '/api/summary/weekly' && req.method === 'GET') {
        result = await sendToRenderer('api:getWeeklySummary', null)
      }
      // Not found
      else {
        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Not found', path: pathname }))
        return
      }

      res.writeHead(200)
      res.end(JSON.stringify({ success: true, data: result }))
    } catch (error) {
      console.error('[API] Error:', error)
      res.writeHead(500)
      res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }))
    }
  })

  apiServer.listen(API_PORT, '127.0.0.1', () => {
    console.log(`[API] Local API server running on http://127.0.0.1:${API_PORT}`)
  })

  apiServer.on('error', (err) => {
    console.error('[API] Server error:', err)
  })
}

// Handle API responses from renderer
function setupApiResponseHandler() {
  ipcMain.on('api:response', (_, { requestId, data, error }) => {
    const pending = pendingApiRequests.get(requestId)
    if (pending) {
      clearTimeout(pending.timeout)
      pendingApiRequests.delete(requestId)

      if (error) {
        pending.reject(new Error(error))
      } else {
        pending.resolve(data)
      }
    }
  })
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()
    createTray()
    registerGlobalShortcuts()
    setupIPC()
    setupApiResponseHandler()
    setupLocalApiServer()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  // Close API server
  if (apiServer) {
    apiServer.close()
    apiServer = null
  }
})

app.on('before-quit', (event) => {
  app.isQuitting = true
  // Send signal to renderer to push data before quitting
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:before-quit')
  }
})
