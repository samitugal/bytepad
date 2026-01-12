import { useState, useRef } from 'react'
import { useBookmarkStore, getFilteredBookmarks } from '../../stores/bookmarkStore'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useHabitStore } from '../../stores/habitStore'
import { useUIStore } from '../../stores/uiStore'
import { useTranslation } from '../../i18n'
import type { Bookmark } from '../../types'
import { parseTags } from '../../utils/storage'

// Wikilink autocomplete textarea component with Note, Task, Habit support
interface WikilinkTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type SuggestionType = 'note' | 'task' | 'habit'
interface Suggestion {
  title: string
  type: SuggestionType
  prefix: string
}

const TYPE_CONFIG: Record<SuggestionType, { icon: string; color: string; prefix: string }> = {
  note: { icon: '[N]', color: 'text-np-cyan', prefix: '' },
  task: { icon: '[T]', color: 'text-np-orange', prefix: '' },
  habit: { icon: '[H]', color: 'text-np-green', prefix: '' },
}

function WikilinkTextarea({ value, onChange, placeholder, className }: WikilinkTextareaProps) {
  const notes = useNoteStore((s) => s.notes)
  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check if we're in a wikilink context
  const checkForWikilink = (text: string, pos: number) => {
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
      const q = searchTerm.toLowerCase()
      const results: Suggestion[] = []

      // Search notes
      notes
        .filter(n => n.title && n.title.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(n => results.push({ title: n.title, type: 'note', prefix: '' }))

      // Search tasks
      tasks
        .filter(t => t.title && t.title.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(t => results.push({ title: t.title, type: 'task', prefix: '' }))

      // Search habits
      habits
        .filter(h => h.name && h.name.toLowerCase().includes(q))
        .slice(0, 3)
        .forEach(h => results.push({ title: h.name, type: 'habit', prefix: '' }))

      setSuggestions(results.slice(0, 8))
      setShowSuggestions(results.length > 0)
      setSelectedIndex(0)
    } else {
      setShowSuggestions(false)
    }
  }

  const insertSuggestion = (suggestion: Suggestion) => {
    const beforeCursor = value.slice(0, cursorPosition)
    const afterCursor = value.slice(cursorPosition)
    const match = beforeCursor.match(/\[\[([^\]]*?)$/)
    if (match) {
      const newBefore = beforeCursor.slice(0, match.index) + `[[${suggestion.title}]]`
      onChange(newBefore + afterCursor)
      setShowSuggestions(false)
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          const newPos = newBefore.length
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
    } else if (e.key === 'Escape') {
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
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-np-bg-secondary border border-np-border shadow-lg z-50 max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => {
            const config = TYPE_CONFIG[s.type]
            return (
              <button
                key={`${s.type}-${s.title}`}
                onClick={() => insertSuggestion(s)}
                className={`w-full text-left px-2 py-1.5 text-sm flex items-center gap-2 ${
                  i === selectedIndex ? 'bg-np-selection' : 'hover:bg-np-bg-tertiary'
                }`}
              >
                <span className={`font-mono text-xs ${config.color}`}>{config.icon}</span>
                <span className="text-np-text-primary truncate">{s.title}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Parse and render description with wikilinks
function RenderDescription({ text }: { text: string }) {
  const notes = useNoteStore((s) => s.notes)
  const tasks = useTaskStore((s) => s.tasks)
  const habits = useHabitStore((s) => s.habits)
  const setActiveModule = useUIStore((s) => s.setActiveModule)

  // Parse wikilinks: [[Note Name]], @task:Task Name, @habit:Habit Name
  const parts: Array<{ type: 'text' | 'note' | 'task' | 'habit'; content: string; id?: string }> = []
  // Regex patterns
  const wikiLinkRegex = /\[\[([^\]]+)\]\]/g
  const taskLinkRegex = /@task:([^@\n]+)/g
  const habitLinkRegex = /@habit:([^@\n]+)/g

  // Find all matches and their positions
  const matches: Array<{ index: number; length: number; type: 'note' | 'task' | 'habit'; name: string }> = []

  let match
  while ((match = wikiLinkRegex.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'note', name: match[1] })
  }
  while ((match = taskLinkRegex.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'task', name: match[1].trim() })
  }
  while ((match = habitLinkRegex.exec(text)) !== null) {
    matches.push({ index: match.index, length: match[0].length, type: 'habit', name: match[1].trim() })
  }

  // Sort by index
  matches.sort((a, b) => a.index - b.index)

  // Build parts array
  let lastIndex = 0
  for (const m of matches) {
    if (m.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, m.index) })
    }

    let id: string | undefined
    if (m.type === 'note') {
      const note = notes.find(n => n.title.toLowerCase() === m.name.toLowerCase())
      id = note?.id
    } else if (m.type === 'task') {
      const task = tasks.find(t => t.title.toLowerCase() === m.name.toLowerCase())
      id = task?.id
    } else if (m.type === 'habit') {
      const habit = habits.find(h => h.name.toLowerCase() === m.name.toLowerCase())
      id = habit?.id
    }

    parts.push({ type: m.type, content: m.name, id })
    lastIndex = m.index + m.length
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  const handleLinkClick = (type: 'note' | 'task' | 'habit') => {
    if (type === 'note') {
      setActiveModule('notes')
    } else if (type === 'task') {
      setActiveModule('tasks')
    } else if (type === 'habit') {
      setActiveModule('habits')
    }
  }

  return (
    <span className="text-sm text-np-text-secondary">
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>
        }

        const colors = {
          note: 'text-np-cyan',
          task: 'text-np-orange',
          habit: 'text-np-green',
        }

        const icons = {
          note: '📝',
          task: '✅',
          habit: '🔄',
        }

        return (
          <button
            key={i}
            onClick={() => handleLinkClick(part.type as 'note' | 'task' | 'habit')}
            className={`${colors[part.type as keyof typeof colors]} hover:underline ${!part.id ? 'opacity-50' : ''}`}
            title={part.id ? `Go to ${part.type}: ${part.content}` : `${part.type} not found: ${part.content}`}
          >
            {icons[part.type as keyof typeof icons]} {part.content}
          </button>
        )
      })}
    </span>
  )
}

