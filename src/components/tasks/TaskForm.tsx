import { KeyboardEvent } from 'react'
import { DateTimePicker } from '../common'
import { EntityLinkInput } from '../common/EntityLinkInput'
import { LinkedResourcesEditor } from '../common/LinkedResourcesEditor'
import type { Task } from '../../types'

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const

interface NewTaskFormProps {
  newTask: {
    title: string
    priority: Task['priority']
    description: string
    startDate: string
    startTime: string
    deadline: string
    deadlineTime: string
    reminderEnabled: boolean
    reminderMinutesBefore: number
    linkedBookmarkIds: string[]
  }
  setNewTask: (task: NewTaskFormProps['newTask']) => void
  bookmarkSearchQuery: string
  setBookmarkSearchQuery: (query: string) => void
  onAdd: () => void
  onCancel: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function NewTaskForm({
  newTask,
  setNewTask,
  bookmarkSearchQuery,
  setBookmarkSearchQuery,
  onAdd,
  onCancel,
  t
}: NewTaskFormProps) {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onAdd()
    }
    if (e.key === 'Escape') onCancel()
  }

  return (
    <div className="mb-4 p-3 bg-np-bg-secondary border border-np-border">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder={t('tasks.taskTitle')}
          className="flex-1 np-input"
          autoFocus
        />
        <select
          value={newTask.priority}
          onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
          className="np-input"
        >
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <EntityLinkInput
        value={newTask.description}
        onChange={(val) => setNewTask({ ...newTask, description: val })}
        placeholder={t('tasks.descriptionOptional')}
        className="w-full np-input mb-2 h-16 resize-none"
      />
      {/* Start Date with time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-np-text-secondary w-16">{t('tasks.start')}:</span>
        <DateTimePicker
          type="date"
          value={newTask.startDate}
          onChange={(val) => setNewTask({ ...newTask, startDate: val })}
          placeholder={t('tasks.startDate')}
        />
        <DateTimePicker
          type="time"
          value={newTask.startTime}
          onChange={(val) => setNewTask({ ...newTask, startTime: val })}
          placeholder={t('tasks.time')}
        />
      </div>
      {/* Deadline/End Date with time */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-np-text-secondary w-16">{t('tasks.end')}:</span>
        <DateTimePicker
          type="date"
          value={newTask.deadline}
          onChange={(val) => setNewTask({ ...newTask, deadline: val })}
          placeholder={t('tasks.endDate')}
        />
        <DateTimePicker
          type="time"
          value={newTask.deadlineTime}
          onChange={(val) => setNewTask({ ...newTask, deadlineTime: val })}
          placeholder={t('tasks.time')}
        />
      </div>
      {/* Linked Resources */}
      <LinkedResourcesEditor
        linkedBookmarkIds={newTask.linkedBookmarkIds}
        onChange={(ids) => setNewTask({ ...newTask, linkedBookmarkIds: ids })}
        searchQuery={bookmarkSearchQuery}
        onSearchChange={setBookmarkSearchQuery}
      />
      {/* Reminder settings */}
      <div className="flex items-center gap-3 mb-2">
        <label className="flex items-center gap-2 text-sm text-np-text-secondary">
          <input
            type="checkbox"
            checked={newTask.reminderEnabled}
            onChange={(e) => setNewTask({ ...newTask, reminderEnabled: e.target.checked })}
            className="w-4 h-4"
          />
          <span>🔔 {t('tasks.remindMe')}</span>
        </label>
        {newTask.reminderEnabled && (
          <select
            value={newTask.reminderMinutesBefore}
            onChange={(e) => setNewTask({ ...newTask, reminderMinutesBefore: Number(e.target.value) })}
            className="np-input text-sm"
          >
            <option value={15}>{t('tasks.minBefore', { min: 15 })}</option>
            <option value={30}>{t('tasks.minBefore', { min: 30 })}</option>
            <option value={60}>{t('tasks.hourBefore')}</option>
            <option value={120}>{t('tasks.hoursBefore', { hours: 2 })}</option>
            <option value={1440}>{t('tasks.dayBefore')}</option>
          </select>
        )}
      </div>
      <div className="flex gap-2">
        <button onClick={onAdd} className="np-btn text-np-green">{t('tasks.add')}</button>
        <button onClick={onCancel} className="np-btn">{t('common.cancel')}</button>
      </div>
    </div>
  )
}

