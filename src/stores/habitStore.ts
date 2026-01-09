import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit } from '../types'

interface HabitState {
  habits: Habit[]
  addHabit: (habit: Omit<Habit, 'id' | 'completions' | 'streak' | 'createdAt'>) => string
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleCompletion: (id: string, date: string) => void
  getCompletedToday: () => number
  getTotalHabits: () => number
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const getToday = () => new Date().toISOString().split('T')[0]

const calculateStreak = (completions: Record<string, boolean>): number => {
  const dates = Object.keys(completions)
    .filter(d => completions[d])
    .sort()
    .reverse()

  if (dates.length === 0) return 0

  let streak = 0
  const today = new Date()
  const checkDate = new Date(today)

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split('T')[0]
    if (completions[dateStr]) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else if (i === 0) {
      // Today not completed yet, check from yesterday
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],

      addHabit: (habitData) => {
        const id = generateId()
        const habit: Habit = {
          ...habitData,
          id,
          completions: {},
          streak: 0,
          createdAt: new Date(),
        }
        set((state) => ({
          habits: [...state.habits, habit],
        }))
        return id
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((habit) =>
            habit.id === id ? { ...habit, ...updates } : habit
          ),
        }))
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((habit) => habit.id !== id),
        }))
      },

      toggleCompletion: (id, date) => {
        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit
            const newCompletions = { ...habit.completions }
            newCompletions[date] = !newCompletions[date]
            return {
              ...habit,
              completions: newCompletions,
              streak: calculateStreak(newCompletions),
            }
          }),
        }))
      },

      getCompletedToday: () => {
        const today = getToday()
        return get().habits.filter(h => h.completions[today]).length
      },

      getTotalHabits: () => get().habits.length,
    }),
    {
      name: 'myflowspace-habits',
      partialize: (state) => ({ habits: state.habits }),
    }
  )
)
