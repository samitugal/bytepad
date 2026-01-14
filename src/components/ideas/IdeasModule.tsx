import { useState } from 'react'
import { useIdeaStore } from '../../stores/ideaStore'
import { useTranslation } from '../../i18n'
import type { Idea, IdeaColor } from '../../types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const COLORS: IdeaColor[] = ['yellow', 'green', 'blue', 'purple', 'orange', 'red', 'cyan']

const COLOR_CLASSES: Record<IdeaColor, string> = {
  yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300',
  green: 'bg-green-500/20 border-green-500/50 text-green-300',
  blue: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  purple: 'bg-purple-500/20 border-purple-500/50 text-purple-300',
  orange: 'bg-orange-500/20 border-orange-500/50 text-orange-300',
  red: 'bg-red-500/20 border-red-500/50 text-red-300',
  cyan: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
}

const COLOR_DOT: Record<IdeaColor, string> = {
  yellow: 'bg-yellow-400',
  green: 'bg-green-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  orange: 'bg-orange-400',
  red: 'bg-red-400',
  cyan: 'bg-cyan-400',
}

export function IdeasModule() {
  const { t } = useTranslation()
  const { ideas, filter, setFilter, addIdea, reorderIdeas, getFilteredIdeas } = useIdeaStore()
  const filteredIdeas = getFilteredIdeas()

  const [newTitle, setNewTitle] = useState('')
  const [newIdea, setNewIdea] = useState('')
  const [newColor, setNewColor] = useState<IdeaColor>('yellow')
  const [showColorPicker, setShowColorPicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleAddIdea = () => {
    if (!newTitle.trim() && !newIdea.trim()) return
    addIdea({ 
      title: newTitle.trim(), 
      content: newIdea.trim().slice(0, 280), 
      color: newColor 
    })
    setNewTitle('')
    setNewIdea('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddIdea()
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = filteredIdeas.findIndex((i) => i.id === active.id)
      const newIndex = filteredIdeas.findIndex((i) => i.id === over.id)
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(filteredIdeas, oldIndex, newIndex)
        reorderIdeas(reordered.map((i) => i.id))
      }
    }
  }

  const activeCount = ideas.filter((i) => i.status === 'active').length

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>{t('ideas.title')}
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {activeCount} {activeCount === 1 ? t('ideas.idea') : t('ideas.ideas')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary">{t('tasks.filter')}:</span>
          {(['active', 'archived', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 ${filter === f ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {t(`ideas.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* New idea input */}
      <div className="mb-4 p-3 bg-np-bg-secondary border border-np-border">
        <div className="flex gap-2 items-start">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`w-8 h-8 rounded ${COLOR_DOT[newColor]} hover:opacity-80`}
              title={t('ideas.selectColor')}
            />
            {showColorPicker && (
              <div className="absolute top-10 left-0 bg-np-bg-secondary border border-np-border p-2 flex gap-1 z-10">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => { setNewColor(color); setShowColorPicker(false) }}
                    className={`w-6 h-6 rounded ${COLOR_DOT[color]} hover:scale-110 transition-transform`}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t('ideas.titlePlaceholder')}
              className="np-input"
            />
            <textarea
              value={newIdea}
              onChange={(e) => setNewIdea(e.target.value.slice(0, 280))}
              onKeyDown={handleKeyDown}
              placeholder={t('ideas.descriptionPlaceholder')}
              className="np-input h-16 resize-none"
              maxLength={280}
            />
          </div>
          <button onClick={handleAddIdea} className="np-btn text-np-green">
            💡 {t('ideas.add')}
          </button>
        </div>
        <div className="text-xs text-np-text-secondary mt-1 text-right">
          {newIdea.length}/280
        </div>
      </div>

      {/* Ideas grid */}
      <div className="flex-1 overflow-y-auto">
        {filteredIdeas.length === 0 ? (
          <div className="text-center text-np-text-secondary py-8">
            <div className="text-4xl mb-2">💡</div>
            <div className="text-np-green mb-2">// {t('ideas.noIdeas')}</div>
            <div className="text-sm">{t('ideas.createFirst')}</div>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredIdeas.map((i) => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredIdeas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> {t('ideas.addHint')}</span>
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Drag</kbd> {t('ideas.reorderHint')}</span>
      </div>
    </div>
  )
}

// Sortable Idea Card
function IdeaCard({ idea }: { idea: Idea }) {
  const { t } = useTranslation()
  const { updateIdea, deleteIdea, archiveIdea, unarchiveIdea, convertToNote } = useIdeaStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(idea.title || '')
  const [editContent, setEditContent] = useState(idea.content)
  const [showMenu, setShowMenu] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: idea.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const handleSave = () => {
    updateIdea(idea.id, { title: editTitle, content: editContent.slice(0, 280) })
    setIsEditing(false)
  }

  const handleConvert = () => {
    convertToNote(idea.id)
    setShowMenu(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-3 border rounded-lg ${COLOR_CLASSES[idea.color]} ${isDragging ? 'shadow-lg ring-2 ring-np-blue' : ''} ${idea.status !== 'active' ? 'opacity-60' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 cursor-grab active:cursor-grabbing text-xs opacity-50 hover:opacity-100"
      >
        ⋮⋮
      </div>

      {/* Menu button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-1 right-1 text-xs opacity-50 hover:opacity-100 px-1"
      >
        ⋯
      </button>

      {/* Menu dropdown */}
      {showMenu && (
        <div className="absolute top-6 right-1 bg-np-bg-secondary border border-np-border shadow-lg z-20 text-sm">
          {idea.status === 'active' ? (
            <>
              <button
                onClick={() => { setIsEditing(true); setShowMenu(false) }}
                className="block w-full text-left px-3 py-1.5 hover:bg-np-bg-hover"
              >
                ✏️ {t('common.edit')}
              </button>
              <button
                onClick={handleConvert}
                className="block w-full text-left px-3 py-1.5 hover:bg-np-bg-hover text-np-green"
              >
                📝 {t('ideas.convertToNote')}
              </button>
              <button
                onClick={() => { archiveIdea(idea.id); setShowMenu(false) }}
                className="block w-full text-left px-3 py-1.5 hover:bg-np-bg-hover"
              >
                📦 {t('ideas.archive')}
              </button>
            </>
          ) : (
            <button
              onClick={() => { unarchiveIdea(idea.id); setShowMenu(false) }}
              className="block w-full text-left px-3 py-1.5 hover:bg-np-bg-hover"
            >
              ↩️ {t('ideas.unarchive')}
            </button>
          )}
          <button
            onClick={() => { deleteIdea(idea.id); setShowMenu(false) }}
            className="block w-full text-left px-3 py-1.5 hover:bg-np-bg-hover text-np-error"
          >
            🗑️ {t('common.delete')}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="mt-4">
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder={t('ideas.titlePlaceholder')}
              className="w-full np-input text-sm font-medium"
              autoFocus
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 280))}
              placeholder={t('ideas.descriptionPlaceholder')}
              className="w-full np-input h-16 resize-none text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="np-btn text-xs text-np-green">
                {t('common.save')}
              </button>
              <button onClick={() => setIsEditing(false)} className="np-btn text-xs">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {idea.title && (
              <h4 className="font-medium text-sm mb-1">{idea.title}</h4>
            )}
            {idea.content && (
              <p className="text-sm whitespace-pre-wrap break-words opacity-80">{idea.content}</p>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {idea.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {idea.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 bg-np-bg-tertiary rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Links indicator */}
      {(idea.linkedNoteIds.length > 0 || idea.linkedTaskIds.length > 0) && (
        <div className="flex gap-2 mt-2 text-xs opacity-70">
          {idea.linkedNoteIds.length > 0 && <span>📝 {idea.linkedNoteIds.length}</span>}
          {idea.linkedTaskIds.length > 0 && <span>✓ {idea.linkedTaskIds.length}</span>}
        </div>
      )}

      {/* Status badge */}
      {idea.status === 'converted' && (
        <div className="absolute bottom-1 right-1 text-xs text-np-green">✓ converted</div>
      )}
    </div>
  )
}
