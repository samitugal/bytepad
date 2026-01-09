import { useState } from 'react'
import { useTaskStore, getFilteredTasks } from '../../stores/taskStore'
import type { Task } from '../../types'

const PRIORITIES = ['P1', 'P2', 'P3', 'P4'] as const
const PRIORITY_COLORS = {
  P1: 'text-np-error',
  P2: 'text-np-orange',
  P3: 'text-np-blue',
  P4: 'text-np-text-secondary',
}

export function TasksModule() {
  const store = useTaskStore()
  const { addTask, deleteTask, toggleTask, updateTask, filter, setFilter, sortBy, setSortBy } = store
  const tasks = getFilteredTasks(store)

  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState({ 
    title: '', 
    priority: 'P2' as Task['priority'], 
    description: '',
    deadline: '',
    deadlineTime: '',
    reminderEnabled: false,
    reminderMinutesBefore: 30
  })
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const handleAdd = () => {
    if (!newTask.title.trim()) return
    addTask({
      title: newTask.title,
      priority: newTask.priority,
      description: newTask.description,
      deadline: newTask.deadline ? new Date(newTask.deadline) : undefined,
      deadlineTime: newTask.deadlineTime || undefined,
      reminderEnabled: newTask.reminderEnabled,
      reminderMinutesBefore: newTask.reminderMinutesBefore,
    })
    setNewTask({ title: '', priority: 'P2', description: '', deadline: '', deadlineTime: '', reminderEnabled: false, reminderMinutesBefore: 30 })
    setShowForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') setShowForm(false)
  }

  const pendingCount = store.tasks.filter(t => !t.completed).length

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>Tasks
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {pendingCount} pending task{pendingCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="np-btn">
          <span className="text-np-green">+</span> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary">Filter:</span>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 ${filter === f ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-np-text-secondary">Sort:</span>
          {(['priority', 'deadline', 'created'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-0.5 ${sortBy === s ? 'bg-np-selection text-np-text-primary' : 'text-np-text-secondary hover:text-np-text-primary'}`}
            >
              {s}
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
              placeholder="Task title..."
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
            placeholder="Description (optional)..."
            className="w-full np-input mb-2 h-16 resize-none"
          />
          {/* Deadline with time */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-np-text-secondary">Deadline:</span>
            <input
              type="date"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              className="np-input text-sm"
            />
            <input
              type="time"
              value={newTask.deadlineTime}
              onChange={(e) => setNewTask({ ...newTask, deadlineTime: e.target.value })}
              className="np-input text-sm"
              placeholder="Time"
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
              <span>🔔 Remind me</span>
            </label>
            {newTask.reminderEnabled && (
              <select
                value={newTask.reminderMinutesBefore}
                onChange={(e) => setNewTask({ ...newTask, reminderMinutesBefore: Number(e.target.value) })}
                className="np-input text-sm"
              >
                <option value={15}>15 min before</option>
                <option value={30}>30 min before</option>
                <option value={60}>1 hour before</option>
                <option value={120}>2 hours before</option>
                <option value={1440}>1 day before</option>
              </select>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="np-btn text-np-green">Add</button>
            <button onClick={() => setShowForm(false)} className="np-btn">Cancel</button>
          </div>
        </div>
      )}

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="text-center text-np-text-secondary py-8">
            <div className="text-np-green mb-2">// No tasks</div>
            <div className="text-sm">
              {filter === 'all' ? (
                <>
                  <span className="text-np-purple">Create</span> your first task
                </>
              ) : (
                <>No {filter} tasks found</>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isExpanded = expandedTask === task.id
              const completedSubtasks = task.subtasks.filter(s => s.completed).length

              return (
                <div
                  key={task.id}
                  className={`border border-np-border transition-colors
                    ${task.completed ? 'bg-np-bg-tertiary/50 opacity-60' : 'bg-np-bg-secondary'}`}
                >
                  {/* Main row */}
                  <div className="p-3 flex items-center gap-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 border flex items-center justify-center text-sm transition-colors
                        ${task.completed
                          ? 'bg-np-green border-np-green text-np-bg-primary'
                          : 'border-np-text-secondary hover:border-np-green'
                        }`}
                    >
                      {task.completed && '✓'}
                    </button>

                    {/* Priority badge */}
                    <span className={`text-xs font-bold ${PRIORITY_COLORS[task.priority]}`}>
                      [{task.priority}]
                    </span>

                    {/* Title */}
                    <span
                      className={`flex-1 ${task.completed ? 'line-through text-np-text-secondary' : 'text-np-text-primary'}`}
                      onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                    >
                      {task.title}
                    </span>

                    {/* Subtask count */}
                    {task.subtasks.length > 0 && (
                      <span className="text-xs text-np-text-secondary">
                        {completedSubtasks}/{task.subtasks.length}
                      </span>
                    )}

                    {/* Deadline with time */}
                    {task.deadline && (
                      <span className="text-xs text-np-orange">
                        {new Date(task.deadline).toLocaleDateString()}
                        {task.deadlineTime && ` ${task.deadlineTime}`}
                      </span>
                    )}
                    
                    {/* Reminder indicator */}
                    {task.reminderEnabled && (
                      <span className="text-xs text-np-cyan">🔔</span>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-np-text-secondary hover:text-np-error text-sm px-2"
                    >
                      ×
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-0 border-t border-np-border mt-0">
                      {task.description && (
                        <p className="text-sm text-np-text-secondary mb-2 mt-2">{task.description}</p>
                      )}
                      {/* Subtasks would go here */}
                      <div className="flex gap-2 mt-2">
                        <input
                          type="date"
                          value={task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : ''}
                          onChange={(e) => updateTask(task.id, { deadline: e.target.value ? new Date(e.target.value) : undefined })}
                          className="np-input text-xs"
                        />
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
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
      </div>

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Space</kbd> toggle</span>
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Click</kbd> expand</span>
        <span><kbd className="bg-np-bg-tertiary px-1">1-4</kbd> set priority</span>
      </div>
    </div>
  )
}
