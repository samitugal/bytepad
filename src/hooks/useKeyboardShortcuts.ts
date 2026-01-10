import { useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import type { ModuleType } from '../types'

const MODULE_MAP: Record<string, ModuleType> = {
  '1': 'notes',
  '2': 'habits',
  '3': 'tasks',
  '4': 'journal',
  '5': 'bookmarks',
  '6': 'analysis',
}

export function useKeyboardShortcuts() {
  const { setActiveModule, toggleCommandPalette, toggleFocusMode } = useUIStore()

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea (except for specific shortcuts)
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

    // Allow Escape to blur from inputs
    if (isInput && e.key === 'Escape') {
      target.blur()
      return
    }

    // Ctrl+Shift+F - Focus Mode (works everywhere)
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault()
      toggleFocusMode()
      return
    }

    // Ctrl+Shift+N - Notification Center (works everywhere)
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault()
      useUIStore.getState().toggleNotificationCenter()
      return
    }

    // Ctrl+K - Command Palette (works everywhere)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      toggleCommandPalette()
      return
    }

    // Ctrl+/ - Toggle Chat (works everywhere)
    if (e.ctrlKey && e.key === '/') {
      e.preventDefault()
      useChatStore.getState().toggleOpen()
      return
    }

    // Alt+U - Global Search (works everywhere)
    if (e.altKey && e.key === 'u') {
      e.preventDefault()
      useUIStore.getState().toggleGlobalSearch()
      return
    }

    // Skip remaining shortcuts if in input
    if (isInput) return

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
  }, [setActiveModule, toggleCommandPalette, toggleFocusMode])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
