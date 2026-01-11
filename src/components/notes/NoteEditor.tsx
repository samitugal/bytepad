import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNoteStore } from '../../stores/noteStore'
import { useTaskStore } from '../../stores/taskStore'
import { useTabStore } from '../../stores/tabStore'
import { BacklinksPanel } from './BacklinksPanel'
import { WikilinkAutocomplete, type WikilinkSuggestion } from './WikilinkAutocomplete'
import { ConfirmModal } from '../common'
import { useTranslation } from '../../i18n'
import { parseTags } from '../../utils/storage'
import type { Note } from '../../types'

function LinkPreviewTooltip({ note, position }: { note: Note; position: { x: number; y: number } }) {
  const preview = note.content.substring(0, 120) + (note.content.length > 120 ? '...' : '')
  const date = new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
  
  return (
    <div
      className="fixed z-50 bg-np-bg-tertiary border border-np-border shadow-xl p-3 max-w-xs pointer-events-none"
      style={{
        left: Math.min(position.x, window.innerWidth - 280),
        top: position.y + 20,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-np-text-primary font-medium">{note.title || 'Untitled'}</span>
        <span className="text-xs bg-np-green/20 text-np-green px-1.5 py-0.5 rounded">note</span>
      </div>
      <div className="flex items-start gap-2 text-xs text-np-text-secondary mb-2">
        <span>📝</span>
        <span>{preview || 'No content'}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        {note.tags.length > 0 && (
          <span className="text-np-purple">#{note.tags[0]}</span>
        )}
        <span className="text-np-text-secondary">{date}</span>
      </div>
    </div>
  )
}

function MarkdownWithPreview({ content, notes, onNavigate }: {
  content: string
  notes: Note[]
  onNavigate: (type: 'note' | 'task', id: string) => void
}) {
  const [hoverNote, setHoverNote] = useState<Note | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    if (!isHovering) {
      const timer = setTimeout(() => setHoverNote(null), 50)
      return () => clearTimeout(timer)
    }
  }, [isHovering])

  const handleMouseEnter = (noteId: string, e: React.MouseEvent) => {
    setIsHovering(true)
    const note = notes.find(n => n.id === noteId)
    if (note) {
      setHoverNote(note)
      setHoverPosition({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  return (
    <>
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            if (href?.startsWith('#note-')) {
              const noteId = href.replace('#note-', '')
              return (
                <span
                  onClick={() => onNavigate('note', noteId)}
                  onMouseEnter={(e) => handleMouseEnter(noteId, e)}
                  onMouseLeave={handleMouseLeave}
                  className="text-np-cyan cursor-pointer hover:underline no-underline"
                >
                  {children}
                </span>
              )
            }
            if (href?.startsWith('#task-')) {
              return (
                <span className="text-np-orange cursor-pointer hover:underline no-underline">
                  {children}
                </span>
              )
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
          },
          img: ({ src, alt }) => (
            <span className="block my-2">
              <img 
                src={src} 
                alt={alt || 'image'} 
                className="max-w-full h-auto rounded border border-np-border cursor-pointer
                           hover:border-np-blue transition-colors"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
                onClick={(e) => {
                  e.preventDefault()
                  window.open(src, '_blank')
                }}
                loading="lazy"
              />
              {alt && <span className="block text-xs text-np-text-secondary mt-1 italic">{alt}</span>}
            </span>
          )
        }}
      >{content}</ReactMarkdown>
      {hoverNote && <LinkPreviewTooltip note={hoverNote} position={hoverPosition} />}
    </>
  )
}

export function NoteEditor() {
  const { t } = useTranslation()
  const { activeNoteId, notes, updateNote, deleteNote, setActiveNote } = useNoteStore()
  const tasks = useTaskStore((s) => s.tasks)
  const { tabs, updateTabTitle } = useTabStore()
  const activeNote = notes.find(n => n.id === activeNoteId)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

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
      tags: parseTags(tags),
    })
    
    // Update tab title if exists
    const tab = tabs.find(t => t.type === 'note' && t.entityId === activeNoteId)
    if (tab && tab.title !== (title || 'Untitled')) {
      updateTabTitle(tab.id, title || 'Untitled')
    }
  }, [activeNoteId, title, content, tags, updateNote, tabs, updateTabTitle])

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

  // Sync line numbers scroll with textarea
  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }, [])

  // Handle image paste from clipboard
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) {
          processImageFile(file)
        }
        break
      }
    }
  }, [])

  // Handle image drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        processImageFile(file)
        break
      }
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // Process and insert image as base64
  const processImageFile = useCallback((file: File) => {
    const maxSize = 5 * 1024 * 1024 // 5MB limit
    if (file.size > maxSize) {
      alert('Image too large. Maximum size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64 = event.target?.result as string
      const textarea = textareaRef.current
      if (!textarea) return

      const cursorPos = textarea.selectionStart
      const fileName = file.name.replace(/\.[^/.]+$/, '') || 'image'
      const imageMarkdown = `![${fileName}](${base64})\n`
      
      const newContent = content.substring(0, cursorPos) + imageMarkdown + content.substring(cursorPos)
      setContent(newContent)

      // Move cursor after inserted image
      setTimeout(() => {
        const newPos = cursorPos + imageMarkdown.length
        textarea.setSelectionRange(newPos, newPos)
        textarea.focus()
      }, 0)
    }
    reader.readAsDataURL(file)
  }, [content])

  // Handle wikilink insertion from autocomplete
  const handleWikilinkInsert = useCallback((suggestion: WikilinkSuggestion, startPos: number, endPos: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const wikilink = `[[${suggestion.title}]]`
    const newContent = content.slice(0, startPos) + wikilink + content.slice(endPos)
    setContent(newContent)

    // Set cursor position after the inserted wikilink
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newCursorPos = startPos + wikilink.length
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    })
  }, [content])

  const handleWikilinkNavigate = useCallback((type: 'note' | 'task', id: string) => {
    if (type === 'note') {
      setActiveNote(id)
    }
  }, [setActiveNote])

  const processedContent = useMemo(() => {
    return content.replace(/\[\[([^\]]+)\]\]/g, (_, linkText) => {
      const linkedNote = notes.find(n => n.title.toLowerCase() === linkText.toLowerCase())
      const linkedTask = tasks.find(t => t.title.toLowerCase() === linkText.toLowerCase())
      
      if (linkedNote) {
        return `**[📝 ${linkText}](#note-${linkedNote.id})**`
      } else if (linkedTask) {
        return `**[✓ ${linkText}](#task-${linkedTask.id})**`
      }
      return `*⚠ ${linkText}*`
    })
  }, [content, notes, tasks])

  const handleDelete = () => {
    if (!activeNoteId) return
    setShowDeleteConfirm(true)
  }

  const confirmDelete = () => {
    if (!activeNoteId) return
    deleteNote(activeNoteId)
    setShowDeleteConfirm(false)
  }

  if (!activeNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-np-text-secondary">
        <div className="text-center">
          <div className="text-np-green mb-2">// {t('notes.noNotes')}</div>
          <div className="text-sm">
            <span className="text-np-purple">{t('common.edit')}</span> {t('nav.notes').toLowerCase()}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-np-border bg-np-bg-secondary">
        <div className="flex-1 min-w-0 mr-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleSave}
            placeholder={t('notes.untitled') + '...'}
            className="bg-transparent border-none text-np-text-primary text-lg font-mono
                       focus:outline-none w-full"
          />
        </div>
        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex items-center border border-np-border">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2 py-1 text-xs font-mono ${
                viewMode === 'edit' 
                  ? 'bg-np-bg-hover text-np-text-primary' 
                  : 'text-np-text-secondary hover:text-np-text-primary'
              }`}
              title={t('common.edit')}
            >
              {t('common.edit')}
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2 py-1 text-xs font-mono border-x border-np-border ${
                viewMode === 'split' 
                  ? 'bg-np-bg-hover text-np-text-primary' 
                  : 'text-np-text-secondary hover:text-np-text-primary'
              }`}
              title="Split"
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2 py-1 text-xs font-mono ${
                viewMode === 'preview' 
                  ? 'bg-np-bg-hover text-np-text-primary' 
                  : 'text-np-text-secondary hover:text-np-text-primary'
              }`}
              title="Preview"
            >
              Preview
            </button>
          </div>
          
          <button
            onClick={handleSave}
            className="np-btn text-np-green"
            title={`${t('common.save')} (Ctrl+S)`}
          >
            {t('common.save')}
          </button>
          <button
            onClick={handleDelete}
            className="np-btn text-np-error hover:bg-np-error/20"
            title={t('common.delete')}
          >
            {t('common.delete')}
          </button>
        </div>
      </div>

      {/* Tags input */}
      <div className="px-3 py-2 border-b border-np-border bg-np-bg-secondary">
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary text-sm">{t('notes.tags')}:</span>
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

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={`relative ${viewMode === 'split' ? 'w-1/2 border-r border-np-border' : 'flex-1'} overflow-hidden`}>
            {/* Line numbers - absolutely positioned, syncs scroll with textarea */}
            <div
              ref={lineNumbersRef}
              className="absolute left-0 top-0 bottom-0 w-12 bg-np-bg-secondary border-r border-np-border
                         text-np-text-secondary text-sm font-mono text-right pr-2 select-none
                         overflow-y-auto scrollbar-hide"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <div style={{ paddingTop: '12px', paddingBottom: '16px' }}>
                {content.split('\n').map((_, i) => (
                  <div key={i} style={{ height: '24px', lineHeight: '24px' }}>{i + 1}</div>
                ))}
              </div>
            </div>

            {/* Editor */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onBlur={handleSave}
              onScroll={handleScroll}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              placeholder="Start writing in Markdown... (Paste or drop images here)"
              className="w-full h-full bg-np-bg-primary text-np-text-primary font-mono text-sm
                         pr-4 resize-none focus:outline-none"
              style={{
                lineHeight: '24px',
                paddingLeft: '56px',
                paddingTop: '12px',
                paddingBottom: '16px'
              }}
              spellCheck={false}
            />

            {/* Wikilink Autocomplete */}
            <WikilinkAutocomplete
              textareaRef={textareaRef}
              content={content}
              onInsert={handleWikilinkInsert}
            />
          </div>
        )}

        {/* Preview Panel */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`overflow-auto ${viewMode === 'split' ? 'w-1/2' : 'flex-1'}`}>
            <div className="p-4 prose prose-invert prose-sm max-w-none
                            prose-headings:text-np-blue prose-headings:font-mono prose-headings:border-b prose-headings:border-np-border prose-headings:pb-2 prose-headings:mb-4 prose-headings:mt-6
                            prose-h1:text-xl prose-h1:text-np-cyan
                            prose-h2:text-lg prose-h2:text-np-blue
                            prose-h3:text-base prose-h3:text-np-purple prose-h3:border-none
                            prose-p:text-np-text-primary prose-p:leading-relaxed prose-p:my-3
                            prose-a:text-np-cyan prose-a:no-underline hover:prose-a:underline
                            prose-strong:text-np-orange prose-strong:font-semibold
                            prose-em:text-np-purple prose-em:italic
                            prose-code:text-np-green prose-code:bg-np-bg-tertiary prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                            prose-pre:bg-np-bg-secondary prose-pre:border prose-pre:border-np-border prose-pre:my-4
                            prose-blockquote:border-l-np-purple prose-blockquote:text-np-text-secondary prose-blockquote:italic prose-blockquote:pl-4
                            prose-ul:text-np-text-primary prose-ol:text-np-text-primary prose-ul:my-3 prose-ol:my-3
                            prose-li:marker:text-np-green prose-li:my-1
                            prose-hr:border-np-border">
              {content ? (
                <MarkdownWithPreview 
                  content={processedContent} 
                  notes={notes}
                  onNavigate={handleWikilinkNavigate}
                />
              ) : (
                <div className="text-np-text-secondary italic">
                  // Preview will appear here...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Backlinks Panel */}
      {activeNote && (
        <BacklinksPanel noteId={activeNote.id} noteTitle={activeNote.title} />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title={`// ${t('confirm.deleteNote')}`}
        message={t('confirm.deleteNoteMessage', { title: activeNote?.title || t('notes.untitled') })}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
