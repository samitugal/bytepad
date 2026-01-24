// Note Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, saveStore, generateId, type Note, type ToolResult } from '../store/index.js'
import { isNonEmptyString, parseTags, sanitize } from '../utils/index.js'

// Tool definitions
export const noteToolDefinitions: Tool[] = [
  {
    name: 'create_note',
    description: 'Create a new markdown note with optional tags',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Note title (required)' },
        content: { type: 'string', description: 'Note content in markdown format' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for organization',
        },
        pinned: { type: 'boolean', description: 'Pin note to top (default: false)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_note',
    description: 'Update an existing note',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID (required)' },
        title: { type: 'string', description: 'New title' },
        content: { type: 'string', description: 'New content' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags',
        },
        pinned: { type: 'boolean', description: 'Pin/unpin note' },
      },
      required: ['id'],
    },
  },
  {
    name: 'search_notes',
    description: 'Search notes by title, content, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (required)' },
        limit: { type: 'number', description: 'Maximum results (default: 10)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_note',
    description: 'Get a specific note by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID (required)' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_note',
    description: 'Delete a note permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Note ID (required)' },
      },
      required: ['id'],
    },
  },
]

// Tool executors
export const noteToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  create_note: async (args) => {
    const title = sanitize(args.title)
    if (!isNonEmptyString(title)) {
      return { success: false, message: 'Note title is required' }
    }

    const content = typeof args.content === 'string' ? args.content : ''
    const tags = parseTags(args.tags)
    const pinned = args.pinned === true

    const store = getStore()
    const now = new Date()
    const note: Note = {
      id: generateId(),
      title,
      content,
      tags,
      pinned,
      createdAt: now,
      updatedAt: now,
    }

    store.data.notes.unshift(note)
    store.data.gamification.notesCreated++
    await saveStore()

    return {
      success: true,
      message: `Note created: "${title}"`,
      data: { id: note.id, title, tags },
    }
  },

  update_note: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Note ID is required' }
    }

    const store = getStore()
    const noteIndex = store.data.notes.findIndex((n) => n.id === id)

    if (noteIndex === -1) {
      return { success: false, message: `Note not found: ${id}` }
    }

    const note = store.data.notes[noteIndex]
    const updates: Partial<Note> = { updatedAt: new Date() }

    if (args.title !== undefined) updates.title = sanitize(args.title)
    if (args.content !== undefined) updates.content = args.content as string
    if (args.tags !== undefined) updates.tags = parseTags(args.tags)
    if (args.pinned !== undefined) updates.pinned = args.pinned === true

    store.data.notes[noteIndex] = { ...note, ...updates }
    await saveStore()

    return {
      success: true,
      message: `Note updated: "${store.data.notes[noteIndex].title}"`,
      data: { id },
    }
  },

  search_notes: async (args) => {
    const query = sanitize(args.query)?.toLowerCase()
    if (!isNonEmptyString(query)) {
      return { success: false, message: 'Search query is required' }
    }

    const limit = typeof args.limit === 'number' ? args.limit : 10
    const store = getStore()

    const results = store.data.notes
      .filter((n) => {
        const titleMatch = n.title.toLowerCase().includes(query)
        const contentMatch = n.content.toLowerCase().includes(query)
        const tagMatch = n.tags.some((t) => t.toLowerCase().includes(query))
        return titleMatch || contentMatch || tagMatch
      })
      .slice(0, limit)
      .map((n) => ({
        id: n.id,
        title: n.title,
        tags: n.tags,
        pinned: n.pinned,
        preview: n.content.substring(0, 100) + (n.content.length > 100 ? '...' : ''),
        updatedAt: n.updatedAt,
      }))

    return {
      success: true,
      message: `Found ${results.length} notes matching "${query}"`,
      data: results,
    }
  },

  get_note: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Note ID is required' }
    }

    const store = getStore()
    const note = store.data.notes.find((n) => n.id === id)

    if (!note) {
      return { success: false, message: `Note not found: ${id}` }
    }

    return {
      success: true,
      message: `Found note: "${note.title}"`,
      data: note,
    }
  },

  delete_note: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Note ID is required' }
    }

    const store = getStore()
    const noteIndex = store.data.notes.findIndex((n) => n.id === id)

    if (noteIndex === -1) {
      return { success: false, message: `Note not found: ${id}` }
    }

    const note = store.data.notes[noteIndex]
    store.data.notes.splice(noteIndex, 1)
    await saveStore()

    return {
      success: true,
      message: `Note deleted: "${note.title}"`,
      data: { id, title: note.title },
    }
  },
}
