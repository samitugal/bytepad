import { useState, useMemo, useRef, ChangeEvent, KeyboardEvent } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useTaskStore } from '../../stores/taskStore'

interface EntityLinkInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function EntityLinkInput({ value, onChange, placeholder, className }: EntityLinkInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const notes = useNoteStore((state) => state.notes)
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const tasks = useTaskStore((state) => state.tasks)

  // Get filtered suggestions based on query
  const suggestions = useMemo(() => {
    if (!suggestionQuery) return []
    const query = suggestionQuery.toLowerCase()
    const results: Array<{ type: 'note' | 'bookmark' | 'task'; id: string; title: string }> = []

    // Search notes
    notes.forEach(note => {
      if (note.title.toLowerCase().includes(query)) {
        results.push({ type: 'note', id: note.id, title: note.title })
      }
    })

    // Search bookmarks
    bookmarks.forEach(bookmark => {
      if (bookmark.title.toLowerCase().includes(query)) {
        results.push({ type: 'bookmark', id: bookmark.id, title: bookmark.title })
      }
    })

    // Search tasks
    tasks.forEach(task => {
      if (task.title.toLowerCase().includes(query)) {
        results.push({ type: 'task', id: task.id, title: task.title })
      }
    })

    return results.slice(0, 8) // Limit to 8 suggestions
  }, [suggestionQuery, notes, bookmarks, tasks])

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const pos = e.target.selectionStart || 0
    setCursorPosition(pos)
    onChange(newValue)

    // Check if we're inside [[ ]]
    const textBeforeCursor = newValue.slice(0, pos)
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[')
    const lastCloseBracket = textBeforeCursor.lastIndexOf(']]')

    if (lastOpenBracket > lastCloseBracket) {
      // We're inside [[ ]], show suggestions
      const query = textBeforeCursor.slice(lastOpenBracket + 2)
      setSuggestionQuery(query)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
      setSuggestionQuery('')
    }
  }

  const handleSelectSuggestion = (suggestion: { type: string; id: string; title: string }) => {
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastOpenBracket = textBeforeCursor.lastIndexOf('[[')

    // Check if there's already ]] after cursor
    const hasClosingBrackets = textAfterCursor.startsWith(']]')

    // Replace the partial link with just the title (user already typed [[ and will have ]])
    const newValue = textBeforeCursor.slice(0, lastOpenBracket + 2) +
      suggestion.title +
      (hasClosingBrackets ? textAfterCursor : ']]' + textAfterCursor)

    onChange(newValue)
    setShowSuggestions(false)
    setSuggestionQuery('')

    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        e.preventDefault()
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        // Select first suggestion
        handleSelectSuggestion(suggestions[0])
        e.preventDefault()
      }
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={className}
      />

      {/* Autocomplete dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.id}`}
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`w-full text-left px-3 py-2 hover:bg-np-bg-hover flex items-center gap-2 ${
                index === 0 ? 'bg-np-selection' : ''
              }`}
            >
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                suggestion.type === 'note' ? 'bg-np-green/20 text-np-green' :
                suggestion.type === 'bookmark' ? 'bg-np-cyan/20 text-np-cyan' :
                'bg-np-orange/20 text-np-orange'
              }`}>
                {suggestion.type === 'note' ? '📝' : suggestion.type === 'bookmark' ? '🔗' : '✓'}
              </span>
              <span className="text-np-text-primary truncate">{suggestion.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Hint when typing [[ */}
      {showSuggestions && suggestions.length === 0 && suggestionQuery && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 px-3 py-2 text-sm text-np-text-secondary">
          No matches for "{suggestionQuery}"
        </div>
      )}
    </div>
  )
}
