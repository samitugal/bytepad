import { useState, useRef, useCallback } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useBookmarkStore } from '../../stores/bookmarkStore'

export type EntityType = 'note' | 'task' | 'habit' | 'bookmark'

export interface WikilinkSuggestion {
    id: string
    title: string
    type: EntityType
}

interface WikilinkTextareaProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    rows?: number
}

const TYPE_CONFIG: Record<EntityType, { icon: string; color: string; label: string }> = {
    note: { icon: '📝', color: 'text-np-cyan', label: 'N' },
    task: { icon: '✅', color: 'text-np-orange', label: 'T' },
    habit: { icon: '🔄', color: 'text-np-green', label: 'H' },
    bookmark: { icon: '🔗', color: 'text-np-purple', label: 'B' },
}

export function WikilinkTextarea({
    value,
    onChange,
    placeholder,
    className,
    rows = 3
}: WikilinkTextareaProps) {
    const notes = useNoteStore((s) => s.notes)
    const tasks = useTaskStore((s) => s.tasks)
    const habits = useHabitStore((s) => s.habits)
    const bookmarks = useBookmarkStore((s) => s.bookmarks)

    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestions, setSuggestions] = useState<WikilinkSuggestion[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [cursorPosition, setCursorPosition] = useState(0)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Build all suggestions
    const getAllSuggestions = useCallback((query: string): WikilinkSuggestion[] => {
        const q = query.toLowerCase()
        const results: WikilinkSuggestion[] = []

        // Search notes
        notes
            .filter(n => n.title && n.title.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(n => results.push({ id: n.id, title: n.title, type: 'note' }))

        // Search tasks (non-completed)
        tasks
            .filter(t => !t.completed && t.title && t.title.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(t => results.push({ id: t.id, title: t.title, type: 'task' }))

        // Search habits
        habits
            .filter(h => h.name && h.name.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(h => results.push({ id: h.id, title: h.name, type: 'habit' }))

        // Search bookmarks
        bookmarks
            .filter(b => b.title && b.title.toLowerCase().includes(q))
            .slice(0, 3)
            .forEach(b => results.push({ id: b.id, title: b.title, type: 'bookmark' }))

        return results.slice(0, 10)
    }, [notes, tasks, habits, bookmarks])

    // Check if we're in a wikilink context [[
    const checkForWikilink = (text: string, pos: number): string | null => {
        const beforeCursor = text.slice(0, pos)
        const match = beforeCursor.match(/\[\[([^\]]*?)$/)
        return match ? match[1] : null
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value
        const pos = e.target.selectionStart || 0
        setCursorPosition(pos)
        onChange(newValue)

        const searchTerm = checkForWikilink(newValue, pos)
        if (searchTerm !== null) {
            const results = getAllSuggestions(searchTerm)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
            setSelectedIndex(0)
        } else {
            setShowSuggestions(false)
        }
    }

    const insertSuggestion = (suggestion: WikilinkSuggestion) => {
        const beforeCursor = value.slice(0, cursorPosition)
        const afterCursor = value.slice(cursorPosition)
        const match = beforeCursor.match(/\[\[([^\]]*?)$/)

        if (match) {
            // Check if there's already ]] after cursor
            const hasClosingBrackets = afterCursor.startsWith(']]')
            const newBefore = beforeCursor.slice(0, match.index) + `[[${suggestion.title}`
            const newAfter = hasClosingBrackets ? afterCursor : ']]' + afterCursor
            onChange(newBefore + newAfter)
            setShowSuggestions(false)

            // Focus back on textarea
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus()
                    const newPos = newBefore.length + 2 // After ]]
                    textareaRef.current.setSelectionRange(newPos, newPos)
                }
            }, 0)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return

        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && suggestions[selectedIndex]) {
            e.preventDefault()
            insertSuggestion(suggestions[selectedIndex])
        } else if (e.key === 'Tab' && suggestions[selectedIndex]) {
            e.preventDefault()
            insertSuggestion(suggestions[selectedIndex])
        } else if (e.key === 'Escape') {
            e.preventDefault()
            setShowSuggestions(false)
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
                rows={rows}
            />
            {showSuggestions && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 max-h-48 overflow-y-auto">
                    {suggestions.map((s, i) => {
                        const config = TYPE_CONFIG[s.type]
                        return (
                            <button
                                key={`${s.type}-${s.id}`}
                                onClick={() => insertSuggestion(s)}
                                className={`w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 ${i === selectedIndex ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'
                                    }`}
                            >
                                <span className={`font-mono text-xs ${config.color}`}>[{config.label}]</span>
                                <span className="text-np-text-primary truncate">{s.title}</span>
                            </button>
                        )
                    })}
                    <div className="px-2 py-1 text-xs text-np-text-secondary border-t border-np-border bg-np-bg-tertiary">
                        ↑↓ navigate • Enter/Tab select • Esc close
                    </div>
                </div>
            )}
        </div>
    )
}
