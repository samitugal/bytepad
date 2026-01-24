// MCP Resources - provides read-only access to Bytepad data

import type { Resource } from '@modelcontextprotocol/sdk/types.js'
import { getStore, getToday } from '../store/index.js'

// Resource definitions
export const resourceDefinitions: Resource[] = [
  {
    uri: 'bytepad://tasks',
    name: 'All Tasks',
    description: 'All tasks in Bytepad',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://tasks/pending',
    name: 'Pending Tasks',
    description: 'All incomplete tasks',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://tasks/today',
    name: 'Today\'s Tasks',
    description: 'Tasks due today or completed today',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://habits',
    name: 'All Habits',
    description: 'All habits with completion history',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://habits/today',
    name: 'Today\'s Habits',
    description: 'Habits with today\'s completion status',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://notes',
    name: 'All Notes',
    description: 'All notes in Bytepad',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://journal',
    name: 'Journal Entries',
    description: 'All journal entries',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://journal/today',
    name: 'Today\'s Journal',
    description: 'Journal entry for today',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://bookmarks',
    name: 'All Bookmarks',
    description: 'All saved bookmarks',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://summary/daily',
    name: 'Daily Summary',
    description: 'Today\'s productivity summary',
    mimeType: 'application/json',
  },
  {
    uri: 'bytepad://gamification',
    name: 'Gamification Stats',
    description: 'XP, levels, achievements, and streaks',
    mimeType: 'application/json',
  },
]

// Read resource content
export function readResource(uri: string): { content: string; mimeType: string } | null {
  const store = getStore()
  const today = getToday()

  switch (uri) {
    case 'bytepad://tasks':
      return {
        content: JSON.stringify(store.data.tasks, null, 2),
        mimeType: 'application/json',
      }

    case 'bytepad://tasks/pending':
      return {
        content: JSON.stringify(
          store.data.tasks.filter((t) => !t.completed && !t.archivedAt),
          null,
          2
        ),
        mimeType: 'application/json',
      }

    case 'bytepad://tasks/today': {
      const todayTasks = store.data.tasks.filter((t) => {
        const deadlineToday = t.deadline &&
          new Date(t.deadline).toISOString().split('T')[0] === today
        const completedToday = t.completedAt &&
          new Date(t.completedAt).toISOString().split('T')[0] === today
        return deadlineToday || completedToday
      })
      return {
        content: JSON.stringify(todayTasks, null, 2),
        mimeType: 'application/json',
      }
    }

    case 'bytepad://habits':
      return {
        content: JSON.stringify(store.data.habits, null, 2),
        mimeType: 'application/json',
      }

    case 'bytepad://habits/today': {
      const habitsToday = store.data.habits.map((h) => ({
        ...h,
        completedToday: h.completions[today] === true,
      }))
      return {
        content: JSON.stringify(habitsToday, null, 2),
        mimeType: 'application/json',
      }
    }

    case 'bytepad://notes':
      return {
        content: JSON.stringify(store.data.notes, null, 2),
        mimeType: 'application/json',
      }

    case 'bytepad://journal':
      return {
        content: JSON.stringify(store.data.journal, null, 2),
        mimeType: 'application/json',
      }

    case 'bytepad://journal/today': {
      const todayEntry = store.data.journal.find((j) => j.date === today)
      return {
        content: JSON.stringify(todayEntry || null, null, 2),
        mimeType: 'application/json',
      }
    }

    case 'bytepad://bookmarks':
      return {
        content: JSON.stringify(store.data.bookmarks, null, 2),
        mimeType: 'application/json',
      }

    case 'bytepad://summary/daily': {
      const allTasks = store.data.tasks.filter((t) => !t.archivedAt)
      const pendingTasks = allTasks.filter((t) => !t.completed)
      const todayCompleted = allTasks.filter((t) =>
        t.completedAt && new Date(t.completedAt).toISOString().split('T')[0] === today
      )
      const habitsCompletedToday = store.data.habits.filter((h) => h.completions[today]).length
      const todayJournal = store.data.journal.find((j) => j.date === today)

      const summary = {
        date: today,
        tasks: {
          pending: pendingTasks.length,
          completedToday: todayCompleted.length,
        },
        habits: {
          total: store.data.habits.length,
          completedToday: habitsCompletedToday,
        },
        journal: todayJournal
          ? { mood: todayJournal.mood, energy: todayJournal.energy }
          : null,
        gamification: {
          level: store.data.gamification.level,
          currentXP: store.data.gamification.currentXP,
          currentStreak: store.data.gamification.currentStreak,
        },
      }
      return {
        content: JSON.stringify(summary, null, 2),
        mimeType: 'application/json',
      }
    }

    case 'bytepad://gamification':
      return {
        content: JSON.stringify(store.data.gamification, null, 2),
        mimeType: 'application/json',
      }

    default:
      return null
  }
}
