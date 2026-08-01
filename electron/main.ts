import { app, BrowserWindow, Tray, Menu, globalShortcut, ipcMain, shell, nativeImage, Notification, session, safeStorage } from 'electron'
import path from 'path'
import Store from 'electron-store'
import { startMCPServer, stopMCPServer, getServerInfo, getOrCreateApiKey, regenerateApiKey } from './server'
import { setupStoreBridge, setMainWindow } from './server/bridges/storeBridge'
import {
  isDockerInstalled,
  isDockerRunning,
  getDockerStatus,
  startDockerContainer,
  stopDockerContainer,
  removeDockerContainer,
  getContainerLogs,
  imageExists,
} from './services/dockerService'

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

// Origins the renderer legitimately talks to: AI providers, Firebase Auth/Firestore,
// GitHub (Gist sync + update checker) and Tavily search. Keep this list in sync with
// any new outbound API the renderer starts calling.
const DEV_SERVER_ORIGIN = 'http://localhost:5173'
const ALLOWED_CONNECT_ORIGINS = [
  "'self'",
  'https://api.anthropic.com',
  'https://api.openai.com',
  'https://generativelanguage.googleapis.com',
  'https://api.groq.com',
  'https://api.tavily.com',
  'https://api.github.com',
  'https://firestore.googleapis.com',
  'https://identitytoolkit.googleapis.com',
  'https://securetoken.googleapis.com',
]

// Firebase's Google sign-in (src/services/firebase.ts calls signInWithPopup) is not just
// a plain popup: the JS SDK also loads Google's gapi client script and embeds a hidden
// 1x1 iframe at `${authDomain}/__/auth/iframe` in the MAIN document to relay the auth
// result back from the popup. Both are required for the flow to complete, not optional.
// authDomain comes straight from the same env var firebase.ts reads (VITE_FIREBASE_AUTH_DOMAIN,
// see .env.example) so this can never drift from what's actually configured.
const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined
const GAPI_SCRIPT_ORIGIN = 'https://apis.google.com'
const GOOGLE_ACCOUNTS_ORIGIN = 'https://accounts.google.com'

