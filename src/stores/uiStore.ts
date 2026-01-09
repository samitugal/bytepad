import { create } from 'zustand'
import type { ModuleType } from '../types'

interface UIState {
  activeModule: ModuleType
  commandPaletteOpen: boolean
  focusMode: boolean
  setActiveModule: (module: ModuleType) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleFocusMode: () => void
}

export const useUIStore = create<UIState>((set) => ({
  activeModule: 'notes',
  commandPaletteOpen: false,
  focusMode: false,
  setActiveModule: (module) => set({ activeModule: module }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleFocusMode: () => set((state) => ({ focusMode: !state.focusMode })),
}))