// Edit Task Modal
interface EditTaskModalProps {
  editTaskForm: {
    title: string
    priority: Task['priority']
    description: string
    startDate: string
    startTime: string
    deadline: string
    deadlineTime: string
    reminderEnabled: boolean
    reminderMinutesBefore: number
    tags: string[]
    newTag: string
    linkedBookmarkIds: string[]
  }
  setEditTaskForm: (form: EditTaskModalProps['editTaskForm']) => void
  bookmarkSearchQuery: string
  setBookmarkSearchQuery: (query: string) => void
  onSave: () => void
  onCancel: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export function EditTaskModal({
  editTaskForm,
  setEditTaskForm,
  bookmarkSearchQuery,
  setBookmarkSearchQuery,
  onSave,
  onCancel,
  t
}: EditTaskModalProps) {
  const handleAddTag = () => {
    if (!editTaskForm.newTag.trim()) return
    const tag = editTaskForm.newTag.trim().toLowerCase().replace(/\s+/g, '-')
    if (!editTaskForm.tags.includes(tag)) {
      setEditTaskForm({ ...editTaskForm, tags: [...editTaskForm.tags, tag], newTag: '' })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTaskForm({ ...editTaskForm, tags: editTaskForm.tags.filter(t => t !== tagToRemove) })
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] bg-np-bg-primary border border-np-border shadow-xl z-50 p-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-np-green mb-4">// {t('tasks.editTask') || 'Edit Task'}</h3>

        {/* Title */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.taskTitle')}</label>
          <input
            type="text"
            value={editTaskForm.title}
            onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
            className="w-full np-input"
            autoFocus
          />
        </div>

        {/* Priority */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.priority')}</label>
          <select
            value={editTaskForm.priority}
            onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value as Task['priority'] })}
            className="w-full np-input"
          >
            {PRIORITIES.map(p => (
              <option key={p} value={p}>{p} - {p === 'P1' ? 'Critical' : p === 'P2' ? 'High' : p === 'P3' ? 'Medium' : 'Low'}</option>
            ))}
          </select>
        </div>

        {/* Description with autocomplete */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.descriptionOptional')}</label>
          <EntityLinkInput
            value={editTaskForm.description}
            onChange={(val) => setEditTaskForm({ ...editTaskForm, description: val })}
            className="w-full np-input h-20 resize-none"
            placeholder={t('tasks.descriptionOptional')}
          />
        </div>

        {/* Start Date & Time */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.start')}</label>
          <div className="flex gap-2">
            <DateTimePicker
              type="date"
              value={editTaskForm.startDate}
              onChange={(val) => setEditTaskForm({ ...editTaskForm, startDate: val })}
              placeholder={t('tasks.startDate')}
            />
            <DateTimePicker
              type="time"
              value={editTaskForm.startTime}
              onChange={(val) => setEditTaskForm({ ...editTaskForm, startTime: val })}
              placeholder={t('tasks.time')}
            />
          </div>
        </div>

        {/* Deadline & Time */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.end')}</label>
          <div className="flex gap-2">
            <DateTimePicker
              type="date"
              value={editTaskForm.deadline}
              onChange={(val) => setEditTaskForm({ ...editTaskForm, deadline: val })}
              placeholder={t('tasks.endDate')}
            />
            <DateTimePicker
              type="time"
              value={editTaskForm.deadlineTime}
              onChange={(val) => setEditTaskForm({ ...editTaskForm, deadlineTime: val })}
              placeholder={t('tasks.time')}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="text-xs text-np-text-secondary block mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {editTaskForm.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-np-purple/20 text-np-purple rounded"
              >
                #{tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-np-error ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={editTaskForm.newTag}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, newTag: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
              placeholder="Add tag..."
              className="flex-1 np-input text-sm"
            />
            <button
              onClick={handleAddTag}
              className="np-btn text-xs text-np-purple"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Linked Resources (Bookmarks) */}
        <LinkedResourcesEditor
          linkedBookmarkIds={editTaskForm.linkedBookmarkIds}
          onChange={(ids) => setEditTaskForm({ ...editTaskForm, linkedBookmarkIds: ids })}
          searchQuery={bookmarkSearchQuery}
          onSearchChange={setBookmarkSearchQuery}
        />

        {/* Reminder */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-np-text-secondary mb-2">
            <input
              type="checkbox"
              checked={editTaskForm.reminderEnabled}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, reminderEnabled: e.target.checked })}
              className="w-4 h-4"
            />
            <span>🔔 {t('tasks.remindMe')}</span>
          </label>
          {editTaskForm.reminderEnabled && (
            <select
              value={editTaskForm.reminderMinutesBefore}
              onChange={(e) => setEditTaskForm({ ...editTaskForm, reminderMinutesBefore: Number(e.target.value) })}
              className="np-input text-sm"
            >
              <option value={15}>{t('tasks.minBefore', { min: 15 })}</option>
              <option value={30}>{t('tasks.minBefore', { min: 30 })}</option>
              <option value={60}>{t('tasks.hourBefore')}</option>
              <option value={120}>{t('tasks.hoursBefore', { hours: 2 })}</option>
              <option value={1440}>{t('tasks.dayBefore')}</option>
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end border-t border-np-border pt-3">
          <button onClick={onCancel} className="np-btn">{t('common.cancel')}</button>
          <button onClick={onSave} className="np-btn text-np-green">{t('tasks.save') || 'Save'}</button>
        </div>
      </div>
    </>
  )
}