const COLLECTIONS = [
  { name: 'Gold', emoji: '🥇' },
  { name: 'Silver', emoji: '🥈' },
  { name: 'Bronze', emoji: '🥉' },
  { name: 'Unsorted', emoji: '📁' },
]

export function BookmarksModule() {
  const { t, language } = useTranslation()
  const {
    bookmarks,
    selectedCollection,
    selectedTag,
    searchQuery,
    sortBy,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleRead,
    setSelectedCollection,
    setSelectedTag,
    setSearchQuery,
    setSortBy,
    getTopTags,
    getCollections,
  } = useBookmarkStore()

  const [showAddForm, setShowAddForm] = useState(false)
  const [newBookmark, setNewBookmark] = useState({ url: '', title: '', description: '', tags: '', collection: 'Unsorted' })
  const [editingId, setEditingId] = useState<string | null>(null)

  const filteredBookmarks = getFilteredBookmarks(useBookmarkStore.getState())
  const topTags = getTopTags(5)
  const collections = getCollections()

  const handleAdd = async () => {
    if (!newBookmark.url.trim()) return

    // Auto-generate title from URL if not provided
    let title = newBookmark.title.trim()
    if (!title) {
      try {
        const url = new URL(newBookmark.url)
        title = url.hostname.replace('www.', '')
      } catch {
        title = newBookmark.url
      }
    }

    addBookmark({
      url: newBookmark.url.trim(),
      title,
      description: newBookmark.description.trim() || undefined,
      tags: parseTags(newBookmark.tags),
      collection: newBookmark.collection,
    })

    setNewBookmark({ url: '', title: '', description: '', tags: '', collection: 'Unsorted' })
    setShowAddForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setShowAddForm(false)
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar - Collections & Tags */}
      <div className="w-48 border-r border-np-border bg-np-bg-secondary flex flex-col">
        {/* Collections */}
        <div className="p-3 border-b border-np-border">
          <div className="text-xs text-np-text-secondary mb-2">{language === 'tr' ? 'Koleksiyonlar' : 'Collections'}</div>
          <button
            onClick={() => setSelectedCollection(null)}
            className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${!selectedCollection ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
              }`}
          >
            <span>📚 {language === 'tr' ? 'Tüm yer imleri' : 'All bookmarks'}</span>
            <span className="text-xs">{bookmarks.length}</span>
          </button>
          {COLLECTIONS.map((col) => {
            const count = collections.find((c) => c.name === col.name)?.count || 0
            if (count === 0 && col.name !== 'Unsorted') return null
            return (
              <button
                key={col.name}
                onClick={() => setSelectedCollection(col.name)}
                className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${selectedCollection === col.name ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
                  }`}
              >
                <span>{col.emoji} {col.name}</span>
                <span className="text-xs">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div className="p-3 flex-1">
            <div className="text-xs text-np-text-secondary mb-2">Tags ({topTags.length})</div>
            {topTags.map(({ tag, count }) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`w-full text-left px-2 py-1 text-sm flex items-center justify-between ${selectedTag === tag ? 'bg-np-purple/20 text-np-purple' : 'text-np-text-secondary hover:bg-np-bg-tertiary'
                  }`}
              >
                <span># {tag}</span>
                <span className="text-xs">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-np-border">
          <div className="flex items-center gap-4">
            <h2 className="text-np-text-primary">
              <span className="text-np-green">// </span>
              {selectedCollection || 'All bookmarks'}
              {selectedTag && <span className="text-np-purple ml-2">#{selectedTag}</span>}
            </h2>
            <span className="text-xs text-np-text-secondary">{filteredBookmarks.length} items</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'domain')}
              className="np-input text-xs"
            >
              <option value="date">{language === 'tr' ? 'Tarihe göre' : 'By date'} ↓</option>
              <option value="title">{language === 'tr' ? 'Başlığa göre' : 'By title'}</option>
              <option value="domain">{language === 'tr' ? 'Domaine göre' : 'By domain'}</option>
            </select>
            <button onClick={() => setShowAddForm(true)} className="np-btn">
              <span className="text-np-green">+</span> {t('common.add')}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-np-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common.search') + '...'}
            className="w-full np-input"
          />
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="p-3 border-b border-np-border bg-np-bg-secondary">
            <div className="space-y-2">
              <input
                type="url"
                value={newBookmark.url}
                onChange={(e) => setNewBookmark({ ...newBookmark, url: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                className="w-full np-input"
                autoFocus
              />
              <input
                type="text"
                value={newBookmark.title}
                onChange={(e) => setNewBookmark({ ...newBookmark, title: e.target.value })}
                onKeyDown={handleKeyDown}
                placeholder={language === 'tr' ? 'Başlık (opsiyonel)' : 'Title (optional)'}
                className="w-full np-input"
              />
              <WikilinkTextarea
                value={newBookmark.description}
                onChange={(desc) => setNewBookmark({ ...newBookmark, description: desc })}
                placeholder={language === 'tr' ? 'Açıklama - [[Not Adı]] yazarak linkle' : 'Description - type [[ to link notes'}
                className="w-full np-input h-16 resize-none"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newBookmark.tags}
                  onChange={(e) => setNewBookmark({ ...newBookmark, tags: e.target.value })}
                  onKeyDown={handleKeyDown}
                  placeholder={language === 'tr' ? 'Etiketler (virgülle ayır)' : 'Tags (comma separated)'}
                  className="flex-1 np-input"
                />
                <select
                  value={newBookmark.collection}
                  onChange={(e) => setNewBookmark({ ...newBookmark, collection: e.target.value })}
                  className="np-input"
                >
                  {COLLECTIONS.map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.emoji} {col.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="np-btn text-np-green">
                  {t('common.save')}
                </button>
                <button onClick={() => setShowAddForm(false)} className="np-btn">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookmark List */}
        <div className="flex-1 overflow-y-auto">
          {filteredBookmarks.length === 0 ? (
            <div className="text-center text-np-text-secondary py-8">
              <div className="text-np-green mb-2">// {language === 'tr' ? 'Yer imi yok' : 'No bookmarks'}</div>
              <div className="text-sm">{language === 'tr' ? 'İlk yer imini ekle' : 'Add your first bookmark'}</div>
            </div>
          ) : (
            filteredBookmarks.map((bookmark) => (
              <BookmarkItem
                key={bookmark.id}
                bookmark={bookmark}
                onToggleRead={() => toggleRead(bookmark.id)}
                onDelete={() => deleteBookmark(bookmark.id)}
                onEdit={() => setEditingId(bookmark.id)}
                onTagClick={(tag) => setSelectedTag(tag)}
                isEditing={editingId === bookmark.id}
                onUpdate={(updates) => {
                  updateBookmark(bookmark.id, updates)
                  setEditingId(null)
                }}
                onCancelEdit={() => setEditingId(null)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

interface BookmarkItemProps {
  bookmark: Bookmark
  onToggleRead: () => void
  onDelete: () => void
  onEdit: () => void
  onTagClick: (tag: string) => void
  isEditing: boolean
  onUpdate: (updates: Partial<Bookmark>) => void
  onCancelEdit: () => void
}

function BookmarkItem({
  bookmark,
  onToggleRead,
  onDelete,
  onEdit,
  onTagClick,
  isEditing,
  onUpdate,
  onCancelEdit,
}: BookmarkItemProps) {
  const [editData, setEditData] = useState({
    title: bookmark.title,
    description: bookmark.description || '',
    tags: bookmark.tags.join(', '),
    collection: bookmark.collection || 'Unsorted',
  })

  const formatDate = (date: Date) => {
    const d = new Date(date)
    return d.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
  }

  const getCollectionEmoji = (collection?: string) => {
    const col = COLLECTIONS.find((c) => c.name === collection)
    return col?.emoji || '📁'
  }

  if (isEditing) {
    return (
      <div className="p-3 border-b border-np-border bg-np-bg-secondary">
        <input
          type="text"
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
          className="w-full np-input mb-2"
          placeholder="Title"
        />
        <WikilinkTextarea
          value={editData.description}
          onChange={(desc) => setEditData({ ...editData, description: desc })}
          placeholder="Description - type [[ to link notes"
          className="w-full np-input h-16 resize-none mb-2"
        />
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={editData.tags}
            onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
            placeholder="Tags"
            className="flex-1 np-input"
          />
          <select
            value={editData.collection}
            onChange={(e) => setEditData({ ...editData, collection: e.target.value })}
            className="np-input"
          >
            {COLLECTIONS.map((col) => (
              <option key={col.name} value={col.name}>
                {col.emoji} {col.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onUpdate({
                title: editData.title,
                description: editData.description.trim() || undefined,
                tags: parseTags(editData.tags),
                collection: editData.collection,
              })
            }
            className="np-btn text-np-green text-xs"
          >
            Save
          </button>
          <button onClick={onCancelEdit} className="np-btn text-xs">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`p-3 border-b border-np-border hover:bg-np-bg-tertiary transition-colors group ${bookmark.isRead ? 'opacity-60' : ''
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Favicon placeholder */}
        <div className="w-10 h-10 bg-np-bg-tertiary border border-np-border flex items-center justify-center text-xs text-np-text-secondary flex-shrink-0">
          {bookmark.domain.substring(0, 2).toUpperCase()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-np-cyan hover:underline font-medium block truncate"
          >
            {bookmark.title}
          </a>
          <div className="flex items-center gap-2 text-xs text-np-text-secondary mt-1">
            <span>{getCollectionEmoji(bookmark.collection)} {bookmark.collection || 'Unsorted'}</span>
            <span>·</span>
            <span>{bookmark.domain}</span>
            <span>·</span>
            <span>{formatDate(bookmark.createdAt)}</span>
          </div>
          {bookmark.description && (
            <div className="mt-1">
              <RenderDescription text={bookmark.description} />
            </div>
          )}
          {bookmark.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {bookmark.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="text-xs bg-np-bg-tertiary text-np-purple px-1 hover:bg-np-purple/20"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onToggleRead}
            className={`p-1 text-xs ${bookmark.isRead ? 'text-np-green' : 'text-np-text-secondary hover:text-np-green'}`}
            title={bookmark.isRead ? 'Mark as unread' : 'Mark as read'}
          >
            {bookmark.isRead ? '✓' : '○'}
          </button>
          <button onClick={onEdit} className="p-1 text-xs text-np-text-secondary hover:text-np-blue" title="Edit">
            ✎
          </button>
          <button onClick={onDelete} className="p-1 text-xs text-np-text-secondary hover:text-np-error" title="Delete">
            ×
          </button>
        </div>
      </div>
    </div>
  )
}
