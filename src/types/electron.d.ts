// Type definitions for Electron API exposed via preload

export interface MCPServerInfo {
  isRunning: boolean
  port: number
  host: string
  apiKey: string
  connectedClients: number
  startedAt: string | null
}

export interface ElectronAPI {
  // Window controls
  minimize: () => void
  maximize: () => void
  close: () => void

  // Store operations
  store: {
    get: (key: string) => Promise<unknown>
    set: (key: string, value: unknown) => Promise<void>
    delete: (key: string) => Promise<void>
    has: (key: string) => Promise<boolean>
  }

  // App info
  getVersion: () => Promise<string>
  isPackaged: () => Promise<boolean>

  // Shell operations
  openExternal: (url: string) => void

  // Notifications
  showNotification: (title: string, body: string) => void

  // Auto-start
  autostart: {
    get: () => Promise<boolean>
    set: (enabled: boolean) => Promise<void>
  }

  // MCP Server
  mcp: {
    getServerInfo: () => Promise<MCPServerInfo>
    start: () => Promise<{ success: boolean; error?: string }>
    stop: () => Promise<{ success: boolean; error?: string }>
    getApiKey: () => Promise<string>
    regenerateApiKey: () => Promise<string>
    setEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>
    setPort: (port: number) => Promise<{ success: boolean; error?: string }>
  }

  // Shortcut listeners
  onShortcut: (callback: (action: string) => void) => void
  removeShortcutListeners: () => void

  // App lifecycle
  onBeforeQuit: (callback: () => void) => void
  removeBeforeQuitListener: () => void

  // Check if running in Electron
  isElectron: boolean

  // Store bridge for MCP server
  storeBridge?: {
    onStoreRequest: (handler: (channel: string, requestId: string, ...args: unknown[]) => void) => void
    sendResponse: (requestId: string, data: unknown, error?: string) => void
    notifyChange: (storeName: string, action: string, data: unknown) => void
  }
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
