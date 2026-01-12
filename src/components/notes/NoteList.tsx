import { useState, useMemo } from 'react'
import { useNoteStore } from '../../stores/noteStore'
import { useTabStore } from '../../stores/tabStore'
import { ResizablePanel } from '../common/ResizablePanel'
import { useTranslation } from '../../i18n'

export function NoteList() {
  const { t, language } = useTranslation()
  const { notes, activeNoteId, searchQuery, setActiveNote, setSearchQuery, addNote, togglePin, getSortedNotes } = useNoteStore()
  const { addTab } = useTabStore()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTagCloud, setShowTagCloud] = useState(false)

  // Get all unique tags with counts
  const tagCloud = useMemo(() => {
    const tagCounts: Record<string, number> = {}
    notes.forEach(note => {
      note.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))
  }, [notes])

  // Filter and sort notes: pinned first, then by createdAt (newest first)
  const filteredNotes = useMemo(() => {
    let result = getSortedNotes()

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(note =>
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }

    // Filter by selected tags (intersection - must have ALL selected tags)
    if (selectedTags.length > 0) {
      result = result.filter(note =>
        selectedTags.every(tag => note.tags.includes(tag))
      )
    }

    return result
  }, [notes, searchQuery, selectedTags, getSortedNotes])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleNewNote = () => {
    const noteId = addNote({
      title: '',
      content: '',
      tags: [],
    })
    addTab('note', noteId, 'Untitled')
  }

  const handleNoteClick = (noteId: string, noteTitle: string) => {
    setActiveNote(noteId)
    addTab('note', noteId, noteTitle || 'Untitled')
  }

  const formatDate = (date: Date) => {
    const d = new Date(date)
    const locale = language === 'tr' ? 'tr-TR' : 'en-US'
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  }

  return (
    <ResizablePanel
      storageKey="notes-list"
      defaultWidth={224}
      minWidth={180}
      maxWidth={400}
      side="right"
      className="border-r border-np-border flex flex-col bg-np-bg-secondary"
    >
      {/* Search */}
      <div className="p-2 border-b border-np-border">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('notes.searchNotes')}
          className="w-full bg-np-bg-primary border border-np-border text-np-text-primary
                     px-2 py-1 text-sm font-mono focus:border-np-blue focus:outline-none"
        />
      </div>

      {/* New note button */}
      <div className="p-2 border-b border-np-border">
        <button
          onClick={handleNewNote}
          className="w-full np-btn text-left flex items-center gap-2"
        >
          <span className="text-np-green">+</span> {t('notes.newNote')}
        </button>
      </div>

      {/* Tag Cloud Toggle */}
      {tagCloud.length > 0 && (
        <div className="border-b border-np-border">
          <button
            onClick={() => setShowTagCloud(!showTagCloud)}
            className="w-full px-2 py-1 text-xs text-np-text-secondary hover:text-np-text-primary text-left flex items-center gap-1"
          >
            <span>{showTagCloud ? '▼' : '▶'}</span>
            <span>Tags ({tagCloud.length})</span>
            {selectedTags.length > 0 && (
              <span className="ml-auto text-np-purple">{selectedTags.length} {language === 'tr' ? 'seçili' : 'selected'}</span>
            )}
          </button>

          {/* Tag Cloud */}
          {showTagCloud && (
            <div className="px-2 pb-2 flex flex-wrap gap-1">
              {tagCloud.map(({ tag, count }) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-1.5 py-0.5 transition-colors ${selectedTags.includes(tag)
                    ? 'bg-np-purple text-white'
                    : 'bg-np-bg-tertiary text-np-purple hover:bg-np-bg-hover'
                    }`}
                >
                  #{tag} <span className="text-np-text-secondary">({count})</span>
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs px-1.5 py-0.5 text-np-error hover:bg-np-error/20"
                >
                  {language === 'tr' ? 'Temizle' : 'Clear'}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {filteredNotes.length === 0 ? (
          <div className="p-4 text-np-text-secondary text-sm text-center">
            {searchQuery ? t('notes.noNotesFound') : t('notes.noNotes')}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => handleNoteClick(note.id, note.title)}
              className={`px-3 py-2 border-b border-np-border cursor-pointer transition-colors group
                ${activeNoteId === note.id
                  ? 'bg-np-selection'
                  : 'hover:bg-np-bg-tertiary'
                }`}
            >
              <div className="text-sm text-np-text-primary truncate flex items-center gap-1">
                {note.pinned && <span className="text-np-yellow" title="Pinned">📌</span>}
                <span className="truncate">{note.title || t('notes.untitled')}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    togglePin(note.id)
                  }}
                  className={`ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1 hover:bg-np-bg-hover ${
                    note.pinned ? 'text-np-yellow' : 'text-np-text-secondary'
                  }`}
                  title={note.pinned ? 'Unpin' : 'Pin'}
                >
                  {note.pinned ? '📌' : '📍'}
                </button>
              </div>
              <div className="text-xs text-np-text-secondary mt-1 flex items-center justify-between">
                <span className="truncate max-w-[120px]">
                  {note.content.substring(0, 30) || t('notes.emptyNote')}
                </span>
                <span>{formatDate(note.updatedAt)}</span>
              </div>
              {note.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {note.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-np-bg-tertiary text-np-purple px-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="p-2 border-t border-np-border text-xs text-np-text-secondary">
        {notes.length} {t('nav.notes').toLowerCase()}
      </div>
    </ResizablePanel>
  )
}
