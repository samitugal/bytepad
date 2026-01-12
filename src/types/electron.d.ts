// Type definitions for Electron API exposed via preload
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

  // Shortcut listeners
  onShortcut: (callback: (action: string) => void) => void
  removeShortcutListeners: () => void

  // App lifecycle
  onBeforeQuit: (callback: () => void) => void
  removeBeforeQuitListener: () => void

  // Check if running in Electron
  isElectron: boolean
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
