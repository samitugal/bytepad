// Journal Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, saveStore, generateId, getToday, type JournalEntry, type ToolResult } from '../store/index.js'
import { isValidMood, isValidEnergy, isNonEmptyString, parseTags, sanitize } from '../utils/index.js'

// Tool definitions
export const journalToolDefinitions: Tool[] = [
  {
    name: 'create_journal_entry',
    description: 'Create or update a daily journal entry with mood and energy tracking',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date for entry (YYYY-MM-DD, default: today)' },
        content: { type: 'string', description: 'Journal content (required)' },
        mood: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Mood rating 1-5 (1=very bad, 5=very good)',
        },
        energy: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Energy level 1-5 (1=exhausted, 5=energetic)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for the entry',
        },
      },
      required: ['content'],
    },
  },
  {
    name: 'get_journal_entry',
    description: 'Get journal entry for a specific date',
    inputSchema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date to get (YYYY-MM-DD, default: today)' },
      },
    },
  },
  {
    name: 'get_recent_journal',
    description: 'Get journal entries from the last N days',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days to look back (default: 7)' },
      },
    },
  },
  {
    name: 'get_mood_trend',
    description: 'Get mood and energy trend for the last N days',
    inputSchema: {
      type: 'object',
      properties: {
        days: { type: 'number', description: 'Number of days (default: 7)' },
      },
    },
  },
]

// Tool executors
export const journalToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  create_journal_entry: async (args) => {
    const content = typeof args.content === 'string' ? args.content : ''
    if (!isNonEmptyString(content)) {
      return { success: false, message: 'Journal content is required' }
    }

    const date = sanitize(args.date) || getToday()
    const mood = isValidMood(args.mood) ? args.mood : 3
    const energy = isValidEnergy(args.energy) ? args.energy : 3
    const tags = parseTags(args.tags)

    const store = getStore()

    // Check if entry already exists for this date
    const existingIndex = store.data.journal.findIndex((e) => e.date === date)

    if (existingIndex !== -1) {
      // Update existing entry
      store.data.journal[existingIndex] = {
        ...store.data.journal[existingIndex],
        content,
        mood,
        energy,
        tags,
      }
      await saveStore()

      return {
        success: true,
        message: `Journal entry updated for ${date}`,
        data: { id: store.data.journal[existingIndex].id, date, mood, energy },
      }
    }

    // Create new entry
    const entry: JournalEntry = {
      id: generateId(),
      date,
      content,
      mood,
      energy,
      tags,
    }

    store.data.journal.unshift(entry)
    store.data.gamification.journalEntries++
    await saveStore()

    return {
      success: true,
      message: `Journal entry created for ${date}`,
      data: { id: entry.id, date, mood, energy },
    }
  },

  get_journal_entry: async (args) => {
    const date = sanitize(args.date) || getToday()
    const store = getStore()

    const entry = store.data.journal.find((e) => e.date === date)

    if (!entry) {
      return {
        success: true,
        message: `No journal entry for ${date}`,
        data: null,
      }
    }

    return {
      success: true,
      message: `Found journal entry for ${date}`,
      data: entry,
    }
  },

  get_recent_journal: async (args) => {
    const days = typeof args.days === 'number' ? args.days : 7
    const store = getStore()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const entries = store.data.journal
      .filter((e) => e.date >= cutoffStr)
      .sort((a, b) => b.date.localeCompare(a.date))

    return {
      success: true,
      message: `Found ${entries.length} journal entries from last ${days} days`,
      data: entries,
    }
  },

  get_mood_trend: async (args) => {
    const days = typeof args.days === 'number' ? args.days : 7
    const store = getStore()

    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    const cutoffStr = cutoffDate.toISOString().split('T')[0]

    const entries = store.data.journal
      .filter((e) => e.date >= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date))

    const trend = entries.map((e) => ({
      date: e.date,
      mood: e.mood,
      energy: e.energy,
    }))

    const avgMood = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.mood, 0) / entries.length
      : 0
    const avgEnergy = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.energy, 0) / entries.length
      : 0

    return {
      success: true,
      message: `Mood/energy trend for last ${days} days`,
      data: {
        trend,
        averageMood: Math.round(avgMood * 10) / 10,
        averageEnergy: Math.round(avgEnergy * 10) / 10,
        entriesCount: entries.length,
      },
    }
  },
}
