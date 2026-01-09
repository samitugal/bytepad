import { useState, useEffect, useRef, useMemo } from 'react'
import { useUIStore } from '../../stores/uiStore'

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

  const commands: Command[] = useMemo(() => [
    // Navigation
    { id: 'goto-notes', title: 'Go to Notes', shortcut: 'Ctrl+1', category: 'navigation', action: () => setActiveModule('notes') },
    { id: 'goto-habits', title: 'Go to Habits', shortcut: 'Ctrl+2', category: 'navigation', action: () => setActiveModule('habits') },
    { id: 'goto-tasks', title: 'Go to Tasks', shortcut: 'Ctrl+3', category: 'navigation', action: () => setActiveModule('tasks') },
    { id: 'goto-journal', title: 'Go to Journal', shortcut: 'Ctrl+4', category: 'navigation', action: () => setActiveModule('journal') },
    { id: 'goto-analysis', title: 'Go to Analysis', shortcut: 'Ctrl+5', category: 'navigation', action: () => setActiveModule('analysis') },
    // Actions
    { id: 'new-note', title: 'New Note', shortcut: 'Ctrl+N', category: 'action', action: () => { setActiveModule('notes'); /* TODO: open new note */ } },
    { id: 'new-task', title: 'New Task', category: 'action', action: () => { setActiveModule('tasks'); /* TODO: open new task */ } },
    { id: 'new-habit', title: 'New Habit', category: 'action', action: () => { setActiveModule('habits'); /* TODO: open new habit */ } },
    { id: 'new-journal', title: 'New Journal Entry', category: 'action', action: () => { setActiveModule('journal'); /* TODO: open new entry */ } },
    // Settings
    { id: 'toggle-focus', title: 'Toggle Focus Mode', shortcut: 'Ctrl+Shift+F', category: 'settings', action: () => useUIStore.getState().toggleFocusMode() },
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
        <div className="max-h-80 overflow-y-auto">
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
