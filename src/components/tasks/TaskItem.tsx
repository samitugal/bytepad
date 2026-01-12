import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useBookmarkStore } from '../../stores/bookmarkStore'
import { useNoteStore } from '../../stores/noteStore'
import { useUIStore } from '../../stores/uiStore'
import type { Task } from '../../types'

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const
const PRIORITY_COLORS = {
  P1: 'text-np-error',
  P2: 'text-np-orange',
  P3: 'text-np-blue',
  P4: 'text-np-text-secondary',
}

interface SortableTaskItemProps {
  task: Task
  isExpanded: boolean
  onToggleExpand: () => void
  onToggleTask: (id: string) => void
  onEditTask: (id: string) => void
  onDeleteTask: (id: string, title: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onAddSubtask: (taskId: string) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  newSubtaskTitle: string
  setNewSubtaskTitle: (title: string) => void
  t: (key: string, params?: Record<string, string | number>) => string
  isDraggable: boolean
}

export function SortableTaskItem({
  task,
  isExpanded,
  onToggleExpand,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onToggleSubtask,
  onDeleteSubtask,
  onAddSubtask,
  onUpdateTask,
  newSubtaskTitle,
  setNewSubtaskTitle,
  t,
  isDraggable,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !isDraggable })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  }

  const completedSubtasks = task.subtasks.filter(s => s.completed).length

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-np-border bg-np-bg-secondary transition-colors ${isDragging ? 'shadow-lg ring-2 ring-np-blue' : ''}`}
    >
      {/* Main row */}
      <div
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-np-bg-hover"
        onClick={onToggleExpand}
      >
        {/* Drag handle - only show when in manual sort mode */}
        {isDraggable && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-np-text-secondary hover:text-np-text-primary px-1"
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder"
          >
            ⋮⋮
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleTask(task.id)
          }}
          className="w-5 h-5 border border-np-text-secondary hover:border-np-green flex items-center justify-center text-sm transition-colors"
        >
          {task.completed && '✓'}
        </button>

        {/* Priority badge */}
        <span className={`text-xs font-bold ${PRIORITY_COLORS[task.priority]}`}>
          [{task.priority}]
        </span>

        {/* Title */}
        <span className="flex-1 text-np-text-primary">
          {task.title}
        </span>

        {/* Subtask count badge */}
        {task.subtasks.length > 0 && (
          <span className={`text-xs px-2 py-0.5 rounded ${completedSubtasks === task.subtasks.length
            ? 'bg-np-green/20 text-np-green'
            : 'bg-np-bg-tertiary text-np-text-secondary'
            }`}>
            {completedSubtasks}/{task.subtasks.length}
          </span>
        )}

        {/* Time block indicator */}
        {task.startTime && (
          <span className="text-xs text-np-cyan">
            {task.startTime}{task.deadlineTime && ` - ${task.deadlineTime}`}
          </span>
        )}

        {/* Deadline */}
        {task.deadline && !task.startTime && (
          <span className="text-xs text-np-orange">
            {new Date(task.deadline).toLocaleDateString('tr-TR')}
          </span>
        )}

        {/* Reminder indicator */}
        {task.reminderEnabled && (
          <span className="text-xs">🔔</span>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex gap-1">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-1.5 py-0.5 bg-np-purple/20 text-np-purple rounded"
              >
                #{tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-np-text-secondary">+{task.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Linked bookmarks indicator */}
        {task.linkedBookmarkIds && task.linkedBookmarkIds.length > 0 && (
          <span className="text-xs px-1.5 py-0.5 bg-np-cyan/20 text-np-cyan rounded" title={`${task.linkedBookmarkIds.length} linked bookmarks`}>
            🔗 {task.linkedBookmarkIds.length}
          </span>
        )}

        {/* Expand indicator */}
        <span className="text-np-text-secondary text-xs">
          {isExpanded ? '▼' : '▶'}
        </span>

        {/* Edit */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditTask(task.id)
          }}
          className="text-np-text-secondary hover:text-np-blue text-sm px-1"
          title="Edit task"
        >
          ✎
        </button>

        {/* Delete */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDeleteTask(task.id, task.title)
          }}
          className="text-np-text-secondary hover:text-np-error text-sm px-2"
        >
          ×
        </button>
      </div>

      {/* Expanded content with subtasks */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-np-border bg-np-bg-primary">
          {/* Description with entity links */}
          {task.description && (
            <LinkedDescription
              text={task.description}
              linkedBookmarkIds={task.linkedBookmarkIds}
              linkedNoteIds={task.linkedNoteIds}
            />
          )}

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div className="py-2 space-y-1">
              <div className="text-xs text-np-text-secondary mb-2">// {t('tasks.subtasks')}</div>
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center gap-2 pl-4 py-1 hover:bg-np-bg-hover group"
                >
                  <button
                    onClick={() => onToggleSubtask(task.id, subtask.id)}
                    className={`w-4 h-4 border flex items-center justify-center text-xs transition-colors
                      ${subtask.completed
                        ? 'bg-np-green border-np-green text-np-bg-primary'
                        : 'border-np-text-secondary hover:border-np-green'
                      }`}
                  >
                    {subtask.completed && '✓'}
                  </button>
                  <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-np-text-secondary' : 'text-np-text-primary'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => onDeleteSubtask(task.id, subtask.id)}
                    className="text-np-text-secondary hover:text-np-error text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add subtask input */}
          <div className="flex gap-2 py-2 border-t border-np-border mt-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onAddSubtask(task.id)
                }
              }}
              placeholder={t('tasks.addSubtask')}
              className="flex-1 np-input text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onAddSubtask(task.id)
              }}
              className="np-btn text-xs text-np-green"
            >
              + {t('tasks.add')}
            </button>
          </div>

          {/* Task settings */}
          <div className="flex gap-2 pt-2 border-t border-np-border">
            <input
              type="date"
              value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
              onChange={(e) => onUpdateTask(task.id, { deadline: e.target.value ? new Date(e.target.value) : undefined })}
              onClick={(e) => e.stopPropagation()}
              className="np-input text-xs"
            />
            <select
              value={task.priority}
              onChange={(e) => onUpdateTask(task.id, { priority: e.target.value as Task['priority'] })}
              onClick={(e) => e.stopPropagation()}
              className="np-input text-xs"
            >
              {PRIORITIES.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

// Completed Task Item (simpler, non-sortable)
interface CompletedTaskItemProps {
  task: Task
  onToggleTask: (id: string) => void
  onEditTask: (id: string) => void
  onDeleteTask: (id: string, title: string) => void
}

export function CompletedTaskItem({ task, onToggleTask, onEditTask, onDeleteTask }: CompletedTaskItemProps) {
  return (
    <div className="p-2 flex items-center gap-3 bg-np-bg-tertiary/50 border border-np-border/50">
      <button
        onClick={() => onToggleTask(task.id)}
        className="w-4 h-4 bg-np-green border-np-green flex items-center justify-center text-xs text-np-bg-primary"
      >
        ✓
      </button>
      <span className={`text-xs font-bold ${PRIORITY_COLORS[task.priority]} opacity-50`}>
        [{task.priority}]
      </span>
      <span className="flex-1 text-np-text-secondary line-through text-sm">
        {task.title}
      </span>
      {task.subtasks.length > 0 && (
        <span className="text-xs text-np-text-secondary">
          {task.subtasks.length} subtask
        </span>
      )}
      {task.completedAt && (
        <span className="text-xs text-np-text-secondary">
          {new Date(task.completedAt).toLocaleDateString('tr-TR')}
        </span>
      )}
      <button
        onClick={() => onEditTask(task.id)}
        className="text-np-text-secondary hover:text-np-blue text-sm px-1"
        title="Edit task"
      >
        ✎
      </button>
      <button
        onClick={() => onDeleteTask(task.id, task.title)}
        className="text-np-text-secondary hover:text-np-error text-sm px-1"
      >
        ×
      </button>
    </div>
  )
}

// Component to render description with clickable [[entity]] links
interface LinkedDescriptionProps {
  text: string
  linkedBookmarkIds?: string[]
  linkedNoteIds?: string[]
}

export function LinkedDescription({ text, linkedBookmarkIds }: LinkedDescriptionProps) {
  const bookmarks = useBookmarkStore((state) => state.bookmarks)
  const notes = useNoteStore((state) => state.notes)
  const setActiveModule = useUIStore((state) => state.setActiveModule)

  // Parse [[entity]] links and [T:id] task links
  const parts = useMemo(() => {
    const regex = /\[\[([^\]]+)\]\]|\[T:([^\]]+)\]|\[B:([^\]]+)\]|\[N:([^\]]+)\]/g
    const result: Array<{ type: 'text' | 'note' | 'bookmark' | 'task'; content: string; id?: string }> = []
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        result.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }

      if (match[1]) {
        // [[entity]] format - try to find matching note or bookmark
        const entityName = match[1]
        const matchingNote = notes.find(n => n.title.toLowerCase().includes(entityName.toLowerCase()))
        const matchingBookmark = bookmarks.find(b => b.title.toLowerCase().includes(entityName.toLowerCase()))

        if (matchingNote) {
          result.push({ type: 'note', content: entityName, id: matchingNote.id })
        } else if (matchingBookmark) {
          result.push({ type: 'bookmark', content: entityName, id: matchingBookmark.id })
        } else {
          result.push({ type: 'text', content: `[[${entityName}]]` })
        }
      } else if (match[2]) {
        // [T:taskId] format
        result.push({ type: 'task', content: match[2], id: match[2] })
      } else if (match[3]) {
        // [B:bookmarkId] format
        const bookmarkId = match[3]
        const bookmark = bookmarks.find(b => b.id === bookmarkId)
        result.push({ type: 'bookmark', content: bookmark?.title || bookmarkId, id: bookmarkId })
      } else if (match[4]) {
        // [N:noteId] format
        const noteId = match[4]
        const note = notes.find(n => n.id === noteId)
        result.push({ type: 'note', content: note?.title || noteId, id: noteId })
      }

      lastIndex = match.index + match[0].length
    }

    // Add remaining text
    if (lastIndex < text.length) {
      result.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return result
  }, [text, notes, bookmarks])

  // Also show linked bookmarks if any
  const linkedBookmarks = useMemo(() => {
    if (!linkedBookmarkIds || linkedBookmarkIds.length === 0) return []
    return bookmarks.filter(b => linkedBookmarkIds.includes(b.id))
  }, [linkedBookmarkIds, bookmarks])

  const handleClick = (type: 'note' | 'bookmark' | 'task', id?: string) => {
    if (!id) return
    if (type === 'note') {
      setActiveModule('notes')
      useNoteStore.getState().setActiveNote(id)
    } else if (type === 'bookmark') {
      setActiveModule('bookmarks')
    }
    // task type - already in tasks, could scroll to task
  }

  return (
    <div className="text-sm text-np-text-secondary py-2 border-b border-np-border mb-2">
      {/* Parsed description with links */}
      <p>
        {parts.map((part, i) => {
          if (part.type === 'text') {
            return <span key={i}>{part.content}</span>
          }
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                handleClick(part.type as 'note' | 'bookmark' | 'task', part.id)
              }}
              className={`inline-flex items-center gap-0.5 px-1 rounded hover:underline ${
                part.type === 'note' ? 'text-np-green bg-np-green/10' :
                part.type === 'bookmark' ? 'text-np-cyan bg-np-cyan/10' :
                'text-np-orange bg-np-orange/10'
              }`}
            >
              {part.type === 'note' && '📝'}
              {part.type === 'bookmark' && '🔗'}
              {part.type === 'task' && '✓'}
              {part.content}
            </button>
          )
        })}
      </p>

      {/* Show linked bookmarks */}
      {linkedBookmarks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-np-border/50">
          <div className="text-xs text-np-text-secondary mb-1">🔗 Linked Resources:</div>
          <div className="flex flex-wrap gap-1">
            {linkedBookmarks.map((bookmark) => (
              <a
                key={bookmark.id}
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-0.5 bg-np-cyan/10 text-np-cyan rounded hover:bg-np-cyan/20 truncate max-w-[200px]"
                title={bookmark.url}
              >
                {bookmark.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
