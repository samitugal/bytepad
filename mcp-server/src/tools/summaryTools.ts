// Summary Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, getToday, type ToolResult } from '../store/index.js'

// Tool definitions
export const summaryToolDefinitions: Tool[] = [
  {
    name: 'get_daily_summary',
    description: 'Get a comprehensive summary of today\'s productivity',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_weekly_summary',
    description: 'Get a weekly productivity summary with trends',
    inputSchema: {
      type: 'object',
      properties: {
        weeksBack: { type: 'number', description: 'How many weeks back (default: 0 = current week)' },
      },
    },
  },
  {
    name: 'get_productivity_stats',
    description: 'Get overall productivity statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
]

// Helper: Get week boundaries
function getWeekBoundaries(weeksBack = 0): { start: string; end: string } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as start

  const start = new Date(now)
  start.setDate(now.getDate() - diff - weeksBack * 7)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

// Tool executors
export const summaryToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  get_daily_summary: async () => {
    const store = getStore()
    const today = getToday()

    // Tasks
    const allTasks = store.data.tasks.filter((t) => !t.archivedAt)
    const pendingTasks = allTasks.filter((t) => !t.completed)
    const todayCompleted = allTasks.filter((t) => {
      if (!t.completedAt) return false
      const completedDate = new Date(t.completedAt).toISOString().split('T')[0]
      return completedDate === today
    })

    // Tasks by priority
    const tasksByPriority: Record<string, { total: number; completed: number }> = {
      P1: { total: 0, completed: 0 },
      P2: { total: 0, completed: 0 },
      P3: { total: 0, completed: 0 },
      P4: { total: 0, completed: 0 },
    }
    allTasks.forEach((t) => {
      tasksByPriority[t.priority].total++
      if (t.completed) tasksByPriority[t.priority].completed++
    })

    // Habits
    const habits = store.data.habits
    const habitsCompletedToday = habits.filter((h) => h.completions[today]).length

    // Journal
    const todayJournal = store.data.journal.find((j) => j.date === today)

    // Focus sessions
    const todaySessions = store.data.focusSessions.filter((s) => {
      const sessionDate = new Date(s.startedAt).toISOString().split('T')[0]
      return sessionDate === today
    })
    const todayFocusMinutes = Math.round(
      todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )

    // Gamification
    const { level, currentXP, currentStreak, achievements } = store.data.gamification

    return {
      success: true,
      message: `Daily summary for ${today}`,
      data: {
        date: today,
        tasks: {
          pending: pendingTasks.length,
          completedToday: todayCompleted.length,
          byPriority: tasksByPriority,
          highPriorityPending: pendingTasks.filter((t) => t.priority === 'P1' || t.priority === 'P2').length,
        },
        habits: {
          total: habits.length,
          completedToday: habitsCompletedToday,
          completionRate: habits.length > 0
            ? Math.round((habitsCompletedToday / habits.length) * 100)
            : 0,
        },
        journal: todayJournal
          ? { mood: todayJournal.mood, energy: todayJournal.energy, hasEntry: true }
          : { hasEntry: false },
        focus: {
          sessions: todaySessions.length,
          minutes: todayFocusMinutes,
        },
        gamification: {
          level,
          currentXP,
          currentStreak,
          achievementsUnlocked: achievements.length,
        },
      },
    }
  },

  get_weekly_summary: async (args) => {
    const weeksBack = typeof args.weeksBack === 'number' ? args.weeksBack : 0
    const store = getStore()
    const { start, end } = getWeekBoundaries(weeksBack)

    // Tasks completed this week
    const weekTasks = store.data.tasks.filter((t) => {
      if (!t.completedAt) return false
      const completedDate = new Date(t.completedAt).toISOString().split('T')[0]
      return completedDate >= start && completedDate <= end
    })

    // Habit completions this week
    let totalHabitCompletions = 0
    let totalPossibleCompletions = 0
    const habits = store.data.habits

    // Count each day in the week
    const currentDate = new Date(start)
    const endDate = new Date(end)
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0]
      habits.forEach((h) => {
        totalPossibleCompletions++
        if (h.completions[dateStr]) totalHabitCompletions++
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Journal entries this week
    const weekJournals = store.data.journal.filter(
      (j) => j.date >= start && j.date <= end
    )
    const avgMood = weekJournals.length > 0
      ? weekJournals.reduce((sum, j) => sum + j.mood, 0) / weekJournals.length
      : 0
    const avgEnergy = weekJournals.length > 0
      ? weekJournals.reduce((sum, j) => sum + j.energy, 0) / weekJournals.length
      : 0

    // Focus time this week
    const weekSessions = store.data.focusSessions.filter((s) => {
      const sessionDate = new Date(s.startedAt).toISOString().split('T')[0]
      return sessionDate >= start && sessionDate <= end
    })
    const weekFocusMinutes = Math.round(
      weekSessions.reduce((sum, s) => sum + s.duration, 0) / 60
    )

    return {
      success: true,
      message: `Weekly summary: ${start} to ${end}`,
      data: {
        weekStart: start,
        weekEnd: end,
        tasks: {
          completed: weekTasks.length,
          byPriority: {
            P1: weekTasks.filter((t) => t.priority === 'P1').length,
            P2: weekTasks.filter((t) => t.priority === 'P2').length,
            P3: weekTasks.filter((t) => t.priority === 'P3').length,
            P4: weekTasks.filter((t) => t.priority === 'P4').length,
          },
        },
        habits: {
          completions: totalHabitCompletions,
          possible: totalPossibleCompletions,
          completionRate: totalPossibleCompletions > 0
            ? Math.round((totalHabitCompletions / totalPossibleCompletions) * 100)
            : 0,
        },
        journal: {
          entries: weekJournals.length,
          averageMood: Math.round(avgMood * 10) / 10,
          averageEnergy: Math.round(avgEnergy * 10) / 10,
        },
        focus: {
          sessions: weekSessions.length,
          totalMinutes: weekFocusMinutes,
          averagePerDay: Math.round(weekFocusMinutes / 7),
        },
      },
    }
  },

  get_productivity_stats: async () => {
    const store = getStore()
    const { gamification, focusStats } = store.data

    // Calculate totals
    const totalTasks = store.data.tasks.length
    const completedTasks = store.data.tasks.filter((t) => t.completed).length
    const totalNotes = store.data.notes.length
    const totalBookmarks = store.data.bookmarks.length
    const totalHabits = store.data.habits.length

    // Best habit streaks
    const topStreaks = [...store.data.habits]
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3)
      .map((h) => ({ name: h.name, streak: h.streak }))

    return {
      success: true,
      message: 'Overall productivity statistics',
      data: {
        gamification: {
          level: gamification.level,
          totalXP: gamification.totalXP,
          currentStreak: gamification.currentStreak,
          bestStreak: gamification.bestStreak,
          achievementsUnlocked: gamification.achievements.length,
        },
        totals: {
          tasks: { total: totalTasks, completed: completedTasks },
          notes: totalNotes,
          bookmarks: totalBookmarks,
          habits: totalHabits,
          journalEntries: gamification.journalEntries,
          focusSessions: focusStats.totalSessions,
          focusMinutes: Math.round(focusStats.totalFocusTime / 60),
        },
        topHabitStreaks: topStreaks,
        taskCompletionRate: totalTasks > 0
          ? Math.round((completedTasks / totalTasks) * 100)
          : 0,
      },
    }
  },
}
