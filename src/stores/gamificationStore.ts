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
  { level: 2, xp: 100, title: 'Novice' },
  { level: 3, xp: 400, title: 'Novice' },
  { level: 4, xp: 900, title: 'Novice' },
  { level: 5, xp: 1600, title: 'Apprentice' },
  { level: 6, xp: 2500, title: 'Apprentice' },
  { level: 7, xp: 3600, title: 'Apprentice' },
  { level: 8, xp: 4900, title: 'Apprentice' },
  { level: 9, xp: 6400, title: 'Apprentice' },
  { level: 10, xp: 8100, title: 'Apprentice' },
  { level: 11, xp: 10000, title: 'Apprentice' },
  { level: 12, xp: 12100, title: 'Apprentice' },
  { level: 13, xp: 14400, title: 'Apprentice' },
  { level: 14, xp: 16900, title: 'Apprentice' },
  { level: 15, xp: 19600, title: 'Journeyman' },
  { level: 16, xp: 22500, title: 'Journeyman' },
  { level: 17, xp: 25600, title: 'Journeyman' },
  { level: 18, xp: 28900, title: 'Journeyman' },
  { level: 19, xp: 32400, title: 'Journeyman' },
  { level: 20, xp: 36100, title: 'Journeyman' },
  { level: 21, xp: 40000, title: 'Journeyman' },
  { level: 22, xp: 44100, title: 'Journeyman' },
  { level: 23, xp: 48400, title: 'Journeyman' },
  { level: 24, xp: 52900, title: 'Journeyman' },
  { level: 25, xp: 57600, title: 'Adept' },
  { level: 26, xp: 62500, title: 'Adept' },
  { level: 27, xp: 67600, title: 'Adept' },
  { level: 28, xp: 72900, title: 'Adept' },
  { level: 29, xp: 78400, title: 'Adept' },
  { level: 30, xp: 84100, title: 'Adept' },
  { level: 31, xp: 90000, title: 'Adept' },
  { level: 32, xp: 96100, title: 'Adept' },
  { level: 33, xp: 102400, title: 'Adept' },
  { level: 34, xp: 108900, title: 'Adept' },
  { level: 35, xp: 115600, title: 'Adept' },
  { level: 36, xp: 122500, title: 'Adept' },
  { level: 37, xp: 129600, title: 'Adept' },
  { level: 38, xp: 136900, title: 'Adept' },
  { level: 39, xp: 144400, title: 'Adept' },
  { level: 40, xp: 152100, title: 'Expert' },
  { level: 41, xp: 160000, title: 'Expert' },
  { level: 42, xp: 168100, title: 'Expert' },
  { level: 43, xp: 176400, title: 'Expert' },
  { level: 44, xp: 184900, title: 'Expert' },
  { level: 45, xp: 193600, title: 'Expert' },
  { level: 46, xp: 202500, title: 'Expert' },
  { level: 47, xp: 211600, title: 'Expert' },
  { level: 48, xp: 220900, title: 'Expert' },
  { level: 49, xp: 230400, title: 'Expert' },
  { level: 50, xp: 240100, title: 'Expert' },
  { level: 51, xp: 250000, title: 'Expert' },
  { level: 52, xp: 260100, title: 'Expert' },
  { level: 53, xp: 270400, title: 'Expert' },
  { level: 54, xp: 280900, title: 'Expert' },
  { level: 55, xp: 291600, title: 'Master' },
  { level: 56, xp: 302500, title: 'Master' },
  { level: 57, xp: 313600, title: 'Master' },
  { level: 58, xp: 324900, title: 'Master' },
  { level: 59, xp: 336400, title: 'Master' },
  { level: 60, xp: 348100, title: 'Master' },
  { level: 61, xp: 360000, title: 'Master' },
  { level: 62, xp: 372100, title: 'Master' },
  { level: 63, xp: 384400, title: 'Master' },
  { level: 64, xp: 396900, title: 'Master' },
  { level: 65, xp: 409600, title: 'Master' },
  { level: 66, xp: 422500, title: 'Master' },
  { level: 67, xp: 435600, title: 'Master' },
  { level: 68, xp: 448900, title: 'Master' },
  { level: 69, xp: 462400, title: 'Master' },
  { level: 70, xp: 476100, title: 'Grandmaster' },
  { level: 71, xp: 490000, title: 'Grandmaster' },
  { level: 72, xp: 504100, title: 'Grandmaster' },
  { level: 73, xp: 518400, title: 'Grandmaster' },
  { level: 74, xp: 532900, title: 'Grandmaster' },
  { level: 75, xp: 547600, title: 'Grandmaster' },
  { level: 76, xp: 562500, title: 'Grandmaster' },
  { level: 77, xp: 577600, title: 'Grandmaster' },
  { level: 78, xp: 592900, title: 'Grandmaster' },
  { level: 79, xp: 608400, title: 'Grandmaster' },
  { level: 80, xp: 624100, title: 'Legend' },
  { level: 81, xp: 640000, title: 'Legend' },
  { level: 82, xp: 656100, title: 'Legend' },
  { level: 83, xp: 672400, title: 'Legend' },
  { level: 84, xp: 688900, title: 'Legend' },
  { level: 85, xp: 705600, title: 'Legend' },
  { level: 86, xp: 722500, title: 'Legend' },
  { level: 87, xp: 739600, title: 'Legend' },
  { level: 88, xp: 756900, title: 'Legend' },
  { level: 89, xp: 774400, title: 'Legend' },
  { level: 90, xp: 792100, title: 'Mythic' },
  { level: 91, xp: 810000, title: 'Mythic' },
  { level: 92, xp: 828100, title: 'Mythic' },
  { level: 93, xp: 846400, title: 'Mythic' },
  { level: 94, xp: 864900, title: 'Mythic' },
  { level: 95, xp: 883600, title: 'Mythic' },
  { level: 96, xp: 902500, title: 'Mythic' },
  { level: 97, xp: 921600, title: 'Mythic' },
  { level: 98, xp: 940900, title: 'Mythic' },
  { level: 99, xp: 960400, title: 'Mythic' },
  { level: 100, xp: 980100, title: 'Transcendent' },
  { level: 101, xp: 1000000, title: 'Transcendent' }
] as const;

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
      name: 'bytepad-gamification',
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
