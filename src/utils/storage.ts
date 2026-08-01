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
// Electron: routed through the IPC `store` bridge above, which persists to
// electron-store's JSON file in the OS user-data directory instead of the
// renderer's localStorage. NOTE: this is not yet OS-keychain encrypted at
// rest (that requires a main-process `safeStorage` channel — electron/main.ts
// is out of scope for this change, see settingsStore.ts for details); moving
// secrets off localStorage and out of the general settings blob is the
// improvement made here.
//
// Web/PWA: there is no OS-backed secure storage available in the browser
// sandbox, so secrets are held in sessionStorage only. sessionStorage is
// cleared when the tab/browser session ends, so keys never sit at rest in
// persistent plaintext storage the way they did in localStorage — the
// trade-off is that users must re-enter keys in a new browser session.
const SECRETS_KEY = 'bytepad-secrets'

export interface StoredSecrets {
  apiKeys?: Record<string, string>
  githubToken?: string
  emailjsPublicKey?: string
}

export const secretsStorage = {
  async load(): Promise<StoredSecrets | null> {
    try {
      if (isElectron()) {
        const raw = await storage.getItem(SECRETS_KEY)
        return raw ? (JSON.parse(raw) as StoredSecrets) : null
      }
      const raw = sessionStorage.getItem(SECRETS_KEY)
      return raw ? (JSON.parse(raw) as StoredSecrets) : null
    } catch {
      return null
    }
  },

  async save(secrets: StoredSecrets): Promise<void> {
    if (isElectron()) {
      await storage.setItem(SECRETS_KEY, JSON.stringify(secrets))
      return
    }
    sessionStorage.setItem(SECRETS_KEY, JSON.stringify(secrets))
  },

  async clear(): Promise<void> {
    if (isElectron()) {
      await storage.removeItem(SECRETS_KEY)
      return
    }
    sessionStorage.removeItem(SECRETS_KEY)
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