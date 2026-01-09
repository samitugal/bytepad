import { useState, useEffect, useCallback } from 'react'
import { useNoteStore } from '../../stores/noteStore'

export function NoteEditor() {
  const { activeNoteId, notes, updateNote, deleteNote } = useNoteStore()
  const activeNote = notes.find(n => n.id === activeNoteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title)
      setContent(activeNote.content)
      setTags(activeNote.tags.join(', '))
    } else {
      setTitle('')
      setContent('')
      setTags('')
    }
  }, [activeNote])

  const handleSave = useCallback(() => {
    if (!activeNoteId) return
    updateNote(activeNoteId, {
      title,
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    })
  }, [activeNoteId, title, content, tags, updateNote])

  // Auto-save on blur or Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave])

  const handleDelete = () => {
    if (!activeNoteId) return
    if (confirm('Delete this note?')) {
      deleteNote(activeNoteId)
    }
  }

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-np-text-secondary">
        <div className="text-center">
          <div className="text-np-green mb-2">// No note selected</div>
          <div className="text-sm">
            <span className="text-np-purple">Select</span> a note from the list or{' '}
            <span className="text-np-purple">create</span> a new one
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-np-border bg-np-bg-secondary">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            placeholder="Note title..."
            className="bg-transparent border-none text-np-text-primary text-lg font-mono
                       focus:outline-none w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="np-btn text-np-green"
            title="Save (Ctrl+S)"
          >
            Save
          </button>
          <button
            onClick={handleDelete}
            className="np-btn text-np-error hover:bg-np-error/20"
            title="Delete note"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Tags input */}
      <div className="px-3 py-2 border-b border-np-border bg-np-bg-secondary">
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary text-sm">Tags:</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            onBlur={handleSave}
            placeholder="tag1, tag2, tag3..."
            className="flex-1 bg-transparent border-none text-np-purple text-sm font-mono
                       focus:outline-none"
          />
        </div>
      </div>

      {/* Content editor */}
      <div className="flex-1 relative">
        {/* Line numbers */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-np-bg-secondary border-r border-np-border
                        text-np-text-secondary text-sm font-mono text-right pr-2 pt-3 select-none overflow-hidden">
          {content.split('\n').map((_, i) => (
            <div key={i} className="leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Editor */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          placeholder="Start writing..."
          className="w-full h-full bg-np-bg-primary text-np-text-primary font-mono text-sm
                     pl-14 pr-4 pt-3 pb-4 resize-none focus:outline-none leading-6"
          spellCheck={false}
        />
      </div>
    </div>
  )
}
