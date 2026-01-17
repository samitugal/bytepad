import { useState, useEffect, useCallback, useRef } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useIdeaStore } from '../../stores/ideaStore'

export interface WikilinkSuggestion {
  id: string
  title: string
  type: 'note' | 'task' | 'habit' | 'bookmark' | 'idea'
  icon: string
}

interface WikilinkAutocompleteProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  content: string
  onInsert: (suggestion: WikilinkSuggestion, startPos: number, endPos: number) => void
}

const TYPE_ICONS: Record<WikilinkSuggestion['type'], string> = {
  note: 'N',
  task: 'T',
  habit: 'H',
  bookmark: 'B',
  idea: 'I',
}

const TYPE_COLORS: Record<WikilinkSuggestion['type'], string> = {
  note: 'text-np-blue',
  task: 'text-np-orange',
  habit: 'text-np-green',
  bookmark: 'text-np-cyan',
  idea: 'text-yellow-400',
}

// Type filter prefixes (case-insensitive) - both singular and plural
const TYPE_PREFIXES = ['notes:', 'note:', 'tasks:', 'task:', 'habits:', 'habit:', 'bookmarks:', 'bookmark:', 'ideas:', 'idea:'] as const

export function WikilinkAutocomplete({ textareaRef, content, onInsert }: WikilinkAutocompleteProps) {
  const { notes } = useNoteStore()
  const { tasks } = useTaskStore()
  const { habits } = useHabitStore()
  const { bookmarks } = useBookmarkStore()
  const { ideas } = useIdeaStore()

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [triggerStart, setTriggerStart] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Build suggestions list
  const allSuggestions: WikilinkSuggestion[] = [
    ...notes.map(n => ({ id: n.id, title: n.title || 'Untitled', type: 'note' as const, icon: TYPE_ICONS.note })),
    ...tasks.filter(t => !t.completed && !t.archivedAt).map(t => ({ id: t.id, title: t.title, type: 'task' as const, icon: TYPE_ICONS.task })),
    ...habits.map(h => ({ id: h.id, title: h.name, type: 'habit' as const, icon: TYPE_ICONS.habit })),
    ...bookmarks.slice(0, 20).map(b => ({ id: b.id, title: b.title, type: 'bookmark' as const, icon: TYPE_ICONS.bookmark })),
    ...ideas.filter(i => i.status === 'active').map(i => ({ id: i.id, title: i.title || i.content.slice(0, 50), type: 'idea' as const, icon: TYPE_ICONS.idea })),
  ]

  // Filter suggestions based on query (with type prefix support)
  const filteredSuggestions = (() => {
    if (!query) return allSuggestions.slice(0, 10)
    
    const lowerQuery = query.toLowerCase()
    
    // Check for type prefix filter (case-insensitive)
    let typeFilter: string | null = null
    let searchQuery = lowerQuery
    
    for (const prefix of TYPE_PREFIXES) {
      if (lowerQuery.startsWith(prefix)) {
        typeFilter = prefix.slice(0, -1) // 'notes:' -> 'notes'
        searchQuery = lowerQuery.slice(prefix.length).trim()
        break
      }
    }
    
    // Map prefix to type (both singular and plural)
    const typeMap: Record<string, WikilinkSuggestion['type']> = {
      notes: 'note',
      note: 'note',
      tasks: 'task',
      task: 'task',
      habits: 'habit',
      habit: 'habit',
      bookmarks: 'bookmark',
      bookmark: 'bookmark',
      ideas: 'idea',
      idea: 'idea',
    }
    
    return allSuggestions.filter(s => {
      // If type filter is active, only show that type
      if (typeFilter && s.type !== typeMap[typeFilter]) return false
      // If no search query after prefix, show all of that type
      if (!searchQuery) return true
      // Otherwise filter by title
      return s.title.toLowerCase().includes(searchQuery)
    }).slice(0, 10)
  })()

  // Detect [[ trigger
  const checkForTrigger = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBeforeCursor = content.slice(0, cursorPos)

    // Find the last [[ that's not closed
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[')
    const lastCloseBracket = textBeforeCursor.lastIndexOf(']]')

    if (lastOpenBracket > lastCloseBracket && lastOpenBracket >= 0) {
      // We're inside a [[ ]] block
      const queryText = textBeforeCursor.slice(lastOpenBracket + 2)

      // Don't show if there's a newline in the query
      if (queryText.includes('\n')) {
        setIsOpen(false)
        return
      }

      setQuery(queryText)
      setTriggerStart(lastOpenBracket)
      setSelectedIndex(0)

      // Calculate position relative to viewport
      const textareaRect = textarea.getBoundingClientRect()
      const lineHeight = 24
      const charWidth = 8.4 // approximate for monospace

      // Count lines and position
      const linesBeforeCursor = textBeforeCursor.split('\n')
      const currentLineIndex = linesBeforeCursor.length - 1
      const currentLineText = linesBeforeCursor[currentLineIndex]

      // Calculate position within textarea (relative to textarea's top-left)
      const relativeTop = (currentLineIndex + 1) * lineHeight + 12 - textarea.scrollTop
      const relativeLeft = (currentLineText.length) * charWidth + 56 // 56px for line numbers

      // Convert to viewport coordinates
      const viewportTop = textareaRect.top + relativeTop
      const viewportLeft = textareaRect.left + relativeLeft

      // Dropdown dimensions
      const dropdownHeight = 220 // max-h-48 + footer
      const dropdownWidth = 250

      // Adjust if dropdown would go outside viewport
      let finalTop = relativeTop
      let finalLeft = relativeLeft

      // Check bottom overflow - if dropdown would go below viewport, show it above cursor
      if (viewportTop + dropdownHeight > window.innerHeight) {
        finalTop = relativeTop - dropdownHeight - lineHeight
      }

      // Check right overflow - if dropdown would go outside right edge, align to right of textarea
      if (viewportLeft + dropdownWidth > window.innerWidth) {
        finalLeft = Math.max(0, textareaRect.width - dropdownWidth - 20)
      }

      // Ensure we don't go negative
      finalTop = Math.max(0, finalTop)
      finalLeft = Math.max(0, finalLeft)

      setPosition({ top: finalTop, left: finalLeft })
      setIsOpen(true)
    } else {
      setIsOpen(false)
    }
  }, [content, textareaRef])

  // Check for trigger on content change or cursor move
  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const handleInput = () => checkForTrigger()
    const handleClick = () => checkForTrigger()
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
        checkForTrigger()
      }
    }

    textarea.addEventListener('input', handleInput)
    textarea.addEventListener('click', handleClick)
    textarea.addEventListener('keyup', handleKeyUp)

    return () => {
      textarea.removeEventListener('input', handleInput)
      textarea.removeEventListener('click', handleClick)
      textarea.removeEventListener('keyup', handleKeyUp)
    }
  }, [checkForTrigger, textareaRef])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, filteredSuggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === 'Enter' && filteredSuggestions.length > 0) {
        e.preventDefault()
        handleSelect(filteredSuggestions[selectedIndex])
      } else if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
      } else if (e.key === 'Tab' && filteredSuggestions.length > 0) {
        e.preventDefault()
        handleSelect(filteredSuggestions[selectedIndex])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredSuggestions])

  // Scroll selected item into view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedEl = dropdownRef.current.children[selectedIndex] as HTMLElement
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [selectedIndex, isOpen])

  const handleSelect = (suggestion: WikilinkSuggestion) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    onInsert(suggestion, triggerStart, cursorPos)
    setIsOpen(false)
  }

  if (!isOpen || filteredSuggestions.length === 0) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 bg-np-bg-secondary border border-np-border shadow-lg max-h-48 overflow-y-auto"
      style={{ top: position.top, left: position.left, minWidth: '220px' }}
    >
      {filteredSuggestions.map((suggestion, index) => (
        <div
          key={`${suggestion.type}-${suggestion.id}`}
          className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
            index === selectedIndex
              ? 'bg-np-purple/30 text-np-text-primary'
              : 'text-np-text-secondary hover:bg-np-bg-hover'
          }`}
          onClick={() => handleSelect(suggestion)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className={`text-xs font-bold w-5 ${TYPE_COLORS[suggestion.type]}`}>
            [{suggestion.icon}]
          </span>
          <span className="flex-1 truncate text-sm">{suggestion.title}</span>
        </div>
      ))}
      <div className="px-3 py-1 text-xs text-np-text-secondary border-t border-np-border bg-np-bg-tertiary">
        ↑↓ navigate • Enter select • Esc close
      </div>
    </div>
  )
}
