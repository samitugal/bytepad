import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// XP Values for different actions
export const XP_VALUES = {
  taskComplete: 10,
  taskCompleteP1: 25,
  taskCompleteP2: 15,
  habitComplete: 5,
  journalEntry: 10,
  pomodoroComplete: 15,
  noteCreate: 3,
} as const

// Level thresholds and titles
export const LEVELS = [
  { level: 1, xp: 0, title: 'Novice' },
  { level: 2, xp: 100, title: 'Apprentice' },
  { level: 3, xp: 250, title: 'Journeyman' },
  { level: 4, xp: 500, title: 'Adept' },
  { level: 5, xp: 1000, title: 'Expert' },
  { level: 6, xp: 2000, title: 'Master' },
  { level: 7, xp: 4000, title: 'Grandmaster' },
  { level: 8, xp: 8000, title: 'Legend' },
  { level: 9, xp: 16000, title: 'Mythic' },
  { level: 10, xp: 32000, title: 'Transcendent' },
] as const

// Streak multipliers
export const STREAK_MULTIPLIERS = [
  { minDays: 30, multiplier: 2.0 },
  { minDays: 14, multiplier: 1.5 },
  { minDays: 7, multiplier: 1.2 },
  { minDays: 1, multiplier: 1.0 },
] as const

// Achievement definitions
export interface Achievement {
  id: string
  name: string
  description: string
  badge: string
  category: 'tasks' | 'habits' | 'focus' | 'notes' | 'streaks' | 'special'
  condition: (stats: UserStats) => boolean
  xpReward: number
}

export const ACHIEVEMENTS: Achievement[] = [
  // Task achievements
  {
    id: 'T01',
    name: 'First Blood',
    description: 'Complete your first task',
    badge: '[✓]',
    category: 'tasks',
    condition: (stats) => stats.tasksCompleted >= 1,
    xpReward: 10,
  },
  {
    id: 'T02',
    name: 'Productive Day',
    description: 'Complete 5 tasks in one day',
    badge: '[✓✓✓]',
    category: 'tasks',
    condition: (stats) => stats.tasksCompletedToday >= 5,
    xpReward: 25,
  },
  {
    id: 'T03',
    name: 'Task Slayer',
    description: 'Complete 100 tasks total',
    badge: '[SLAYER]',
    category: 'tasks',
    condition: (stats) => stats.tasksCompleted >= 100,
    xpReward: 100,
  },
  // Streak achievements
  {
    id: 'S01',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    badge: '[7d]',
    category: 'streaks',
    condition: (stats) => stats.currentStreak >= 7,
    xpReward: 50,
  },
  {
    id: 'S02',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    badge: '[30d]',
    category: 'streaks',
    condition: (stats) => stats.currentStreak >= 30,
    xpReward: 200,
  },
  // Note achievements
  {
    id: 'N01',
    name: 'First Note',
    description: 'Create your first note',
    badge: '[n]',
    category: 'notes',
    condition: (stats) => stats.notesCreated >= 1,
    xpReward: 10,
  },
  {
    id: 'N02',
    name: 'Notebook',
    description: 'Create 10 notes',
    badge: '[nb]',
    category: 'notes',
    condition: (stats) => stats.notesCreated >= 10,
    xpReward: 30,
  },
  // Habit achievements
  {
    id: 'H01',
    name: 'Habit Starter',
    description: 'Complete your first habit',
    badge: '[h]',
    category: 'habits',
    condition: (stats) => stats.habitsCompleted >= 1,
    xpReward: 10,
  },
  {
    id: 'H02',
    name: 'Perfect Day',
    description: 'Complete all habits in one day',
    badge: '[★]',
    category: 'habits',
    condition: (stats) => stats.perfectDays >= 1,
    xpReward: 50,
  },
  // Focus achievements
  {
    id: 'F01',
    name: 'Deep Focus',
    description: 'Complete 10 focus sessions',
    badge: '[🎯]',
    category: 'focus',
    condition: (stats) => stats.pomodorosCompleted >= 10,
    xpReward: 50,
  },
]

export interface UserStats {
  level: number
  currentXP: number
  totalXP: number

  tasksCompleted: number
  tasksCompletedToday: number
  habitsCompleted: number
  habitsCompletedToday: number
  pomodorosCompleted: number
  notesCreated: number
  journalEntries: number
  perfectDays: number

  currentStreak: number
  bestStreak: number
  lastActiveDate: string | null

  achievements: string[] // unlocked achievement IDs
}

interface GamificationState extends UserStats {
  // Pending notifications
  pendingLevelUp: { oldLevel: number; newLevel: number } | null
  pendingAchievements: Achievement[]

  // Actions
  addXP: (amount: number, action: string) => void
  incrementStat: (stat: keyof Pick<UserStats,
    'tasksCompleted' | 'tasksCompletedToday' | 'habitsCompleted' |
    'habitsCompletedToday' | 'pomodorosCompleted' | 'notesCreated' |
    'journalEntries' | 'perfectDays'
  >) => void
  checkStreak: () => void
  checkAchievements: () => void
  unlockAchievement: (id: string) => void
  resetDailyStats: () => void
  clearPendingLevelUp: () => void
  clearPendingAchievement: (id: string) => void

  // Getters
  getLevel: () => typeof LEVELS[number]
  getXPForNextLevel: () => number
  getXPProgress: () => number // 0-100 percentage
  getStreakMultiplier: () => number
  getLevelTitle: () => string
}

const getDateString = (date: Date = new Date()) => {
  return date.toISOString().split('T')[0]
}

