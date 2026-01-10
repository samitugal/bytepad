import { useMemo } from 'react'
import { useNoteStore } from '../../stores/noteStore'

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

  if (backlinks.length === 0 && outgoingLinks.length === 0) {
    return null
  }

  return (
    <div className="border-t border-np-border bg-np-bg-secondary">
      {/* Backlinks */}
      {backlinks.length > 0 && (
        <div className="p-3">
          <div className="text-xs text-np-green mb-2">
            // {backlinks.length} Backlink{backlinks.length !== 1 ? 's' : ''}
          </div>
          <div className="space-y-1">
            {backlinks.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className="w-full text-left px-2 py-1 text-sm text-np-cyan hover:bg-np-bg-hover transition-colors"
              >
                ← {note.title}
              </button>
            ))}
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
            {outgoingLinks.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(note.id)}
                className="w-full text-left px-2 py-1 text-sm text-np-purple hover:bg-np-bg-hover transition-colors"
              >
                → {note.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
