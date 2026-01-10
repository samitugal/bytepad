import { useState, useEffect, useMemo } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useJournalStore } from '../../stores/journalStore'
import { useUIStore } from '../../stores/uiStore'

interface SearchResult {
  id: string
  type: 'note' | 'task' | 'habit' | 'journal'
  title: string
  preview: string
  tags?: string[]
  meta?: string
}

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const notes = useNoteStore((s) => s.notes)
  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const journalEntries = useJournalStore((s) => s.entries)
  const setActiveModule = useUIStore((s) => s.setActiveModule)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)

  // Search across all modules
  const results = useMemo(() => {
    if (!query.trim()) return []
    
    const q = query.toLowerCase()
    const searchResults: SearchResult[] = []

    // Search Notes
    notes.forEach((note) => {
      const titleMatch = note.title.toLowerCase().includes(q)
      const contentMatch = note.content.toLowerCase().includes(q)
      const tagMatch = note.tags?.some(t => t.toLowerCase().includes(q))
      
      if (titleMatch || contentMatch || tagMatch) {
        searchResults.push({
          id: note.id,
          type: 'note',
          title: note.title,
          preview: note.content.substring(0, 100) + (note.content.length > 100 ? '...' : ''),
          tags: note.tags,
          meta: new Date(note.updatedAt).toLocaleDateString(),
        })
      }
    })

    // Search Tasks
    tasks.forEach((task) => {
      const titleMatch = task.title.toLowerCase().includes(q)
      const descMatch = task.description?.toLowerCase().includes(q)
      
      if (titleMatch || descMatch) {
        searchResults.push({
          id: task.id,
          type: 'task',
          title: task.title,
          preview: task.description || '',
          meta: `[${task.priority}] ${task.completed ? '✓ Done' : 'Pending'}`,
        })
      }
    })

    // Search Habits
    habits.forEach((habit) => {
      if (habit.name.toLowerCase().includes(q) || habit.category.toLowerCase().includes(q)) {
        searchResults.push({
          id: habit.id,
          type: 'habit',
          title: habit.name,
          preview: `Category: ${habit.category}`,
          meta: `🔥 ${habit.streak} day streak`,
        })
      }
    })

    // Search Journal
    journalEntries.forEach((entry) => {
      const contentMatch = entry.content.toLowerCase().includes(q)
      const tagMatch = entry.tags?.some(t => t.toLowerCase().includes(q))
      
      if (contentMatch || tagMatch) {
        searchResults.push({
          id: entry.id,
          type: 'journal',
          title: `Journal - ${entry.date}`,
          preview: entry.content.substring(0, 100) + (entry.content.length > 100 ? '...' : ''),
          tags: entry.tags,
          meta: `Mood: ${entry.mood}/5 | Energy: ${entry.energy}/5`,
        })
      }
    })

    return searchResults
  }, [query, notes, tasks, habits, journalEntries])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Reset query when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
      case 'note':
        setActiveModule('notes')
        setActiveNote(result.id)
        break
      case 'task':
        setActiveModule('tasks')
        break
      case 'habit':
        setActiveModule('habits')
        break
      case 'journal':
        setActiveModule('journal')
        break
    }
    onClose()
  }

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'note': return '📝'
      case 'task': return '✓'
      case 'habit': return '🎯'
      case 'journal': return '📔'
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'note': return 'text-np-green'
      case 'task': return 'text-np-blue'
      case 'habit': return 'text-np-orange'
      case 'journal': return 'text-np-purple'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      
      {/* Search Panel */}
      <div className="relative w-full max-w-2xl bg-np-bg-secondary border border-np-border shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-np-border">
          <span className="text-np-green">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tasks, habits, journal..."
            className="flex-1 bg-transparent text-np-text-primary placeholder-np-text-secondary focus:outline-none font-mono"
            autoFocus
          />
          <kbd className="text-xs bg-np-bg-tertiary px-2 py-0.5 text-np-text-secondary">
            Alt+U
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {query && results.length === 0 && (
            <div className="px-4 py-8 text-center text-np-text-secondary">
              <div className="text-np-green mb-2">// No results found</div>
              <div className="text-sm">Try a different search term</div>
            </div>
          )}

          {results.map((result, index) => (
            <div
              key={`${result.type}-${result.id}`}
              className={`px-4 py-3 cursor-pointer border-b border-np-border/50 transition-colors
                ${index === selectedIndex ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'}`}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center gap-3">
                <span className={`text-sm ${getTypeColor(result.type)}`}>
                  {getTypeIcon(result.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-np-text-primary truncate">{result.title}</span>
                    <span className={`text-xs px-1.5 py-0.5 ${getTypeColor(result.type)} bg-np-bg-tertiary`}>
                      {result.type}
                    </span>
                  </div>
                  {result.preview && (
                    <div className="text-xs text-np-text-secondary truncate mt-0.5">
                      {result.preview}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {result.tags?.map((tag) => (
                      <span key={tag} className="text-xs text-np-purple">#{tag}</span>
                    ))}
                    {result.meta && (
                      <span className="text-xs text-np-text-secondary">{result.meta}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-np-border text-xs text-np-text-secondary flex items-center gap-4">
          <span><kbd className="bg-np-bg-tertiary px-1">↑↓</kbd> navigate</span>
          <span><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> select</span>
          <span><kbd className="bg-np-bg-tertiary px-1">Esc</kbd> close</span>
          {results.length > 0 && (
            <span className="ml-auto">{results.length} result{results.length !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  )
}
