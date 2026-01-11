import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface FocusSession {
  id: string
  taskId: string
  taskTitle: string
  startedAt: Date
  endedAt?: Date
  duration: number // seconds actually focused
  targetDuration: number // original timer duration in seconds
  completed: boolean // did user complete the full timer?
  interrupted: boolean // was session stopped early?
}

export interface FocusStats {
  totalSessions: number
  totalFocusTime: number // seconds
  todayFocusTime: number
  weekFocusTime: number
  averageSessionLength: number
  longestSession: number
  sessionsPerTask: Record<string, { taskTitle: string; totalTime: number; sessionCount: number }>
}

interface FocusState {
  sessions: FocusSession[]
  currentSession: FocusSession | null
  consecutiveSessions: number // for long break tracking
  focusStreak: number // consecutive days with focus sessions
  lastFocusDate: string | null // YYYY-MM-DD format

  // Actions
  startSession: (taskId: string, taskTitle: string, targetDuration: number) => void
  updateSessionDuration: (duration: number) => void
  endSession: (completed: boolean) => void
  cancelSession: () => void
  resetConsecutiveSessions: () => void

  // Stats
  getStats: () => FocusStats
  getTaskFocusTime: (taskId: string) => number
  getTodaySessions: () => FocusSession[]
  getWeekSessions: () => FocusSession[]
  getMostFocusedTasks: (limit?: number) => Array<{ taskId: string; taskTitle: string; totalTime: number; sessionCount: number }>
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0]
}

const getWeekStart = (date: Date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday as start
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const isToday = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  return getDateString(d) === getDateString()
}

const isThisWeek = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date
  const weekStart = getWeekStart()
  return d >= weekStart
}

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      sessions: [],
      currentSession: null,
      consecutiveSessions: 0,
      focusStreak: 0,
      lastFocusDate: null,

      startSession: (taskId, taskTitle, targetDuration) => {
        const session: FocusSession = {
          id: generateId(),
          taskId,
          taskTitle,
          startedAt: new Date(),
          duration: 0,
          targetDuration,
          completed: false,
          interrupted: false,
        }
        set({ currentSession: session })
      },

      updateSessionDuration: (duration) => {
        set((state) => {
          if (!state.currentSession) return state
          return {
            currentSession: { ...state.currentSession, duration },
          }
        })
      },

      endSession: (completed) => {
        set((state) => {
          const current = state.currentSession
          if (!current) return state

          const endedSession: FocusSession = {
            ...current,
            endedAt: new Date(),
            completed,
            interrupted: !completed,
          }

          const today = getDateString()
          let newStreak = state.focusStreak
          let newConsecutive = state.consecutiveSessions + 1

          // Update focus streak
          if (state.lastFocusDate !== today) {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = getDateString(yesterday)

            if (state.lastFocusDate === yesterdayStr) {
              newStreak += 1
            } else if (state.lastFocusDate !== today) {
              newStreak = 1
            }
          }

          return {
            sessions: [...state.sessions, endedSession],
            currentSession: null,
            consecutiveSessions: newConsecutive,
            focusStreak: newStreak,
            lastFocusDate: today,
          }
        })
      },

      cancelSession: () => {
        set({ currentSession: null })
      },

      resetConsecutiveSessions: () => {
        set({ consecutiveSessions: 0 })
      },

      getStats: () => {
        const { sessions } = get()

        const todaySessions = sessions.filter((s) => isToday(s.startedAt))
        const weekSessions = sessions.filter((s) => isThisWeek(s.startedAt))

        const totalFocusTime = sessions.reduce((sum, s) => sum + s.duration, 0)
        const todayFocusTime = todaySessions.reduce((sum, s) => sum + s.duration, 0)
        const weekFocusTime = weekSessions.reduce((sum, s) => sum + s.duration, 0)

        const averageSessionLength = sessions.length > 0
          ? Math.round(totalFocusTime / sessions.length)
          : 0

        const longestSession = sessions.length > 0
          ? Math.max(...sessions.map((s) => s.duration))
          : 0

        const sessionsPerTask: Record<string, { taskTitle: string; totalTime: number; sessionCount: number }> = {}
        sessions.forEach((s) => {
          if (!sessionsPerTask[s.taskId]) {
            sessionsPerTask[s.taskId] = { taskTitle: s.taskTitle, totalTime: 0, sessionCount: 0 }
          }
          sessionsPerTask[s.taskId].totalTime += s.duration
          sessionsPerTask[s.taskId].sessionCount += 1
        })

        return {
          totalSessions: sessions.length,
          totalFocusTime,
          todayFocusTime,
          weekFocusTime,
          averageSessionLength,
          longestSession,
          sessionsPerTask,
        }
      },

      getTaskFocusTime: (taskId) => {
        const { sessions } = get()
        return sessions
          .filter((s) => s.taskId === taskId)
          .reduce((sum, s) => sum + s.duration, 0)
      },

      getTodaySessions: () => {
        return get().sessions.filter((s) => isToday(s.startedAt))
      },

      getWeekSessions: () => {
        return get().sessions.filter((s) => isThisWeek(s.startedAt))
      },

      getMostFocusedTasks: (limit = 5) => {
        const stats = get().getStats()
        return Object.entries(stats.sessionsPerTask)
          .map(([taskId, data]) => ({ taskId, ...data }))
          .sort((a, b) => b.totalTime - a.totalTime)
          .slice(0, limit)
      },
    }),
    {
      name: 'myflowspace-focus',
      partialize: (state) => ({
        sessions: state.sessions,
        consecutiveSessions: state.consecutiveSessions,
        focusStreak: state.focusStreak,
        lastFocusDate: state.lastFocusDate,
      }),
    }
  )
)

// Helper to format seconds as human-readable time
export const formatFocusTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
  return `${minutes}m`
}

// Helper to format for display (e.g., "2h 15m")
export const formatFocusTimeVerbose = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h`
  } else if (minutes > 0) {
    return `${minutes}m`
  }
  return '< 1m'
}
