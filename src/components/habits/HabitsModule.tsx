import { useState, useEffect } from 'react'
import { useHabitStore } from '../../stores/habitStore'
import { DateTimePicker } from '../common'

const CATEGORIES = ['health', 'work', 'personal', 'learning']

const getToday = () => new Date().toISOString().split('T')[0]

interface EditHabitForm {
  name: string
  category: string
  frequency: 'daily' | 'weekly'
  tags: string
  reminderEnabled: boolean
  reminderTime: string
}

export function HabitsModule() {
  const { habits, addHabit, deleteHabit, toggleCompletion, updateHabit, getWeeklyStats, recordDailyStats } = useHabitStore()
  const [showForm, setShowForm] = useState(false)
  const [showStats, setShowStats] = useState(false)

  // Record daily stats at end of day (or when component mounts after midnight)
  useEffect(() => {
    recordDailyStats()
  }, [])
  const [newHabit, setNewHabit] = useState({
    name: '',
    category: 'personal',
    frequency: 'daily' as const,
    tags: '' as string, // comma-separated tags input
    reminderEnabled: false,
    reminderTime: '09:00'
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditHabitForm | null>(null)

  const today = getToday()

  const handleAdd = () => {
    if (!newHabit.name.trim()) return
    const tags = newHabit.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    addHabit({
      name: newHabit.name,
      category: newHabit.category,
      frequency: newHabit.frequency,
      tags: tags.length > 0 ? tags : undefined,
      reminderEnabled: newHabit.reminderEnabled,
      reminderTime: newHabit.reminderTime
    })
    setNewHabit({ name: '', category: 'personal', frequency: 'daily', tags: '', reminderEnabled: false, reminderTime: '09:00' })
    setShowForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setShowForm(false)
  }

  const openEditModal = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return
    setEditingId(habitId)
    setEditForm({
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency || 'daily',
      tags: habit.tags?.join(', ') || '',
      reminderEnabled: habit.reminderEnabled || false,
      reminderTime: habit.reminderTime || '09:00'
    })
  }

  const handleSaveEdit = () => {
    if (!editingId || !editForm) return
    const tags = editForm.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0)
    updateHabit(editingId, {
      name: editForm.name,
      category: editForm.category,
      frequency: editForm.frequency,
      tags: tags.length > 0 ? tags : undefined,
      reminderEnabled: editForm.reminderEnabled,
      reminderTime: editForm.reminderTime
    })
    setEditingId(null)
    setEditForm(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditForm(null)
  }

  const completedToday = habits.filter(h => h.completions[today]).length

  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg text-np-text-primary">
            <span className="text-np-green">// </span>Daily Habits
          </h2>
          <p className="text-sm text-np-text-secondary mt-1">
            {completedToday}/{habits.length} completed today
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="np-btn">
          <span className="text-np-green">+</span> New Habit
        </button>
      </div>

      {/* New habit form */}
      {showForm && (
        <div className="mb-4 p-3 bg-np-bg-secondary border border-np-border">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newHabit.name}
              onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Habit name..."
              className="flex-1 np-input"
              autoFocus
            />
            <select
              value={newHabit.category}
              onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
              className="np-input"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {/* Tags input */}
          <div className="mb-2">
            <input
              type="text"
              value={newHabit.tags}
              onChange={(e) => setNewHabit({ ...newHabit, tags: e.target.value })}
              placeholder="Tags (comma separated)..."
              className="w-full np-input text-sm"
            />
          </div>
          {/* Reminder settings */}
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-2 text-sm text-np-text-secondary">
              <input
                type="checkbox"
                checked={newHabit.reminderEnabled}
                onChange={(e) => setNewHabit({ ...newHabit, reminderEnabled: e.target.checked })}
                className="w-4 h-4"
              />
              <span>🔔 Daily reminder</span>
            </label>
            {newHabit.reminderEnabled && (
              <DateTimePicker
                type="time"
                value={newHabit.reminderTime}
                onChange={(val) => setNewHabit({ ...newHabit, reminderTime: val })}
              />
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="np-btn text-np-green">Add</button>
            <button onClick={() => setShowForm(false)} className="np-btn">Cancel</button>
          </div>
        </div>
      )}

      {/* Habits list */}
      <div className="flex-1 overflow-y-auto">
        {habits.length === 0 ? (
          <div className="text-center text-np-text-secondary py-8">
            <div className="text-np-green mb-2">// No habits yet</div>
            <div className="text-sm">
              <span className="text-np-purple">Create</span> your first habit to start tracking
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => {
              const isCompleted = habit.completions[today]

              return (
                <div
                  key={habit.id}
                  className={`p-3 border border-np-border flex items-center gap-3 transition-colors
                    ${isCompleted ? 'bg-np-green/10 border-np-green/30' : 'bg-np-bg-secondary'}`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleCompletion(habit.id, today)}
                    className={`w-5 h-5 border flex items-center justify-center text-sm transition-colors
                      ${isCompleted
                        ? 'bg-np-green border-np-green text-np-bg-primary'
                        : 'border-np-text-secondary hover:border-np-green'
                      }`}
                  >
                    {isCompleted && '✓'}
                  </button>

                  {/* Content */}
                  <div className="flex-1">
                    <span
                      className={`${isCompleted ? 'text-np-green line-through' : 'text-np-text-primary'} cursor-pointer`}
                      onDoubleClick={() => openEditModal(habit.id)}
                    >
                      {habit.name}
                    </span>
                    <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-np-text-secondary">
                      <span className="text-np-purple">#{habit.category}</span>
                      {habit.tags && habit.tags.length > 0 && habit.tags.map((tag, idx) => (
                        <span key={idx} className="text-np-cyan">#{tag}</span>
                      ))}
                      {habit.streak > 0 && (
                        <span className="text-np-orange">🔥 {habit.streak} day streak</span>
                      )}
                      {habit.reminderEnabled && habit.reminderTime && (
                        <span className="text-np-blue">🔔 {habit.reminderTime}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => openEditModal(habit.id)}
                    className="text-np-text-secondary hover:text-np-blue text-sm px-1"
                    title="Edit habit"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-np-text-secondary hover:text-np-error text-sm px-2"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Habit Modal */}
      {editingId && editForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleCancelEdit}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-np-bg-primary border border-np-border shadow-xl z-50 p-4">
            <h3 className="text-np-green mb-4">// Edit Habit</h3>

            {/* Name */}
            <div className="mb-3">
              <label className="text-xs text-np-text-secondary block mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full np-input"
                autoFocus
              />
            </div>

            {/* Category */}
            <div className="mb-3">
              <label className="text-xs text-np-text-secondary block mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                className="w-full np-input"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Frequency */}
            <div className="mb-3">
              <label className="text-xs text-np-text-secondary block mb-1">Frequency</label>
              <select
                value={editForm.frequency}
                onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value as 'daily' | 'weekly' })}
                className="w-full np-input"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <label className="text-xs text-np-text-secondary block mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                placeholder="health, morning, exercise..."
                className="w-full np-input"
              />
            </div>

            {/* Reminder */}
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm text-np-text-secondary mb-2">
                <input
                  type="checkbox"
                  checked={editForm.reminderEnabled}
                  onChange={(e) => setEditForm({ ...editForm, reminderEnabled: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>🔔 Daily reminder</span>
              </label>
              {editForm.reminderEnabled && (
                <DateTimePicker
                  type="time"
                  value={editForm.reminderTime}
                  onChange={(val) => setEditForm({ ...editForm, reminderTime: val })}
                />
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end border-t border-np-border pt-3">
              <button onClick={handleCancelEdit} className="np-btn">Cancel</button>
              <button onClick={handleSaveEdit} className="np-btn text-np-green">Save</button>
            </div>
          </div>
        </>
      )}

      {/* Weekly Stats Toggle */}
      <button
        onClick={() => setShowStats(!showStats)}
        className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary w-full text-left hover:text-np-text-primary"
      >
        {showStats ? '▼' : '▶'} Weekly Stats
      </button>

      {/* Weekly Stats Panel */}
      {showStats && (
        <div className="mt-2 p-3 bg-np-bg-secondary border border-np-border">
          <div className="text-sm text-np-green mb-2">// Last 7 Days</div>
          {getWeeklyStats().length === 0 ? (
            <div className="text-xs text-np-text-secondary">No data yet. Complete habits to see stats.</div>
          ) : (
            <div className="space-y-1">
              {getWeeklyStats().map((stat) => (
                <div key={stat.date} className="flex items-center gap-2 text-xs">
                  <span className="text-np-text-secondary w-20">{stat.date}</span>
                  <div className="flex-1 h-2 bg-np-bg-tertiary rounded overflow-hidden">
                    <div
                      className="h-full bg-np-green transition-all"
                      style={{ width: `${stat.completionRate}%` }}
                    />
                  </div>
                  <span className={`w-16 text-right ${stat.completionRate === 100 ? 'text-np-green' : 'text-np-text-secondary'}`}>
                    {stat.completed}/{stat.total} ({stat.completionRate}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Space</kbd> toggle</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Double-click</kbd> edit</span>
      </div>
    </div>
  )
}
