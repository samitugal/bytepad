import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit } from '../types'
import { useGamificationStore, XP_VALUES } from './gamificationStore'

// Cross-tab sync channel
const syncChannel = new BroadcastChannel('myflowspace-habits')

interface HabitStats {
  date: string
  completed: number
  total: number
  completionRate: number
}

interface HabitState {
  habits: Habit[]
  dailyStats: HabitStats[]
  addHabit: (habit: Omit<Habit, 'id' | 'completions' | 'streak' | 'createdAt'>) => string
  updateHabit: (id: string, updates: Partial<Habit>) => void
  deleteHabit: (id: string) => void
  toggleCompletion: (id: string, date: string) => void
  getCompletedToday: () => number
  getTotalHabits: () => number
  recordDailyStats: () => void
  getWeeklyStats: () => HabitStats[]
  getMonthlyStats: () => HabitStats[]
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
      dailyStats: [],

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
        const habit = get().habits.find(h => h.id === id)
        const wasCompleted = habit?.completions[date] || false

        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h
            const newCompletions = { ...h.completions }
            newCompletions[date] = !newCompletions[date]
            return {
              ...h,
              completions: newCompletions,
              streak: calculateStreak(newCompletions),
            }
          }),
        }))

        // Award XP for habit completion (not for un-completing)
        const today = getToday()
        if (!wasCompleted && date === today) {
          const gamification = useGamificationStore.getState()
          gamification.addXP(XP_VALUES.habitComplete, 'habitComplete')
          gamification.incrementStat('habitsCompleted')
          gamification.incrementStat('habitsCompletedToday')

          // Check for "Perfect Day" achievement
          const { habits } = get()
          const allCompleted = habits.every(h => h.completions[today])
          if (allCompleted && habits.length > 0) {
            gamification.incrementStat('perfectDays')
          }
        }
      },

      getCompletedToday: () => {
        const today = getToday()
        return get().habits.filter(h => h.completions[today]).length
      },

      getTotalHabits: () => get().habits.length,

      recordDailyStats: () => {
        const today = getToday()
        const { habits, dailyStats } = get()
        
        // Check if already recorded today
        if (dailyStats.some(s => s.date === today)) return
        
        const completed = habits.filter(h => h.completions[today]).length
        const total = habits.length
        
        if (total === 0) return
        
        const newStats: HabitStats = {
          date: today,
          completed,
          total,
          completionRate: Math.round((completed / total) * 100),
        }
        
        set((state) => ({
          dailyStats: [...state.dailyStats.slice(-90), newStats], // Keep last 90 days
        }))
      },

      getWeeklyStats: () => {
        const { dailyStats } = get()
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split('T')[0]
        
        return dailyStats.filter(s => s.date >= weekAgoStr)
      },

      getMonthlyStats: () => {
        const { dailyStats } = get()
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        const monthAgoStr = monthAgo.toISOString().split('T')[0]
        
        return dailyStats.filter(s => s.date >= monthAgoStr)
      },
    }),
    {
      name: 'myflowspace-habits',
      partialize: (state) => ({ habits: state.habits, dailyStats: state.dailyStats }),
    }
  )
)

// Cross-tab synchronization
syncChannel.onmessage = (event) => {
  if (event.data?.type === 'SYNC') {
    useHabitStore.setState({ 
      habits: event.data.habits,
      dailyStats: event.data.dailyStats 
    })
  }
}

useHabitStore.subscribe((state) => {
  syncChannel.postMessage({ 
    type: 'SYNC', 
    habits: state.habits,
    dailyStats: state.dailyStats 
  })
})
