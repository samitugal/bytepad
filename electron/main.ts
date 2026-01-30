import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, shell, nativeImage, Notification } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { startMCPServer, stopMCPServer, getServerInfo, getOrCreateApiKey, regenerateApiKey } from './server'
import { setupStoreBridge, setMainWindow } from './server/bridges/storeBridge'

// Handle EPIPE errors globally (broken pipe when console is disconnected)
process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') {
    // Ignore EPIPE errors - they happen when stdout/stderr pipe is broken
    return
  }
  // For other uncaught exceptions, log and continue (or crash in production)
  console.error('Uncaught exception:', error)
})

// Initialize electron-store
const store = new Store()

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

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
    trafficLightPosition: isMac ? { x: 8, y: 8 } : undefined, // Position traffic lights on macOS (left-aligned in 32px menu bar)
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

  // Setup store bridge for MCP server
  setMainWindow(mainWindow)
  setupStoreBridge(mainWindow)

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

  // MCP Server IPC handlers
  ipcMain.handle('mcp:getServerInfo', () => {
    return getServerInfo()
  })

  ipcMain.handle('mcp:start', async () => {
    try {
      await startMCPServer()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mcp:stop', async () => {
    try {
      await stopMCPServer()
      return { success: true }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('mcp:getApiKey', () => {
    return getOrCreateApiKey()
  })

  ipcMain.handle('mcp:regenerateApiKey', () => {
    return regenerateApiKey()
  })

  ipcMain.handle('mcp:setEnabled', async (_, enabled: boolean) => {
    store.set('mcp.enabled', enabled)
    if (enabled) {
      try {
        await startMCPServer()
        return { success: true }
      } catch (err) {
        return { success: false, error: (err as Error).message }
      }
    } else {
      await stopMCPServer()
      return { success: true }
    }
  })

  ipcMain.handle('mcp:setPort', async (_, port: number) => {
    store.set('mcp.port', port)
    // Restart server if running
    const info = getServerInfo()
    if (info.isRunning) {
      await stopMCPServer()
      await startMCPServer()
    }
    return { success: true }
  })
}

// Extend app type for isQuitting property
declare module 'electron' {
  interface App {
    isQuitting?: boolean
  }
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

  app.whenReady().then(async () => {
    createWindow()
    createTray()
    registerGlobalShortcuts()
    setupIPC()

    // Start MCP Server if enabled
    const mcpEnabled = store.get('mcp.enabled') as boolean ?? false
    if (mcpEnabled) {
      try {
        await startMCPServer()
        console.log('[Main] MCP Server started')
      } catch (err) {
        console.error('[Main] Failed to start MCP Server:', err)
      }
    }

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

app.on('will-quit', async () => {
  globalShortcut.unregisterAll()
  // Stop MCP Server
  try {
    await stopMCPServer()
  } catch (err) {
    console.error('[Main] Error stopping MCP Server:', err)
  }
})

app.on('before-quit', (event) => {
  app.isQuitting = true
  // Send signal to renderer to push data before quitting
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('app:before-quit')
  }
})
