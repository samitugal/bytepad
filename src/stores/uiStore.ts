import { create } from 'zustand'
import type { ModuleType } from '../types'

interface UIState {
  activeModule: ModuleType
  commandPaletteOpen: boolean
  focusMode: boolean
  focusModeMinimized: boolean
  isNotificationCenterOpen: boolean
  globalSearchOpen: boolean
  globalSearchQuery: string
  shortcutsModalOpen: boolean
  settingsOpen: boolean
  setActiveModule: (module: ModuleType) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleFocusMode: () => void
  setFocusMode: (open: boolean) => void
  minimizeFocusMode: () => void
  expandFocusMode: () => void
  toggleNotificationCenter: () => void
  setNotificationCenterOpen: (open: boolean) => void
  toggleGlobalSearch: () => void
  setGlobalSearchOpen: (open: boolean) => void
  openGlobalSearchWithQuery: (query: string) => void
  toggleShortcutsModal: () => void
  setShortcutsModalOpen: (open: boolean) => void
  toggleSettings: () => void
  setSettingsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'notes',
  commandPaletteOpen: false,
  focusMode: false,
  focusModeMinimized: false,
  isNotificationCenterOpen: false,
  globalSearchOpen: false,
  globalSearchQuery: '',
  shortcutsModalOpen: false,
  settingsOpen: false,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode, focusModeMinimized: false })),
  setFocusMode: (open) => set({ focusMode: open, focusModeMinimized: false }),
  minimizeFocusMode: () => set({ focusModeMinimized: true }),
  expandFocusMode: () => set({ focusModeMinimized: false }),
  toggleNotificationCenter: () => set((state) => ({ isNotificationCenterOpen: !state.isNotificationCenterOpen })),
  setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),
  toggleGlobalSearch: () => set((state) => ({ globalSearchOpen: !state.globalSearchOpen, globalSearchQuery: state.globalSearchOpen ? '' : state.globalSearchQuery })),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open, globalSearchQuery: open ? '' : '' }),
  openGlobalSearchWithQuery: (query) => set({ globalSearchOpen: true, globalSearchQuery: query }),
  toggleShortcutsModal: () => set((state) => ({ shortcutsModalOpen: !state.shortcutsModalOpen })),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
}))
