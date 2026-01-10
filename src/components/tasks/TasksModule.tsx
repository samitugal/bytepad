import { useState, useEffect } from 'react'
import { useTaskStore, getFilteredTasks } from '../../stores/taskStore'
import { DateTimePicker, ConfirmModal } from '../common'
import { useTranslation } from '../../i18n'
import type { Task } from '../../types'

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
  const { addTask, deleteTask, toggleTask, updateTask, addSubtask, toggleSubtask, deleteSubtask, filter, setFilter, sortBy, setSortBy } = store
  const allTasks = store.tasks
  const filteredTasks = getFilteredTasks(store)

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
          {(['priority', 'deadline', 'created'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-0.5 ${sortBy === s ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {t(`tasks.${s}`)}
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
          <div className="space-y-2">
            {activeTasks.map((task) => {
              const isExpanded = expandedTask === task.id
              const completedSubtasks = task.subtasks.filter(s => s.completed).length

              return (
                <div
                  key={task.id}
                  className="border border-np-border bg-np-bg-secondary transition-colors"
                >
                  {/* Main row */}
                  <div
                    className="p-3 flex items-center gap-3 cursor-pointer hover:bg-np-bg-hover"
                    onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleTask(task.id)
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
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        completedSubtasks === task.subtasks.length
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

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteTask(task.id, task.title)
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
                                onClick={() => toggleSubtask(task.id, subtask.id)}
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
                                onClick={() => deleteSubtask(task.id, subtask.id)}
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
                              handleAddSubtask(task.id)
                            }
                          }}
                          placeholder={t('tasks.addSubtask')}
                          className="flex-1 np-input text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddSubtask(task.id)
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
                          onChange={(e) => updateTask(task.id, { deadline: e.target.value ? new Date(e.target.value) : undefined })}
                          onClick={(e) => e.stopPropagation()}
                          className="np-input text-xs"
                        />
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
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
            })}
          </div>
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
