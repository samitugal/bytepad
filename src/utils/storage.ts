// Storage utility that works in both Electron and web environments
// Uses electron-store in Electron, localStorage in browser

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron
}

export const storage = {
  async getItem(name: string): Promise<string | null> {
    if (isElectron()) {
      const value = await window.electronAPI!.store.get(name)
      return value ? JSON.stringify(value) : null
    }
    return localStorage.getItem(name)
  },

  async setItem(name: string, value: string): Promise<void> {
    if (isElectron()) {
      try {
        const parsed = JSON.parse(value)
        await window.electronAPI!.store.set(name, parsed)
      } catch {
        await window.electronAPI!.store.set(name, value)
      }
    } else {
      localStorage.setItem(name, value)
    }
  },

  async removeItem(name: string): Promise<void> {
    if (isElectron()) {
      await window.electronAPI!.store.delete(name)
    } else {
      localStorage.removeItem(name)
    }
  },
}

// Zustand persist storage adapter
export const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return storage.getItem(name)
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return storage.setItem(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    return storage.removeItem(name)
  },
}

// Secrets storage — separate from the general zustand-persisted settings blob.
//
// Electron: routed through the dedicated IPC `secrets` bridge (NOT the
// generic `store` bridge above), which encrypts with the main process's
// safeStorage before persisting to electron-store's JSON file in the OS
// user-data directory. See electron/main.ts for the encrypt/decrypt
// envelope and the one-time migration of pre-safeStorage plaintext values.
// If safeStorage.isEncryptionAvailable() is false on the current system
// (some Linux setups without a reachable keyring), the main process still
// stores the value but flags it as unencrypted rather than silently
// writing plaintext under an "encrypted" label — see isEncryptionAvailable
// below for how the renderer can surface that.
//
// Web/PWA: there is no OS-backed secure storage available in the browser
// sandbox. By default secrets are held in sessionStorage only, which is
// cleared when the tab/browser session ends, so keys never sit at rest in
// persistent plaintext storage the way they did in localStorage. Users can
// opt in (see setRememberOnDevice) to also persist to localStorage, which
// trades that protection for not having to re-enter keys every session —
// the UI is responsible for warning that this is unencrypted at rest.
const SECRETS_KEY = 'bytepad-secrets'
const REMEMBER_ON_DEVICE_KEY = 'bytepad-secrets-remember'

export interface StoredSecrets {
  apiKeys?: Record<string, string>
  githubToken?: string
}

// Web-only: whether the user opted in to persisting secrets to localStorage.
// Always false in Electron, where safeStorage covers persistence instead.
export function isRememberOnDeviceEnabled(): boolean {
  if (isElectron()) return false
  try {
    return localStorage.getItem(REMEMBER_ON_DEVICE_KEY) === 'true'
  } catch {
    return false
  }
}

export const secretsStorage = {
  async load(): Promise<StoredSecrets | null> {
    try {
      if (isElectron()) {
        const value = await window.electronAPI!.secrets.get(SECRETS_KEY)
        return (value as StoredSecrets | undefined) ?? null
      }
      if (isRememberOnDeviceEnabled()) {
        const remembered = localStorage.getItem(SECRETS_KEY)
        if (remembered) return JSON.parse(remembered) as StoredSecrets
      }
      const raw = sessionStorage.getItem(SECRETS_KEY)
      return raw ? (JSON.parse(raw) as StoredSecrets) : null
    } catch {
      return null
    }
  },

  async save(secrets: StoredSecrets): Promise<void> {
    if (isElectron()) {
      await window.electronAPI!.secrets.set(SECRETS_KEY, secrets)
      return
    }
    sessionStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
    if (isRememberOnDeviceEnabled()) {
      localStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
    }
  },

  async clear(): Promise<void> {
    if (isElectron()) {
      await window.electronAPI!.secrets.delete(SECRETS_KEY)
      return
    }
    sessionStorage.removeItem(SECRETS_KEY)
    localStorage.removeItem(SECRETS_KEY)
  },

  // Electron only: resolves false on web (no equivalent concept there) and
  // false if the main process reports safeStorage.isEncryptionAvailable()
  // as false. Callers can use this to warn the user that credentials are
  // not encrypted at rest on this system.
  async isEncryptionAvailable(): Promise<boolean> {
    if (!isElectron()) return false
    return window.electronAPI!.secrets.isAvailable()
  },

  // Web only: toggles whether secrets are also persisted to localStorage.
  // No-ops in Electron. Turning this OFF actively clears the localStorage
  // copy rather than just stopping future writes to it.
  async setRememberOnDevice(enabled: boolean): Promise<void> {
    if (isElectron()) return
    try {
      if (enabled) {
        localStorage.setItem(REMEMBER_ON_DEVICE_KEY, 'true')
        const current = sessionStorage.getItem(SECRETS_KEY)
        if (current) localStorage.setItem(SECRETS_KEY, current)
      } else {
        localStorage.removeItem(REMEMBER_ON_DEVICE_KEY)
        localStorage.removeItem(SECRETS_KEY)
      }
    } catch {
      // Ignore storage errors (e.g. localStorage disabled in private browsing).
    }
  },
}

// Parse tags from input string - supports multiple formats:
// - Comma separated: "tag1, tag2, tag3"
// - Space separated: "tag1 tag2 tag3"
// - Hash prefixed: "#tag1 #tag2 #tag3"
// - Mixed: "#tag1, tag2 #tag3"
export function parseTags(input: string): string[] {
  if (!input || !input.trim()) return []

  // First, normalize the input: replace commas with spaces
  const normalized = input.replace(/,/g, ' ')
  
  // Split by whitespace
  const parts = normalized.split(/\s+/).filter(Boolean)
  
  // Process each part: remove leading # and trim
  const tags = parts.map(part => {
    let tag = part.trim()
    // Remove leading # if present
    if (tag.startsWith('#')) {
      tag = tag.substring(1)
    }
    return tag.trim().toLowerCase()
  }).filter(Boolean)
  
  // Remove duplicates while preserving order
  return [...new Set(tags)]
}