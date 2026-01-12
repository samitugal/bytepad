import { useState, useEffect } from 'react'
import { useTaskStore, getFilteredTasks } from '../../stores/taskStore'
import { DateTimePicker, ConfirmModal } from '../common'
import { useTranslation } from '../../i18n'
import type { Task } from '../../types'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const
const PRIORITY_COLORS = {
  P1: 'text-np-error',
  P2: 'text-np-orange',
  P3: 'text-np-blue',
  P4: 'text-np-text-secondary',
}

export function TasksModule() {
  const { t } = useTranslation()
  const store = useTaskStore()
  const { addTask, deleteTask, toggleTask, updateTask, addSubtask, toggleSubtask, deleteSubtask, filter, setFilter, sortBy, setSortBy, reorderTasks } = store
  const allTasks = store.tasks
  const filteredTasks = getFilteredTasks(store)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end - reorder tasks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = activeTasks.findIndex(t => t.id === active.id)
      const newIndex = activeTasks.findIndex(t => t.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedTasks = arrayMove(activeTasks, oldIndex, newIndex)
        const taskIds = reorderedTasks.map(t => t.id)
        reorderTasks(taskIds)
      }
    }
  }

  // Separate active and completed tasks
  const activeTasks = filteredTasks.filter(t => !t.completed)
  const completedTasks = allTasks.filter(t => t.completed).sort((a, b) =>
    new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime()
  )

  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    priority: 'P2' as Task['priority'],
    description: '',
    startDate: '',
    startTime: '',
    deadline: '',
    deadlineTime: '',
    reminderEnabled: false,
    reminderMinutesBefore: 30
  })
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [showDoneSection, setShowDoneSection] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; taskId: string | null; title: string }>({
    isOpen: false,
    taskId: null,
    title: ''
  })
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskForm, setEditTaskForm] = useState<{
    title: string
    priority: Task['priority']
    description: string
    startDate: string
    startTime: string
    deadline: string
    deadlineTime: string
    reminderEnabled: boolean
    reminderMinutesBefore: number
  } | null>(null)

  // Auto-complete parent task when all subtasks are done
  useEffect(() => {
    allTasks.forEach(task => {
      if (!task.completed && task.subtasks.length > 0) {
        const allSubtasksDone = task.subtasks.every(s => s.completed)
        if (allSubtasksDone) {
          toggleTask(task.id)
        }
      }
    })
  }, [allTasks, toggleTask])


  const handleAdd = () => {
    if (!newTask.title.trim()) return
    addTask({
      title: newTask.title,
      priority: newTask.priority,
      description: newTask.description,
      startDate: newTask.startDate ? new Date(newTask.startDate) : undefined,
      startTime: newTask.startTime || undefined,
      deadline: newTask.deadline ? new Date(newTask.deadline) : undefined,
      deadlineTime: newTask.deadlineTime || undefined,
      reminderEnabled: newTask.reminderEnabled,
      reminderMinutesBefore: newTask.reminderMinutesBefore,
    })
    setNewTask({ title: '', priority: 'P2', description: '', startDate: '', startTime: '', deadline: '', deadlineTime: '', reminderEnabled: false, reminderMinutesBefore: 30 })
    setShowForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') setShowForm(false)
  }

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskTitle.trim()) return
    addSubtask(taskId, newSubtaskTitle.trim())
    setNewSubtaskTitle('')
  }

  const handleDeleteTask = (taskId: string, title: string) => {
    setDeleteConfirm({ isOpen: true, taskId, title })
  }

  const confirmDeleteTask = () => {
    if (deleteConfirm.taskId) {
      deleteTask(deleteConfirm.taskId)
    }
    setDeleteConfirm({ isOpen: false, taskId: null, title: '' })
  }

  const openEditTaskModal = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    setEditingTaskId(taskId)
    setEditTaskForm({
      title: task.title,
      priority: task.priority,
      description: task.description || '',
      startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '',
      startTime: task.startTime || '',
      deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
      deadlineTime: task.deadlineTime || '',
      reminderEnabled: task.reminderEnabled || false,
      reminderMinutesBefore: task.reminderMinutesBefore || 30
    })
  }

  const handleSaveTaskEdit = () => {
    if (!editingTaskId || !editTaskForm) return
    updateTask(editingTaskId, {
      title: editTaskForm.title,
      priority: editTaskForm.priority,
      description: editTaskForm.description || undefined,
      startDate: editTaskForm.startDate ? new Date(editTaskForm.startDate) : undefined,
      startTime: editTaskForm.startTime || undefined,
      deadline: editTaskForm.deadline ? new Date(editTaskForm.deadline) : undefined,
      deadlineTime: editTaskForm.deadlineTime || undefined,
      reminderEnabled: editTaskForm.reminderEnabled,
      reminderMinutesBefore: editTaskForm.reminderMinutesBefore
    })
    setEditingTaskId(null)
    setEditTaskForm(null)
  }

  const handleCancelTaskEdit = () => {
    setEditingTaskId(null)
    setEditTaskForm(null)
  }

  const pendingCount = activeTasks.length
  const doneCount = completedTasks.length

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>{t('tasks.title')}
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {pendingCount === 1
              ? t('tasks.pendingCount', { count: pendingCount })
              : t('tasks.pendingCountPlural', { count: pendingCount })}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="np-btn">
          <span className="text-np-green">+</span> {t('tasks.newTask')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary">{t('tasks.filter')}:</span>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 ${filter === f ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {t(`tasks.${f}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary">{t('tasks.sort')}:</span>
          {(['priority', 'deadline', 'created', 'manual'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-0.5 ${sortBy === s ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {s === 'manual' ? (t('tasks.manual') || 'Manual') : t(`tasks.${s}`)}
            </button>
          ))}
        </div>
      </div>

      {/* New task form */}
      {showForm && (
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
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
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
            <button onClick={handleAdd} className="np-btn text-np-green">{t('tasks.add')}</button>
            <button onClick={() => setShowForm(false)} className="np-btn">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {/* Active Tasks list */}
      <div className="flex-1 overflow-y-auto">
        {activeTasks.length === 0 && filter !== 'completed' ? (
          <div className="text-center text-np-text-secondary py-8">
            <div className="text-np-green mb-2">// {t('tasks.noActiveTasks')}</div>
            <div className="text-sm">
              {t('tasks.createFirst')}
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {activeTasks.map((task) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    isExpanded={expandedTask === task.id}
                    onToggleExpand={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    onToggleTask={toggleTask}
                    onEditTask={openEditTaskModal}
                    onDeleteTask={handleDeleteTask}
                    onToggleSubtask={toggleSubtask}
                    onDeleteSubtask={deleteSubtask}
                    onAddSubtask={handleAddSubtask}
                    onUpdateTask={updateTask}
                    newSubtaskTitle={newSubtaskTitle}
                    setNewSubtaskTitle={setNewSubtaskTitle}
                    t={t}
                    isDraggable={sortBy === 'manual'}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Done Section */}
        {completedTasks.length > 0 && (
          <div className="mt-6 border-t border-np-border pt-4">
            <button
              onClick={() => setShowDoneSection(!showDoneSection)}
              className="flex items-center gap-2 text-sm text-np-text-secondary hover:text-np-text-primary mb-2"
            >
              <span>{showDoneSection ? '▼' : '▶'}</span>
              <span className="text-np-green">// {t('tasks.done')}</span>
              <span className="text-xs bg-np-green/20 text-np-green px-2 py-0.5 rounded">
                {doneCount}
              </span>
            </button>

            {showDoneSection && (
              <div className="space-y-1 opacity-60">
                {completedTasks.slice(0, 10).map((task) => (
                  <div
                    key={task.id}
                    className="p-2 flex items-center gap-3 bg-np-bg-tertiary/50 border border-np-border/50"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
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
                      onClick={() => openEditTaskModal(task.id)}
                      className="text-np-text-secondary hover:text-np-blue text-sm px-1"
                      title="Edit task"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id, task.title)}
                      className="text-np-text-secondary hover:text-np-error text-sm px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {completedTasks.length > 10 && (
                  <div className="text-xs text-np-text-secondary text-center py-2">
                    {t('tasks.moreCompleted', { count: completedTasks.length - 10 })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTaskId && editTaskForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCancelTaskEdit}
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

            {/* Description */}
            <div className="mb-3">
              <label className="text-xs text-np-text-secondary block mb-1">{t('tasks.descriptionOptional')}</label>
              <textarea
                value={editTaskForm.description}
                onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
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
              <button onClick={handleCancelTaskEdit} className="np-btn">{t('common.cancel')}</button>
              <button onClick={handleSaveTaskEdit} className="np-btn text-np-green">{t('tasks.save') || 'Save'}</button>
            </div>
          </div>
        </>
      )}

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Click</kbd> {t('tasks.clickExpand')}</span>
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Enter</kbd> {t('tasks.enterAddSubtask')}</span>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title={`// ${t('confirm.deleteTask')}`}
        message={`${t('confirm.deleteTaskMessage', { title: deleteConfirm.title })}\n\n${t('confirm.subtasksWarning')}`}
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        confirmVariant="danger"
        onConfirm={confirmDeleteTask}
        onCancel={() => setDeleteConfirm({ isOpen: false, taskId: null, title: '' })}
      />
    </div>
  )
}

// Sortable Task Item Component
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

function SortableTaskItem({
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
          {/* Description */}
          {task.description && (
            <p className="text-sm text-np-text-secondary py-2 border-b border-np-border mb-2">
              {task.description}
            </p>
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
