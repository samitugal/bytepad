import { useEffect, useCallback } from 'react'
import { useUIStore } from '../stores/uiStore'
import { useChatStore } from '../stores/chatStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useDailyNotesStore } from '../stores/dailyNotesStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useTabStore } from '../stores/tabStore'
import { useKeybindingsStore, matchesKeybinding } from '../stores/keybindingsStore'
import type { ModuleType } from '../types'

const MODULE_ACTION_MAP: Record<string, ModuleType> = {
  'navigate:notes': 'notes',
  'navigate:dailynotes': 'dailynotes',
  'navigate:habits': 'habits',
  'navigate:tasks': 'tasks',
  'navigate:journal': 'journal',
  'navigate:bookmarks': 'bookmarks',
  'navigate:calendar': 'calendar',
  'navigate:graph': 'graph',
  'navigate:analysis': 'analysis',
}

export function useKeyboardShortcuts() {
  const { setActiveModule, toggleCommandPalette, toggleFocusMode } = useUIStore()
  const { keybindings, customKeybindings } = useKeybindingsStore()

  const getEffectiveKeys = useCallback((id: string): string => {
    return customKeybindings[id] || keybindings.find((k) => k.id === id)?.keys || ''
  }, [keybindings, customKeybindings])

  const findMatchingKeybinding = useCallback((e: KeyboardEvent) => {
    for (const kb of keybindings) {
      const keys = customKeybindings[kb.id] || kb.keys
      if (matchesKeybinding(e, keys)) {
        return kb
      }
    }
    return null
  }, [keybindings, customKeybindings])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in input/textarea (except for specific shortcuts)
    const target = e.target as HTMLElement
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

    // Allow Escape to blur from inputs
    if (isInput && e.key === 'Escape') {
      target.blur()
      return
    }

    // Find matching keybinding
    const kb = findMatchingKeybinding(e)
    if (!kb) {
      // Handle Escape separately (not customizable)
      if (e.key === 'Escape') {
        useUIStore.getState().setCommandPaletteOpen(false)
      }
      return
    }

    // Some shortcuts work even in inputs
    const worksInInput = [
      'system:commandPalette',
      'system:chat',
      'focus:toggle',
      'system:notifications',
      'system:globalSearch',
      'action:new',
    ].includes(kb.action)

    if (isInput && !worksInInput) return

    e.preventDefault()

    // Execute the action
    switch (kb.action) {
      // Navigation actions
      case 'navigate:notes':
      case 'navigate:dailynotes':
      case 'navigate:habits':
      case 'navigate:tasks':
      case 'navigate:journal':
      case 'navigate:bookmarks':
      case 'navigate:calendar':
      case 'navigate:graph':
      case 'navigate:analysis':
        setActiveModule(MODULE_ACTION_MAP[kb.action])
        break

      // System actions
      case 'system:commandPalette':
        toggleCommandPalette()
        break

      case 'system:settings':
        useUIStore.getState().toggleSettings()
        break

      case 'system:shortcuts':
        useUIStore.getState().toggleShortcutsModal()
        break

      case 'system:chat':
        useChatStore.getState().toggleOpen()
        break

      case 'system:globalSearch':
        useUIStore.getState().toggleGlobalSearch()
        break

      case 'system:notifications':
        useUIStore.getState().toggleNotificationCenter()
        break

      // Focus actions
      case 'focus:toggle':
        toggleFocusMode()
        break

      // Item actions
      case 'action:new':
        handleNewItem()
        break

      case 'action:newTab':
        handleNewTab()
        break

      case 'action:closeTab':
        handleCloseTab()
        break

      case 'action:nextTab':
        handleSwitchTab(false)
        break

      case 'action:prevTab':
        handleSwitchTab(true)
        break
    }
  }, [setActiveModule, toggleCommandPalette, toggleFocusMode, findMatchingKeybinding])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

// Helper functions for actions
function handleNewItem() {
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
      useUIStore.getState().setActiveModule('notes')
      const newNoteId = useNoteStore.getState().addNote({
        title: '',
        content: '',
        tags: [],
      })
      useNoteStore.getState().setActiveNote(newNoteId)
    }
  }
}

function handleNewTab() {
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
}

function handleCloseTab() {
  const { activeTabId, closeTab } = useTabStore.getState()
  if (activeTabId) {
    closeTab(activeTabId)
  }
}

function handleSwitchTab(reverse: boolean) {
  const { tabs, activeTabId, setActiveTab } = useTabStore.getState()
  if (tabs.length > 1 && activeTabId) {
    const currentIndex = tabs.findIndex((t) => t.id === activeTabId)
    const nextIndex = reverse
      ? (currentIndex - 1 + tabs.length) % tabs.length
      : (currentIndex + 1) % tabs.length
    setActiveTab(tabs[nextIndex].id)

    // Also set active note if it's a note tab
    const nextTab = tabs[nextIndex]
    if (nextTab.type === 'note' && nextTab.entityId) {
      useNoteStore.getState().setActiveNote(nextTab.entityId)
    }
  }
}