function buildContentSecurityPolicy(): string {
  const connectSrc = [...ALLOWED_CONNECT_ORIGINS]
  if (isDev) {
    // Vite dev server + its HMR websocket
    connectSrc.push(DEV_SERVER_ORIGIN, 'ws://localhost:5173')
  }

  const scriptSrc = ["'self'", GAPI_SCRIPT_ORIGIN]
  if (isDev) {
    // Vite's dev client + React Fast Refresh inject inline/eval'd code; production
    // build is plain 'self' + gapi module scripts only.
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'")
  }

  const frameSrc = ["'none'"]
  if (FIREBASE_AUTH_DOMAIN) {
    // Only when Firebase is actually configured - see firebase.ts isConfigured().
    frameSrc[0] = `https://${FIREBASE_AUTH_DOMAIN}`
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(' ')}`,
    // React inline style props + Tailwind require 'unsafe-inline'; Google Fonts stylesheet.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Bookmark favicons and Google account avatars are arbitrary https hosts.
    "img-src 'self' data: https:",
    `connect-src ${connectSrc.join(' ')}`,
    "object-src 'none'",
    "base-uri 'self'",
    // No <form> is used anywhere in the app (React-controlled inputs only); Google's
    // OAuth redirect flow happens via popup navigation, not a form POST from our
    // document, so this does not need to be loosened for sign-in to work.
    "form-action 'self'",
    // Hidden gapi relay iframe for Firebase auth events; 'none' when Firebase isn't configured.
    `frame-src ${frameSrc.join(' ')}`,
    "worker-src 'self'",
  ]

  return directives.join('; ')
}

// Applies the CSP as a response header on the top-level document only, so it works
// identically whether the renderer is served from the Vite dev server (http://) or
// loaded from the packaged app (file://) in production.
function setupContentSecurityPolicy(): void {
  const csp = buildContentSecurityPolicy()

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    if (details.resourceType !== 'mainFrame') {
      callback({ responseHeaders: details.responseHeaders })
      return
    }
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })
}

// Only http(s) links and mailto: should ever leave the app via the OS shell.
// Anything else (file:, smb:, custom schemes, ...) is dropped silently.
const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['https:', 'mailto:'])

function openExternalSafely(targetUrl: string): void {
  try {
    const parsed = new URL(targetUrl)
    if (ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol)) {
      shell.openExternal(targetUrl)
    } else {
      console.warn('[Main] Blocked shell.openExternal for disallowed protocol:', parsed.protocol)
    }
  } catch {
    console.warn('[Main] Blocked shell.openExternal for unparsable URL:', targetUrl)
  }
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
      sandbox: true,
    },
    backgroundColor: '#1E1E1E',
    show: false, // Show when ready
  })

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Deny opening new BrowserWindows/popups by default; route legitimate http(s)/mailto
  // links to the OS's default handler instead of letting the renderer spawn windows.
  // Exception: Firebase's signInWithPopup (src/services/firebase.ts) needs a real child
  // window it can complete a postMessage handshake with - routing that to the system
  // browser breaks Google sign-in outright. Only the Firebase auth handler origin
  // (window.open target) and Google's own sign-in origin are allowed through; the child
  // window still gets the same locked-down webPreferences as the main window, no preload.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    let origin: string
    try {
      origin = new URL(url).origin
    } catch {
      return { action: 'deny' }
    }

    const isAuthPopup =
      (FIREBASE_AUTH_DOMAIN && origin === `https://${FIREBASE_AUTH_DOMAIN}`) ||
      origin === GOOGLE_ACCOUNTS_ORIGIN

    if (isAuthPopup) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      }
    }

    openExternalSafely(url)
    return { action: 'deny' }
  })

  // Block the renderer from navigating the main frame away from the app itself
  // (dev server origin in development, the packaged app's own files in production).
  // Electron scopes 'will-navigate' to the top-level main frame of this webContents only
  // (see Electron docs), so this cannot fire for: (a) the Firebase auth popup, which is a
  // separate webContents handled by setWindowOpenHandler above, or (b) the hidden gapi
  // relay <iframe> Firebase injects into this document, which is a subframe navigation,
  // not a main-frame one. Neither leg of the OAuth handshake is affected by this guard.
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const isAllowedNavigation = isDev
      ? navigationUrl.startsWith(DEV_SERVER_ORIGIN)
      : navigationUrl.startsWith('file://')

    if (isAllowedNavigation) return

    event.preventDefault()
    openExternalSafely(navigationUrl)
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

  // Secrets operations — encrypted at rest via Electron's safeStorage.
  // Persisted under a `secureSecrets.*` namespace in the same electron-store
  // file so encrypted envelopes never mix with plaintext `store:*` values.
  // Envelope shape: { encrypted: boolean, data: string }. `data` is base64
  // ciphertext when `encrypted` is true; it is only ever a plaintext JSON
  // string when safeStorage.isEncryptionAvailable() is false (e.g. some
  // Linux setups without a keyring reachable by libsecret) — the envelope
  // makes that fallback explicit instead of silently writing plaintext
  // under an `encrypted: true` label.
  const SECRETS_PREFIX = 'secureSecrets.'

  function encryptSecret(value: unknown): { encrypted: boolean; data: string } {
    const json = JSON.stringify(value)
    if (safeStorage.isEncryptionAvailable()) {
      return { encrypted: true, data: safeStorage.encryptString(json).toString('base64') }
    }
    console.warn('[secrets] safeStorage encryption is unavailable on this system (no OS keychain/keyring reachable) — storing this value in plaintext and flagging it as unencrypted.')
    return { encrypted: false, data: json }
  }

  function decryptSecret(entry: { encrypted: boolean; data: string } | undefined): unknown {
    if (!entry) return undefined
    try {
      if (entry.encrypted) {
        return JSON.parse(safeStorage.decryptString(Buffer.from(entry.data, 'base64')))
      }
      return JSON.parse(entry.data)
    } catch (err) {
      console.error('[secrets] Failed to read a stored secret (possibly corrupted or encrypted under a different OS key):', err)
      return undefined
    }
  }

  ipcMain.handle('secrets:isAvailable', () => safeStorage.isEncryptionAvailable())

  ipcMain.handle('secrets:get', (_, key: string) => {
    return decryptSecret(store.get(`${SECRETS_PREFIX}${key}`) as { encrypted: boolean; data: string } | undefined)
  })

  ipcMain.handle('secrets:set', (_, key: string, value: unknown) => {
    const entry = encryptSecret(value)
    store.set(`${SECRETS_PREFIX}${key}`, entry)
    return { encrypted: entry.encrypted }
  })

  ipcMain.handle('secrets:delete', (_, key: string) => {
    store.delete(`${SECRETS_PREFIX}${key}`)
  })

  // One-time migration: pre-safeStorage builds wrote secrets in plaintext
  // to the legacy `store:*` key `bytepad-secrets`. Move that value into the
  // encrypted envelope above and remove the plaintext copy. Idempotent: the
  // whole block is gated on the legacy key still existing, so after the
  // first successful run `store.has('bytepad-secrets')` is false and every
  // later launch skips it. The new value is written before the old one is
  // deleted, so a crash mid-migration just re-runs it next launch without
  // losing any keys.
  if (store.has('bytepad-secrets')) {
    const legacySecrets = store.get('bytepad-secrets')
    store.set(`${SECRETS_PREFIX}bytepad-secrets`, encryptSecret(legacySecrets))
    store.delete('bytepad-secrets')
    console.log('[secrets] Migrated legacy plaintext secrets into safeStorage-encrypted storage.')
  }

  // App info
  ipcMain.handle('app:version', () => app.getVersion())
  ipcMain.handle('app:isPackaged', () => app.isPackaged)

  // Shell operations
  ipcMain.on('shell:openExternal', (_, url: string) => {
    openExternalSafely(url)
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

  // Docker IPC handlers
  ipcMain.handle('docker:isInstalled', async () => {
    return await isDockerInstalled()
  })

  ipcMain.handle('docker:isRunning', async () => {
    return await isDockerRunning()
  })

  ipcMain.handle('docker:getStatus', async () => {
    return await getDockerStatus()
  })

  ipcMain.handle('docker:start', async () => {
    // Check if Docker is installed first
    const installed = await isDockerInstalled()
    if (!installed) {
      return {
        success: false,
        error: 'Docker is not installed. Please install Docker Desktop first.',
        errorCode: 'DOCKER_NOT_INSTALLED'
      }
    }

    // Check if Docker daemon is running
    const running = await isDockerRunning()
    if (!running) {
      return {
        success: false,
        error: 'Docker daemon is not running. Please start Docker Desktop.',
        errorCode: 'DOCKER_NOT_RUNNING'
      }
    }

    // Check if image exists
    const hasImage = await imageExists()
    if (!hasImage) {
      return {
        success: false,
        error: 'Docker image not found. Please run: docker-compose build',
        errorCode: 'IMAGE_NOT_FOUND'
      }
    }

    return await startDockerContainer()
  })

  ipcMain.handle('docker:stop', async () => {
    return await stopDockerContainer()
  })

  ipcMain.handle('docker:remove', async () => {
    return await removeDockerContainer()
  })

  ipcMain.handle('docker:logs', async (_, lines?: unknown) => {
    const safeLines =
      typeof lines === 'number' && Number.isInteger(lines) && lines >= 1 && lines <= 100000
        ? lines
        : undefined
    return await getContainerLogs(safeLines)
  })

  ipcMain.handle('docker:imageExists', async () => {
    return await imageExists()
  })

  // Combined MCP Docker enable handler
  ipcMain.handle('mcp:setDockerEnabled', async (_, enabled: unknown) => {
    if (enabled === true) {
      // Check Docker availability
      const installed = await isDockerInstalled()
      if (!installed) {
        return {
          success: false,
          error: 'Docker is not installed. Please install Docker Desktop to use MCP Docker mode.',
          errorCode: 'DOCKER_NOT_INSTALLED'
        }
      }

      const running = await isDockerRunning()
      if (!running) {
        return {
          success: false,
          error: 'Docker is not running. Please start Docker Desktop.',
          errorCode: 'DOCKER_NOT_RUNNING'
        }
      }

      const hasImage = await imageExists()
      if (!hasImage) {
        return {
          success: false,
          error: 'Docker image not built. Run: cd docker/mcp-server && docker-compose build',
          errorCode: 'IMAGE_NOT_FOUND'
        }
      }

      const result = await startDockerContainer()
      if (result.success) {
        store.set('mcp.docker.enabled', true)
      }
      return result
    } else {
      const result = await stopDockerContainer()
      if (result.success) {
        store.set('mcp.docker.enabled', false)
      }
      return result
    }
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
    setupContentSecurityPolicy()
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
