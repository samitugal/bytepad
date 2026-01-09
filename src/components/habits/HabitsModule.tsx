import { useState } from 'react'
import { useHabitStore } from '../../stores/habitStore'

const CATEGORIES = ['health', 'work', 'personal', 'learning']

const getToday = () => new Date().toISOString().split('T')[0]

export function HabitsModule() {
  const { habits, addHabit, deleteHabit, toggleCompletion, updateHabit } = useHabitStore()
  const [showForm, setShowForm] = useState(false)
  const [newHabit, setNewHabit] = useState({ 
    name: '', 
    category: 'personal', 
    frequency: 'daily' as const,
    reminderEnabled: false,
    reminderTime: '09:00'
  })
  const [editingId, setEditingId] = useState<string | null>(null)

  const today = getToday()

  const handleAdd = () => {
    if (!newHabit.name.trim()) return
    addHabit(newHabit)
    setNewHabit({ name: '', category: 'personal', frequency: 'daily', reminderEnabled: false, reminderTime: '09:00' })
    setShowForm(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') setShowForm(false)
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
              <input
                type="time"
                value={newHabit.reminderTime}
                onChange={(e) => setNewHabit({ ...newHabit, reminderTime: e.target.value })}
                className="np-input text-sm"
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
              const isEditing = editingId === habit.id

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
                    {isEditing ? (
                      <input
                        type="text"
                        value={habit.name}
                        onChange={(e) => updateHabit(habit.id, { name: e.target.value })}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                        className="bg-transparent border-none text-np-text-primary focus:outline-none w-full"
                        autoFocus
                      />
                    ) : (
                      <span
                        className={`${isCompleted ? 'text-np-green line-through' : 'text-np-text-primary'}`}
                        onDoubleClick={() => setEditingId(habit.id)}
                      >
                        {habit.name}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-np-text-secondary">
                      <span className="text-np-purple">#{habit.category}</span>
                      {habit.streak > 0 && (
                        <span className="text-np-orange">🔥 {habit.streak} day streak</span>
                      )}
                      {habit.reminderEnabled && habit.reminderTime && (
                        <span className="text-np-cyan">🔔 {habit.reminderTime}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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

      {/* Keyboard hints */}
      <div className="mt-4 pt-3 border-t border-np-border text-xs text-np-text-secondary">
        <span className="mr-4"><kbd className="bg-np-bg-tertiary px-1">Space</kbd> toggle</span>
        <span><kbd className="bg-np-bg-tertiary px-1">Double-click</kbd> edit</span>
      </div>
    </div>
  )
}
