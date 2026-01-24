// Habit Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, saveStore, generateId, getToday, type Habit, type ToolResult } from '../store/index.js'
import {
  isValidFrequency,
  isNonEmptyString,
  parseTags,
  sanitize,
  localGetHabits,
  localCreateHabit,
  localUpdateHabit,
  localDeleteHabit,
  localToggleHabit,
  logger,
} from '../utils/index.js'

// Tool definitions
export const habitToolDefinitions: Tool[] = [
  {
    name: 'create_habit',
    description: 'Create a new habit with frequency and category',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Habit name (required)' },
        frequency: {
          type: 'string',
          enum: ['daily', 'weekly'],
          description: 'How often to track (default: daily)',
        },
        category: { type: 'string', description: 'Category for grouping (e.g., health, work)' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for organization',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'toggle_habit_today',
    description: 'Mark a habit as complete or incomplete for today',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Habit ID (required)' },
        date: { type: 'string', description: 'Date to toggle (YYYY-MM-DD, default: today)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_today_habits',
    description: 'Get all habits with their completion status for today',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_habit_streaks',
    description: 'Get habits sorted by their current streak length',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of habits to return' },
      },
    },
  },
]

// Calculate streak for a habit
function calculateStreak(completions: Record<string, boolean>): number {
  const dates = Object.keys(completions)
    .filter((d) => completions[d])
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

// Tool executors
export const habitToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  create_habit: async (args) => {
    const name = sanitize(args.name)
    if (!isNonEmptyString(name)) {
      return { success: false, message: 'Habit name is required' }
    }

    const frequency = isValidFrequency(args.frequency) ? args.frequency : 'daily'
    const category = sanitize(args.category) || 'general'
    const tags = parseTags(args.tags)

    const localResult = await localCreateHabit({
      name,
      frequency,
      category,
    })

    if (localResult.success && localResult.source === 'local') {
      logger.info(`Habit created via local API: "${name}" (syncs to Gist)`)
      return {
        success: true,
        message: `Habit created: "${name}" (${frequency}) - synced to app & Gist`,
        data: localResult.data,
      }
    }

    const store = getStore()
    const habit: Habit = {
      id: generateId(),
      name,
      frequency,
      category,
      tags: tags.length > 0 ? tags : undefined,
      completions: {},
      streak: 0,
      createdAt: new Date(),
    }

    store.data.habits.push(habit)
    await saveStore()

    return {
      success: true,
      message: `Habit created: "${name}" (${frequency}) - stored locally`,
      data: { id: habit.id, name, frequency, category },
    }
  },

  toggle_habit_today: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Habit ID is required' }
    }

    const date = sanitize(args.date) || getToday()
    const store = getStore()
    const habit = store.data.habits.find((h) => h.id === id)

    if (!habit) {
      return { success: false, message: `Habit not found: ${id}` }
    }

    const wasCompleted = habit.completions[date] === true
    habit.completions[date] = !wasCompleted
    habit.streak = calculateStreak(habit.completions)

    // Update gamification stats
    if (habit.completions[date] && !wasCompleted) {
      store.data.gamification.habitsCompleted++
      store.data.gamification.habitsCompletedToday++
    }

    await saveStore()

    return {
      success: true,
      message: habit.completions[date]
        ? `Habit completed: "${habit.name}" (streak: ${habit.streak})`
        : `Habit uncompleted: "${habit.name}"`,
      data: { id, name: habit.name, completed: habit.completions[date], streak: habit.streak },
    }
  },

  get_today_habits: async () => {
    const store = getStore()
    const today = getToday()

    const habits = store.data.habits.map((h) => ({
      id: h.id,
      name: h.name,
      frequency: h.frequency,
      category: h.category,
      completedToday: h.completions[today] === true,
      streak: h.streak,
    }))

    const completed = habits.filter((h) => h.completedToday).length
    const total = habits.length

    return {
      success: true,
      message: `${completed}/${total} habits completed today`,
      data: { habits, completed, total },
    }
  },

  get_habit_streaks: async (args) => {
    const limit = typeof args.limit === 'number' ? args.limit : undefined
    const store = getStore()

    // Recalculate streaks
    store.data.habits.forEach((h) => {
      h.streak = calculateStreak(h.completions)
    })

    let habits = [...store.data.habits].sort((a, b) => b.streak - a.streak)

    if (limit) {
      habits = habits.slice(0, limit)
    }

    await saveStore() // Save updated streaks

    return {
      success: true,
      message: `Found ${habits.length} habits`,
      data: habits.map((h) => ({
        id: h.id,
        name: h.name,
        streak: h.streak,
        category: h.category,
      })),
    }
  },
}
