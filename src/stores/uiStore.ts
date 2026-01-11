import { create } from 'zustand'
import type { ModuleType } from '../types'

interface UIState {
  activeModule: ModuleType
  commandPaletteOpen: boolean
  focusMode: boolean
  focusModeMinimized: boolean
  isNotificationCenterOpen: boolean
  globalSearchOpen: boolean
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
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'notes',
  commandPaletteOpen: false,
  focusMode: false,
  focusModeMinimized: false,
  isNotificationCenterOpen: false,
  globalSearchOpen: false,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode, focusModeMinimized: false })),
  setFocusMode: (open) => set({ focusMode: open, focusModeMinimized: false }),
  minimizeFocusMode: () => set({ focusModeMinimized: true }),
  expandFocusMode: () => set({ focusModeMinimized: false }),
  toggleNotificationCenter: () => set((state) => ({ isNotificationCenterOpen: !state.isNotificationCenterOpen })),
  setNotificationCenterOpen: (open) => set({ isNotificationCenterOpen: open }),
  toggleGlobalSearch: () => set((state) => ({ globalSearchOpen: !state.globalSearchOpen })),
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
}))
