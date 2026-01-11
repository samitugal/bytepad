import { useMemo, useState } from 'react'
import { useNoteStore } from '../../stores/noteStore'

const MAX_VISIBLE_LINKS = 3

interface BacklinksPanelProps {
  noteId: string
  noteTitle: string
}

// Extract [[wikilinks]] from content
function extractWikilinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g
  const links: string[] = []
  let match
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].toLowerCase())
  }
  return links
}

export function BacklinksPanel({ noteId, noteTitle }: BacklinksPanelProps) {
  const notes = useNoteStore((s) => s.notes)
  const setActiveNote = useNoteStore((s) => s.setActiveNote)

  // Find notes that link to this note
  const backlinks = useMemo(() => {
    const titleLower = noteTitle.toLowerCase()
    return notes.filter((note) => {
      if (note.id === noteId) return false
      const links = extractWikilinks(note.content)
      return links.includes(titleLower)
    })
  }, [notes, noteId, noteTitle])

  // Find notes this note links to
  const outgoingLinks = useMemo(() => {
    const currentNote = notes.find((n) => n.id === noteId)
    if (!currentNote) return []
    
    const links = extractWikilinks(currentNote.content)
    return notes.filter((note) => 
      note.id !== noteId && links.includes(note.title.toLowerCase())
    )
  }, [notes, noteId])

  const [showAllBacklinks, setShowAllBacklinks] = useState(false)
  const [showAllOutgoing, setShowAllOutgoing] = useState(false)

  if (backlinks.length === 0 && outgoingLinks.length === 0) {
    return null
  }

  const visibleBacklinks = showAllBacklinks ? backlinks : backlinks.slice(0, MAX_VISIBLE_LINKS)
  const visibleOutgoing = showAllOutgoing ? outgoingLinks : outgoingLinks.slice(0, MAX_VISIBLE_LINKS)
  const hiddenBacklinksCount = backlinks.length - MAX_VISIBLE_LINKS
  const hiddenOutgoingCount = outgoingLinks.length - MAX_VISIBLE_LINKS

  return (
    <div className="border-t border-np-border bg-np-bg-secondary">
      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="p-3">
          <div className="text-xs text-np-green mb-2">
            // {backlinks.length} Backlink{backlinks.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-1">
            {visibleBacklinks.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className="w-full text-left px-2 py-1 text-sm text-np-cyan hover:bg-np-bg-hover transition-colors"
              >
                ← {note.title}
              </button>
            ))}
            {hiddenBacklinksCount > 0 && (
              <button
                onClick={() => setShowAllBacklinks(!showAllBacklinks)}
                className="text-xs text-np-text-secondary hover:text-np-text-primary px-2 py-1"
              >
                {showAllBacklinks ? '− Show less' : `+ ${hiddenBacklinksCount} more`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Outgoing Links */}
      {outgoingLinks.length > 0 && (
        <div className="p-3 border-t border-np-border">
          <div className="text-xs text-np-purple mb-2">
            // {outgoingLinks.length} Outgoing Link{outgoingLinks.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-1">
            {visibleOutgoing.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className="w-full text-left px-2 py-1 text-sm text-np-purple hover:bg-np-bg-hover transition-colors"
              >
                → {note.title}
              </button>
            ))}
            {hiddenOutgoingCount > 0 && (
              <button
                onClick={() => setShowAllOutgoing(!showAllOutgoing)}
                className="text-xs text-np-text-secondary hover:text-np-text-primary px-2 py-1"
              >
                {showAllOutgoing ? '− Show less' : `+ ${hiddenOutgoingCount} more`}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
