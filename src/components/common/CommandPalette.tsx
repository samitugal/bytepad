import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useChatStore } from '../../stores/chatStore'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useDailyNotesStore } from '../../stores/dailyNotesStore'
import { useJournalStore } from '../../stores/journalStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useHabitStore } from '../../stores/habitStore'

interface Command {
  id: string
  title: string
  shortcut?: string
  category: 'navigation' | 'action' | 'settings'
  action: () => void
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveModule } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const commands: Command[] = useMemo(() => [
    // Navigation (matches Sidebar order)
    { id: 'goto-notes', title: 'Go to Notes', shortcut: 'Ctrl+1', category: 'navigation', action: () => setActiveModule('notes') },
    { id: 'goto-dailynotes', title: 'Go to Daily Notes', shortcut: 'Ctrl+2', category: 'navigation', action: () => setActiveModule('dailynotes') },
    { id: 'goto-ideas', title: 'Go to Ideas', shortcut: 'Ctrl+3', category: 'navigation', action: () => setActiveModule('ideas') },
    { id: 'goto-habits', title: 'Go to Habits', shortcut: 'Ctrl+4', category: 'navigation', action: () => setActiveModule('habits') },
    { id: 'goto-tasks', title: 'Go to Tasks', shortcut: 'Ctrl+5', category: 'navigation', action: () => setActiveModule('tasks') },
    { id: 'goto-journal', title: 'Go to Journal', shortcut: 'Ctrl+6', category: 'navigation', action: () => setActiveModule('journal') },
    { id: 'goto-bookmarks', title: 'Go to Bookmarks', shortcut: 'Ctrl+7', category: 'navigation', action: () => setActiveModule('bookmarks') },
    { id: 'goto-calendar', title: 'Go to Calendar', shortcut: 'Ctrl+8', category: 'navigation', action: () => setActiveModule('calendar') },
    { id: 'goto-graph', title: 'Go to Knowledge Graph', shortcut: 'Ctrl+9', category: 'navigation', action: () => setActiveModule('graph') },
    { id: 'goto-analysis', title: 'Go to Analysis', shortcut: 'Ctrl+0', category: 'navigation', action: () => setActiveModule('analysis') },
    // Actions
    { id: 'new-note', title: 'New Note', shortcut: 'Ctrl+N', category: 'action', action: () => {
      setActiveModule('notes')
      const noteId = useNoteStore.getState().addNote({ title: '', content: '', tags: [] })
      useNoteStore.getState().setActiveNote(noteId)
    }},
    { id: 'new-dailynote', title: 'New Daily Note Card', category: 'action', action: () => {
      setActiveModule('dailynotes')
      const today = new Date().toISOString().split('T')[0]
      useDailyNotesStore.getState().addCard(today, { title: 'New Card', content: '', tags: [], pinned: false })
    }},
    { id: 'new-task', title: 'New Task', category: 'action', action: () => {
      setActiveModule('tasks')
      useTaskStore.getState().addTask({ title: 'New Task', description: '', priority: 'P3' })
    }},
    { id: 'new-habit', title: 'New Habit', category: 'action', action: () => {
      setActiveModule('habits')
      useHabitStore.getState().addHabit({ name: 'New Habit', frequency: 'daily', category: 'personal' })
    }},
    { id: 'new-journal', title: 'New Journal Entry', category: 'action', action: () => {
      setActiveModule('journal')
      const today = new Date().toISOString().split('T')[0]
      useJournalStore.getState().addEntry({ date: today, content: '', mood: 3, energy: 3, tags: [] })
    }},
    { id: 'new-bookmark', title: 'New Bookmark', category: 'action', action: () => {
      setActiveModule('bookmarks')
      useBookmarkStore.getState().addBookmark({ title: 'New Bookmark', url: 'https://', description: '', tags: [], favicon: '' })
    }},
    // Settings
    { id: 'toggle-focus', title: 'Toggle Focus Mode', shortcut: 'Ctrl+Shift+O', category: 'settings', action: () => useUIStore.getState().toggleFocusMode() },
    { id: 'open-settings', title: 'Open Settings', category: 'settings', action: () => useUIStore.getState().setSettingsOpen(true) },
    { id: 'open-flowbot', title: 'Open FlowBot', shortcut: 'Ctrl+/', category: 'settings', action: () => useChatStore.getState().setOpen(true) },
    { id: 'global-search', title: 'Global Search', shortcut: 'Alt+U', category: 'settings', action: () => useUIStore.getState().setGlobalSearchOpen(true) },
    { id: 'shortcuts-help', title: 'Keyboard Shortcuts Help', shortcut: 'Ctrl+?', category: 'settings', action: () => useUIStore.getState().setShortcutsModalOpen(true) },
  ], [setActiveModule])

  const filteredCommands = useMemo(() => {
    if (!query) return commands
    const lowerQuery = query.toLowerCase()
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.category.toLowerCase().includes(lowerQuery)
    )
  }, [query, commands])

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [commandPaletteOpen])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = itemRefs.current.get(selectedIndex)
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  const setItemRef = useCallback((index: number, el: HTMLDivElement | null) => {
    if (el) {
      itemRefs.current.set(index, el)
    } else {
      itemRefs.current.delete(index)
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
          setCommandPaletteOpen(false)
        }
        break
      case 'Escape':
        e.preventDefault()
        setCommandPaletteOpen(false)
        break
    }
  }

  const executeCommand = (cmd: Command) => {
    cmd.action()
    setCommandPaletteOpen(false)
  }

  if (!commandPaletteOpen) return null

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    action: 'Actions',
    settings: 'Settings',
  }

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = []
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, Command[]>)

  let globalIndex = -1

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-start justify-center pt-24 z-50"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-[500px] bg-np-bg-secondary border border-np-border shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="border-b border-np-border p-2">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command..."
            className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                       px-3 py-2 text-sm font-mono focus:border-np-blue focus:outline-none"
          />
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto">
          {filteredCommands.length === 0 ? (
            <div className="p-4 text-np-text-secondary text-sm text-center">
              No commands found
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div className="px-3 py-1.5 text-xs text-np-text-secondary bg-np-bg-tertiary">
                  {categoryLabels[category] || category}
                </div>
                {cmds.map(cmd => {
                  globalIndex++
                  const isSelected = globalIndex === selectedIndex
                  const currentIndex = globalIndex
                  return (
                    <div
                      key={cmd.id}
                      ref={(el) => setItemRef(currentIndex, el)}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`px-3 py-2 flex items-center justify-between cursor-pointer text-sm
                        ${isSelected ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:bg-np-bg-tertiary'}`}
                    >
                      <span>{cmd.title}</span>
                      {cmd.shortcut && (
                        <span className="text-xs text-np-text-secondary bg-np-bg-tertiary px-1.5 py-0.5 border border-np-border">
                          {cmd.shortcut}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-np-border px-3 py-2 text-xs text-np-text-secondary flex gap-4">
          <span><kbd className="bg-np-bg-tertiary px-1">↑↓</kbd> navigate</span>
          <span><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> select</span>
          <span><kbd className="bg-np-bg-tertiary px-1">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  )
}
