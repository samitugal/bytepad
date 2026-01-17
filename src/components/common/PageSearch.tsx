import { useState, useEffect, useCallback, useRef } from 'react'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'

interface PageSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function PageSearch({ isOpen, onClose }: PageSearchProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const [totalMatches, setTotalMatches] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const highlightedElements = useRef<HTMLElement[]>([])

  // Clear highlights when closing or query changes
  const clearHighlights = useCallback(() => {
    highlightedElements.current.forEach((el) => {
      const parent = el.parentNode
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el)
        parent.normalize()
      }
    })
    highlightedElements.current = []
    setTotalMatches(0)
    setCurrentMatch(0)
  }, [])

  // Highlight matches in text content
  const highlightMatches = useCallback((searchQuery: string) => {
    clearHighlights()

    if (!searchQuery.trim()) return

    const mainContent = document.querySelector('main') || document.body
    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip script, style, and input elements
          const parent = node.parentElement
          if (!parent) return NodeFilter.FILTER_REJECT
          const tagName = parent.tagName.toLowerCase()
          if (['script', 'style', 'input', 'textarea', 'noscript'].includes(tagName)) {
            return NodeFilter.FILTER_REJECT
          }
          // Skip the search box itself
          if (parent.closest('.page-search-container')) {
            return NodeFilter.FILTER_REJECT
          }
          return NodeFilter.FILTER_ACCEPT
        }
      }
    )

    const nodesToHighlight: { node: Text; matches: RegExpMatchArray[] }[] = []
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')

    let textNode = walker.nextNode() as Text | null
    while (textNode) {
      const text = textNode.textContent || ''
      const matches = [...text.matchAll(regex)]
      if (matches.length > 0) {
        nodesToHighlight.push({ node: textNode, matches })
      }
      textNode = walker.nextNode() as Text | null
    }

    let matchCount = 0
    nodesToHighlight.forEach(({ node, matches }) => {
      const text = node.textContent || ''
      const parent = node.parentNode
      if (!parent) return

      const fragment = document.createDocumentFragment()
      let lastIndex = 0

      matches.forEach((match) => {
        const matchStart = match.index!
        const matchEnd = matchStart + match[0].length

        // Add text before match
        if (matchStart > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchStart)))
        }

        // Add highlighted match
        const highlight = document.createElement('mark')
        highlight.textContent = text.slice(matchStart, matchEnd)
        highlight.className = 'bg-np-yellow/40 text-np-text-primary px-0.5 rounded page-search-highlight'
        highlight.dataset.matchIndex = String(matchCount)
        highlightedElements.current.push(highlight)
        fragment.appendChild(highlight)
        matchCount++

        lastIndex = matchEnd
      })

      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
      }

      parent.replaceChild(fragment, node)
    })

    setTotalMatches(matchCount)
    if (matchCount > 0) {
      setCurrentMatch(1)
      scrollToMatch(0)
    }
  }, [clearHighlights])

  // Scroll to specific match
  const scrollToMatch = useCallback((index: number) => {
    // Remove active class from all
    highlightedElements.current.forEach((el) => {
      el.classList.remove('ring-2', 'ring-np-blue')
    })

    // Add active class to current and scroll
    const target = highlightedElements.current[index]
    if (target) {
      target.classList.add('ring-2', 'ring-np-blue')
      target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Navigate to next match
  const goToNextMatch = useCallback(() => {
    if (totalMatches === 0) return
    const nextIndex = currentMatch >= totalMatches ? 1 : currentMatch + 1
    setCurrentMatch(nextIndex)
    scrollToMatch(nextIndex - 1)
  }, [currentMatch, totalMatches, scrollToMatch])

  // Navigate to previous match
  const goToPrevMatch = useCallback(() => {
    if (totalMatches === 0) return
    const prevIndex = currentMatch <= 1 ? totalMatches : currentMatch - 1
    setCurrentMatch(prevIndex)
    scrollToMatch(prevIndex - 1)
  }, [currentMatch, totalMatches, scrollToMatch])

  // Handle search input change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      highlightMatches(query)
    }, 200)

    return () => clearTimeout(debounceTimer)
  }, [query, highlightMatches])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      inputRef.current?.select()
    } else {
      clearHighlights()
      setQuery('')
    }
  }, [isOpen, clearHighlights])

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
    <div className="page-search-container fixed top-14 right-4 z-50 bg-np-bg-secondary border border-np-border shadow-lg">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="text-np-green text-sm">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('pageSearch.placeholder', 'Search in page...')}
          className="w-48 bg-transparent text-np-text-primary placeholder-np-text-secondary focus:outline-none font-mono text-sm"
          autoFocus
        />

        {/* Match counter */}
        {query && (
          <span className="text-xs text-np-text-secondary whitespace-nowrap">
            {totalMatches > 0 ? `${currentMatch}/${totalMatches}` : t('pageSearch.noResults', 'No results')}
          </span>
        )}

        {/* Navigation buttons */}
        <button
          onClick={goToPrevMatch}
          disabled={totalMatches === 0}
          className="p-1 text-np-text-secondary hover:text-np-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('pageSearch.prev', 'Previous (Shift+Enter)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={goToNextMatch}
          disabled={totalMatches === 0}
          className="p-1 text-np-text-secondary hover:text-np-text-primary disabled:opacity-30 disabled:cursor-not-allowed"
          title={t('pageSearch.next', 'Next (Enter)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-np-text-secondary hover:text-np-text-primary"
          title={t('pageSearch.close', 'Close (Esc)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Keyboard hints */}
      <div className="px-3 py-1.5 border-t border-np-border text-[10px] text-np-text-secondary flex items-center gap-3">
        <span><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> {t('pageSearch.nextHint', 'next')}</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Shift+Enter</kbd> {t('pageSearch.prevHint', 'prev')}</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Esc</kbd> {t('pageSearch.closeHint', 'close')}</span>
      </div>
    </div>
  )
}