const calculateLevel = (totalXP: number): number => {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVELS[i].xp) {
      return LEVELS[i].level
    }
  }
  return 1
}

const getStreakMultiplier = (streakDays: number): number => {
  for (const { minDays, multiplier } of STREAK_MULTIPLIERS) {
    if (streakDays >= minDays) {
      return multiplier
    }
  }
  return 1.0
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      // Initial stats
      level: 1,
      currentXP: 0,
      totalXP: 0,

      tasksCompleted: 0,
      tasksCompletedToday: 0,
      habitsCompleted: 0,
      habitsCompletedToday: 0,
      pomodorosCompleted: 0,
      notesCreated: 0,
      journalEntries: 0,
      perfectDays: 0,

      currentStreak: 0,
      bestStreak: 0,
      lastActiveDate: null,

      achievements: [],

      pendingLevelUp: null,
      pendingAchievements: [],

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addXP: (baseAmount, _action) => {
        set((state) => {
          const multiplier = getStreakMultiplier(state.currentStreak)
          const amount = Math.round(baseAmount * multiplier)
          const newTotalXP = state.totalXP + amount
          const oldLevel = state.level
          const newLevel = calculateLevel(newTotalXP)

          const levelInfo = LEVELS.find(l => l.level === newLevel) || LEVELS[0]
          const xpForCurrentLevel = levelInfo.xp

          return {
            totalXP: newTotalXP,
            currentXP: newTotalXP - xpForCurrentLevel,
            level: newLevel,
            pendingLevelUp: newLevel > oldLevel
              ? { oldLevel, newLevel }
              : state.pendingLevelUp,
          }
        })

        // Check achievements after XP is added
        get().checkAchievements()
      },

      incrementStat: (stat) => {
        set((state) => ({
          [stat]: state[stat] + 1,
        }))

        // Update streak on activity
        get().checkStreak()
      },

      checkStreak: () => {
        const today = getDateString()
        const state = get()

        if (state.lastActiveDate === today) {
          // Already active today, no change
          return
        }

        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = getDateString(yesterday)

        set((s) => {
          let newStreak = s.currentStreak

          if (s.lastActiveDate === yesterdayStr) {
            // Consecutive day
            newStreak = s.currentStreak + 1
          } else if (s.lastActiveDate !== today) {
            // Streak broken (missed a day or first activity)
            newStreak = s.lastActiveDate === null ? 1 : 1
          }

          return {
            lastActiveDate: today,
            currentStreak: newStreak,
            bestStreak: Math.max(newStreak, s.bestStreak),
          }
        })
      },

      checkAchievements: () => {
        const state = get()
        const newAchievements: Achievement[] = []

        for (const achievement of ACHIEVEMENTS) {
          if (!state.achievements.includes(achievement.id)) {
            if (achievement.condition(state)) {
              newAchievements.push(achievement)
            }
          }
        }

        if (newAchievements.length > 0) {
          set((s) => ({
            achievements: [...s.achievements, ...newAchievements.map(a => a.id)],
            pendingAchievements: [...s.pendingAchievements, ...newAchievements],
          }))

          // Award XP for achievements
          for (const achievement of newAchievements) {
            get().addXP(achievement.xpReward, `achievement:${achievement.id}`)
          }
        }
      },

      unlockAchievement: (id) => {
        set((state) => {
          if (state.achievements.includes(id)) return state
          return {
            achievements: [...state.achievements, id],
          }
        })
      },

      resetDailyStats: () => {
        set({
          tasksCompletedToday: 0,
          habitsCompletedToday: 0,
        })
      },

      clearPendingLevelUp: () => {
        set({ pendingLevelUp: null })
      },

      clearPendingAchievement: (id) => {
        set((state) => ({
          pendingAchievements: state.pendingAchievements.filter(a => a.id !== id),
        }))
      },

      getLevel: () => {
        const state = get()
        return LEVELS.find(l => l.level === state.level) || LEVELS[0]
      },

      getXPForNextLevel: () => {
        const state = get()
        const nextLevel = LEVELS.find(l => l.level === state.level + 1)
        if (!nextLevel) return 0
        const currentLevelXP = LEVELS.find(l => l.level === state.level)?.xp || 0
        return nextLevel.xp - currentLevelXP
      },

      getXPProgress: () => {
        const state = get()
        const xpNeeded = get().getXPForNextLevel()
        if (xpNeeded === 0) return 100
        return Math.min(Math.round((state.currentXP / xpNeeded) * 100), 100)
      },

      getStreakMultiplier: () => {
        return getStreakMultiplier(get().currentStreak)
      },

      getLevelTitle: () => {
        return get().getLevel().title
      },
    }),
    {
      name: 'myflowspace-gamification',
      partialize: (state) => ({
        level: state.level,
        currentXP: state.currentXP,
        totalXP: state.totalXP,
        tasksCompleted: state.tasksCompleted,
        tasksCompletedToday: state.tasksCompletedToday,
        habitsCompleted: state.habitsCompleted,
        habitsCompletedToday: state.habitsCompletedToday,
        pomodorosCompleted: state.pomodorosCompleted,
        notesCreated: state.notesCreated,
        journalEntries: state.journalEntries,
        perfectDays: state.perfectDays,
        currentStreak: state.currentStreak,
        bestStreak: state.bestStreak,
        lastActiveDate: state.lastActiveDate,
        achievements: state.achievements,
      }),
    }
  )
)

// Helper to format XP display
export const formatXP = (xp: number): string => {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`
  }
  return xp.toString()
}
