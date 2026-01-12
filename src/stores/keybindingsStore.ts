// Keybindings Store - Manages custom keyboard shortcuts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Keybinding {
  id: string
  action: string
  label: string
  description: string
  keys: string // e.g., "ctrl+k", "ctrl+shift+f"
  category: 'navigation' | 'actions' | 'focus' | 'system'
  isCustom?: boolean
}

// Default keybindings
export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  // Navigation
  { id: 'nav-notes', action: 'navigate:notes', label: 'Notes', description: 'Switch to Notes module', keys: 'ctrl+1', category: 'navigation' },
  { id: 'nav-dailynotes', action: 'navigate:dailynotes', label: 'Daily Notes', description: 'Switch to Daily Notes', keys: 'ctrl+2', category: 'navigation' },
  { id: 'nav-habits', action: 'navigate:habits', label: 'Habits', description: 'Switch to Habits module', keys: 'ctrl+3', category: 'navigation' },
  { id: 'nav-tasks', action: 'navigate:tasks', label: 'Tasks', description: 'Switch to Tasks module', keys: 'ctrl+4', category: 'navigation' },
  { id: 'nav-journal', action: 'navigate:journal', label: 'Journal', description: 'Switch to Journal module', keys: 'ctrl+5', category: 'navigation' },
  { id: 'nav-bookmarks', action: 'navigate:bookmarks', label: 'Bookmarks', description: 'Switch to Bookmarks', keys: 'ctrl+6', category: 'navigation' },
  { id: 'nav-calendar', action: 'navigate:calendar', label: 'Calendar', description: 'Switch to Calendar', keys: 'ctrl+7', category: 'navigation' },
  { id: 'nav-graph', action: 'navigate:graph', label: 'Graph', description: 'Switch to Knowledge Graph', keys: 'ctrl+8', category: 'navigation' },
  { id: 'nav-analysis', action: 'navigate:analysis', label: 'Analysis', description: 'Switch to Analysis', keys: 'ctrl+9', category: 'navigation' },

  // System
  { id: 'sys-command-palette', action: 'system:commandPalette', label: 'Command Palette', description: 'Open command palette', keys: 'ctrl+k', category: 'system' },
  { id: 'sys-settings', action: 'system:settings', label: 'Settings', description: 'Open settings', keys: 'ctrl+,', category: 'system' },
  { id: 'sys-shortcuts', action: 'system:shortcuts', label: 'Shortcuts Help', description: 'Show keyboard shortcuts', keys: 'ctrl+?', category: 'system' },
  { id: 'sys-chat', action: 'system:chat', label: 'Toggle FlowBot', description: 'Open/close AI chat', keys: 'ctrl+/', category: 'system' },
  { id: 'sys-search', action: 'system:globalSearch', label: 'Global Search', description: 'Open global search', keys: 'alt+u', category: 'system' },
  { id: 'sys-notifications', action: 'system:notifications', label: 'Notifications', description: 'Toggle notification center', keys: 'ctrl+shift+n', category: 'system' },

  // Focus
  { id: 'focus-mode', action: 'focus:toggle', label: 'Focus Mode', description: 'Toggle focus/pomodoro mode', keys: 'ctrl+shift+o', category: 'focus' },

  // Actions
  { id: 'action-new', action: 'action:new', label: 'New Item', description: 'Create new item in current module', keys: 'ctrl+n', category: 'actions' },
  { id: 'action-new-tab', action: 'action:newTab', label: 'New Tab', description: 'Open new tab (Notes)', keys: 'ctrl+t', category: 'actions' },
  { id: 'action-close-tab', action: 'action:closeTab', label: 'Close Tab', description: 'Close current tab', keys: 'ctrl+w', category: 'actions' },
  { id: 'action-next-tab', action: 'action:nextTab', label: 'Next Tab', description: 'Switch to next tab', keys: 'ctrl+tab', category: 'actions' },
  { id: 'action-prev-tab', action: 'action:prevTab', label: 'Previous Tab', description: 'Switch to previous tab', keys: 'ctrl+shift+tab', category: 'actions' },
]

interface KeybindingsState {
  keybindings: Keybinding[]
  customKeybindings: Record<string, string> // id -> keys mapping for overrides

  // Actions
  setKeybinding: (id: string, keys: string) => void
  resetKeybinding: (id: string) => void
  resetAllKeybindings: () => void
  addCustomKeybinding: (keybinding: Omit<Keybinding, 'id' | 'isCustom'>) => string
  removeCustomKeybinding: (id: string) => void

  // Getters
  getKeybinding: (id: string) => Keybinding | undefined
  getKeybindingByAction: (action: string) => Keybinding | undefined
  getEffectiveKeys: (id: string) => string
  isKeysConflict: (keys: string, excludeId?: string) => Keybinding | null
}

