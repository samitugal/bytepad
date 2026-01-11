import { useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useDailyNotesStore } from '../stores/dailyNotesStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useTabStore } from '../stores/tabStore'
import type { ModuleType } from '../types'

const MODULE_MAP: Record<string, ModuleType> = {
  '1': 'notes',
  '2': 'dailynotes',
  '3': 'habits',
  '4': 'tasks',
  '5': 'journal',
  '6': 'bookmarks',
  '7': 'calendar',
  '8': 'graph',
  '9': 'analysis',
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

    // Ctrl+? or Ctrl+Shift+/ - Shortcuts Help (works everywhere)
    if (e.ctrlKey && (e.key === '?' || (e.shiftKey && e.key === '/'))) {
      e.preventDefault()
      useUIStore.getState().toggleShortcutsModal()
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

    // Ctrl+T - New tab (in notes module)
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault()
      e.stopPropagation()
      
      const { activeModule } = useUIStore.getState()
      if (activeModule === 'notes') {
        const noteId = useNoteStore.getState().addNote({
          title: '',
          content: '',
          tags: [],
        })
        useNoteStore.getState().setActiveNote(noteId)
        useTabStore.getState().addTab('note', noteId, 'Untitled')
      }
      return
    }

    // Ctrl+W - Close current tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault()
      e.stopPropagation()
      
      const { activeTabId, closeTab } = useTabStore.getState()
      if (activeTabId) {
        closeTab(activeTabId)
      }
      return
    }

    // Ctrl+Tab - Next tab
    if (e.ctrlKey && e.key === 'Tab') {
      e.preventDefault()
      const { tabs, activeTabId, setActiveTab } = useTabStore.getState()
      if (tabs.length > 1 && activeTabId) {
        const currentIndex = tabs.findIndex(t => t.id === activeTabId)
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + tabs.length) % tabs.length 
          : (currentIndex + 1) % tabs.length
        setActiveTab(tabs[nextIndex].id)
        
        // Also set active note if it's a note tab
        const nextTab = tabs[nextIndex]
        if (nextTab.type === 'note' && nextTab.entityId) {
          useNoteStore.getState().setActiveNote(nextTab.entityId)
        }
      }
      return
    }

    // Ctrl+N - New item (context-aware, works everywhere)
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault()
      e.stopPropagation()
      
      const { activeModule } = useUIStore.getState()
      
      switch (activeModule) {
        case 'notes': {
          const noteId = useNoteStore.getState().addNote({
            title: '',
            content: '',
            tags: [],
          })
          useNoteStore.getState().setActiveNote(noteId)
          break
        }
        case 'tasks': {
          useTaskStore.getState().addTask({
            title: 'New Task',
            description: '',
            priority: 'P3',
          })
          break
        }
        case 'dailynotes': {
          const today = new Date().toISOString().split('T')[0]
          useDailyNotesStore.getState().addCard(today, {
            title: 'New Note',
            content: '',
            tags: [],
            pinned: false,
          })
          break
        }
        case 'journal': {
          const todayDate = new Date().toISOString().split('T')[0]
          useJournalStore.getState().addEntry({
            date: todayDate,
            content: '',
            mood: 3,
            energy: 3,
            tags: [],
          })
          break
        }
        case 'bookmarks': {
          useBookmarkStore.getState().addBookmark({
            title: 'New Bookmark',
            url: 'https://',
            description: '',
            tags: [],
            favicon: '',
          })
          break
        }
        default: {
          // For other modules, switch to notes and create new note
          setActiveModule('notes')
          const newNoteId = useNoteStore.getState().addNote({
            title: '',
            content: '',
            tags: [],
          })
          useNoteStore.getState().setActiveNote(newNoteId)
        }
      }
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
