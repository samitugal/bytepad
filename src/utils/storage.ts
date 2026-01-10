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