export const useKeybindingsStore = create<KeybindingsState>()(
  persist(
    (set, get) => ({
      keybindings: DEFAULT_KEYBINDINGS,
      customKeybindings: {},

      setKeybinding: (id, keys) => {
        set((state) => ({
          customKeybindings: {
            ...state.customKeybindings,
            [id]: keys,
          },
        }))
      },

      resetKeybinding: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.customKeybindings
          return { customKeybindings: rest }
        })
      },

      resetAllKeybindings: () => {
        set({ customKeybindings: {} })
      },

      addCustomKeybinding: (keybinding) => {
        const id = `custom-${Date.now()}`
        set((state) => ({
          keybindings: [
            ...state.keybindings,
            { ...keybinding, id, isCustom: true },
          ],
        }))
        return id
      },

      removeCustomKeybinding: (id) => {
        set((state) => ({
          keybindings: state.keybindings.filter((k) => k.id !== id),
          customKeybindings: Object.fromEntries(
            Object.entries(state.customKeybindings).filter(([key]) => key !== id)
          ),
        }))
      },

      getKeybinding: (id) => {
        return get().keybindings.find((k) => k.id === id)
      },

      getKeybindingByAction: (action) => {
        const state = get()
        const kb = state.keybindings.find((k) => k.action === action)
        if (!kb) return undefined
        return {
          ...kb,
          keys: state.customKeybindings[kb.id] || kb.keys,
        }
      },

      getEffectiveKeys: (id) => {
        const state = get()
        return state.customKeybindings[id] || state.keybindings.find((k) => k.id === id)?.keys || ''
      },

      isKeysConflict: (keys, excludeId) => {
        const state = get()
        const normalizedKeys = normalizeKeys(keys)

        for (const kb of state.keybindings) {
          if (excludeId && kb.id === excludeId) continue
          const effectiveKeys = normalizeKeys(state.customKeybindings[kb.id] || kb.keys)
          if (effectiveKeys === normalizedKeys) {
            return kb
          }
        }
        return null
      },
    }),
    {
      name: 'bytepad-keybindings',
      partialize: (state) => ({
        customKeybindings: state.customKeybindings,
      }),
    }
  )
)

// Helper functions
export function normalizeKeys(keys: string): string {
  return keys
    .toLowerCase()
    .split('+')
    .map((k) => k.trim())
    .sort((a, b) => {
      // Sort modifiers first: ctrl, alt, shift, then key
      const order = { ctrl: 0, alt: 1, shift: 2 }
      const aOrder = order[a as keyof typeof order] ?? 3
      const bOrder = order[b as keyof typeof order] ?? 3
      return aOrder - bOrder
    })
    .join('+')
}

export function parseKeybinding(keys: string): {
  ctrlKey: boolean
  altKey: boolean
  shiftKey: boolean
  key: string
} {
  const parts = keys.toLowerCase().split('+').map((k) => k.trim())
  return {
    ctrlKey: parts.includes('ctrl'),
    altKey: parts.includes('alt'),
    shiftKey: parts.includes('shift'),
    key: parts.find((k) => !['ctrl', 'alt', 'shift'].includes(k)) || '',
  }
}

export function formatKeybinding(keys: string): string {
  const parts = keys.split('+').map((k) => k.trim())
  return parts
    .map((k) => {
      const lower = k.toLowerCase()
      if (lower === 'ctrl') return 'Ctrl'
      if (lower === 'alt') return 'Alt'
      if (lower === 'shift') return 'Shift'
      if (lower === 'tab') return 'Tab'
      if (lower === 'escape' || lower === 'esc') return 'Esc'
      if (lower === 'enter') return 'Enter'
      if (lower === 'space') return 'Space'
      if (lower === 'backspace') return 'Backspace'
      if (lower === 'delete') return 'Del'
      if (k.length === 1) return k.toUpperCase()
      return k
    })
    .join('+')
}

export function matchesKeybinding(
  event: KeyboardEvent,
  keys: string
): boolean {
  const parsed = parseKeybinding(keys)

  if (event.ctrlKey !== parsed.ctrlKey) return false
  if (event.altKey !== parsed.altKey) return false
  if (event.shiftKey !== parsed.shiftKey) return false

  const eventKey = event.key.toLowerCase()
  const targetKey = parsed.key.toLowerCase()

  // Handle special cases
  if (targetKey === '/' && eventKey === '/') return true
  if (targetKey === '?' && event.shiftKey && eventKey === '/') return true
  if (targetKey === ',' && eventKey === ',') return true
  if (targetKey === 'tab' && eventKey === 'tab') return true

  return eventKey === targetKey
}

// Get all keybindings grouped by category
export function getKeybindingsByCategory(): Record<string, Keybinding[]> {
  const state = useKeybindingsStore.getState()
  const result: Record<string, Keybinding[]> = {
    navigation: [],
    system: [],
    focus: [],
    actions: [],
  }

  for (const kb of state.keybindings) {
    const effectiveKb = {
      ...kb,
      keys: state.customKeybindings[kb.id] || kb.keys,
    }
    result[kb.category].push(effectiveKb)
  }

  return result
}
