import { useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import type { ModuleType } from '../types'

const MODULE_MAP: Record<string, ModuleType> = {
  '1': 'notes',
  '2': 'habits',
  '3': 'tasks',
  '4': 'journal',
  '5': 'analysis',
}

export function useKeyboardShortcuts() {
  const { setActiveModule, toggleCommandPalette } = useUIStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      // Allow Escape to blur
      if (e.key === 'Escape') {
        target.blur()
      }
      return
    }

    // Ctrl+K - Command Palette
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      toggleCommandPalette()
      return
    }

    // Ctrl+1-5 - Module navigation
    if (e.ctrlKey && MODULE_MAP[e.key]) {
      e.preventDefault()
      setActiveModule(MODULE_MAP[e.key])
      return
    }

    // Escape - Close modals
    if (e.key === 'Escape') {
      useUIStore.getState().setCommandPaletteOpen(false)
    }
  }, [setActiveModule, toggleCommandPalette])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
