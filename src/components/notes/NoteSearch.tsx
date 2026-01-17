import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from '../../i18n'

interface NoteSearchProps {
  isOpen: boolean
  onClose: () => void
  content: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
}

export function NoteSearch({ isOpen, onClose, content, textareaRef }: NoteSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const [matches, setMatches] = useState<number[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Find all matches in content
  const findMatches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setMatches([])
      setCurrentMatch(0)
      return
    }

    const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const foundMatches: number[] = []
    let match

    while ((match = regex.exec(content)) !== null) {
      foundMatches.push(match.index)
    }

    setMatches(foundMatches)
    if (foundMatches.length > 0) {
      setCurrentMatch(1)
      scrollToMatch(foundMatches[0], searchQuery.length)
    } else {
      setCurrentMatch(0)
    }
  }, [content])

  // Scroll textarea to match position and select the text
  const scrollToMatch = useCallback((position: number, length: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Select the matched text
    textarea.focus()
    textarea.setSelectionRange(position, position + length)

    // Calculate scroll position
    const lineHeight = 24 // matches the textarea line-height
    const textBeforeMatch = content.slice(0, position)
    const lineNumber = textBeforeMatch.split('\n').length - 1
    const scrollTop = lineNumber * lineHeight - textarea.clientHeight / 2 + lineHeight

    textarea.scrollTop = Math.max(0, scrollTop)
  }, [content, textareaRef])

  // Navigate to next match
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return
    const nextIndex = currentMatch >= matches.length ? 1 : currentMatch + 1
    setCurrentMatch(nextIndex)
    scrollToMatch(matches[nextIndex - 1], query.length)
  }, [currentMatch, matches, query.length, scrollToMatch])

  // Navigate to previous match
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return
    const prevIndex = currentMatch <= 1 ? matches.length : currentMatch - 1
    setCurrentMatch(prevIndex)
    scrollToMatch(matches[prevIndex - 1], query.length)
  }, [currentMatch, matches, query.length, scrollToMatch])

  // Handle search input change with debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      findMatches(query)
    }, 150)

    return () => clearTimeout(debounceTimer)
  }, [query, findMatches])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      inputRef.current?.select()
    } else {
      setQuery('')
      setMatches([])
      setCurrentMatch(0)
    }
  }, [isOpen])

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) {
        goToPrevMatch()
      } else {
        goToNextMatch()
      }
    } else if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'F3') {
      e.preventDefault()
      if (e.shiftKey) {
        goToPrevMatch()
      } else {
        goToNextMatch()
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-0 right-0 z-50 bg-np-bg-secondary border border-np-border shadow-lg m-2">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-np-green text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('noteSearch.placeholder', 'Search in note...')}
          className="w-48 bg-transparent text-np-text-primary placeholder-np-text-secondary focus:outline-none font-mono text-sm"
          autoFocus
        />

        {/* Match counter */}
        {query && (
          <span className="text-xs text-np-text-secondary whitespace-nowrap">
            {matches.length > 0 ? `${currentMatch}/${matches.length}` : t('noteSearch.noResults', 'No results')}
          </span>
        )}

        {/* Navigation buttons */}
        <button
          onClick={goToPrevMatch}
          disabled={matches.length === 0}
          className="p-1 text-np-text-secondary hover:text-np-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('noteSearch.prev', 'Previous (Shift+Enter)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={goToNextMatch}
          disabled={matches.length === 0}
          className="p-1 text-np-text-secondary hover:text-np-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('noteSearch.next', 'Next (Enter)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-np-text-secondary hover:text-np-text-primary"
          title={t('noteSearch.close', 'Close (Esc)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="px-3 py-1.5 border-t border-np-border text-[10px] text-np-text-secondary flex items-center gap-3">
        <span><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> {t('noteSearch.nextHint', 'next')}</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Shift+Enter</kbd> {t('noteSearch.prevHint', 'prev')}</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Esc</kbd> {t('noteSearch.closeHint', 'close')}</span>
      </div>
    </div>
  )
}
