// Bookmark Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, saveStore, generateId, type Bookmark, type ToolResult } from '../store/index.js'
import { isValidUrl, isNonEmptyString, parseTags, sanitize, extractDomain } from '../utils/index.js'

// Tool definitions
export const bookmarkToolDefinitions: Tool[] = [
  {
    name: 'create_bookmark',
    description: 'Save a URL as a bookmark with optional metadata',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to bookmark (required)' },
        title: { type: 'string', description: 'Bookmark title (auto-generated if not provided)' },
        description: { type: 'string', description: 'Description of the bookmark' },
        collection: {
          type: 'string',
          description: 'Collection name (e.g., Gold, Silver, Bronze, or custom)',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for organization',
        },
        linkedTaskId: { type: 'string', description: 'ID of related task' },
      },
      required: ['url'],
    },
  },
  {
    name: 'search_bookmarks',
    description: 'Search bookmarks by title, URL, description, or tags',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query (required)' },
        collection: { type: 'string', description: 'Filter by collection' },
        limit: { type: 'number', description: 'Maximum results (default: 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_bookmarks',
    description: 'List bookmarks with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        collection: { type: 'string', description: 'Filter by collection' },
        tag: { type: 'string', description: 'Filter by tag' },
        unread: { type: 'boolean', description: 'Show only unread bookmarks' },
        limit: { type: 'number', description: 'Maximum results (default: 50)' },
      },
    },
  },
  {
    name: 'update_bookmark',
    description: 'Update bookmark metadata',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bookmark ID (required)' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        collection: { type: 'string', description: 'New collection' },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'New tags',
        },
        isRead: { type: 'boolean', description: 'Mark as read/unread' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_bookmark',
    description: 'Delete a bookmark',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Bookmark ID (required)' },
      },
      required: ['id'],
    },
  },
]

// Tool executors
export const bookmarkToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  create_bookmark: async (args) => {
    const url = sanitize(args.url)
    if (!isValidUrl(url)) {
      return { success: false, message: 'Valid URL is required' }
    }

    const domain = extractDomain(url)
    const title = sanitize(args.title) || domain
    const description = sanitize(args.description) || undefined
    const collection = sanitize(args.collection) || 'Unsorted'
    const tags = parseTags(args.tags)
    const linkedTaskId = sanitize(args.linkedTaskId) || undefined

    const store = getStore()

    // Check for duplicate URL
    const existing = store.data.bookmarks.find((b) => b.url === url)
    if (existing) {
      return {
        success: false,
        message: `Bookmark already exists: "${existing.title}"`,
        data: { existingId: existing.id },
      }
    }

    const bookmark: Bookmark = {
      id: generateId(),
      url,
      title,
      description,
      domain,
      collection,
      tags,
      isRead: false,
      createdAt: new Date(),
      linkedTaskId,
    }

    store.data.bookmarks.unshift(bookmark)
    await saveStore()

    return {
      success: true,
      message: `Bookmark saved: "${title}"`,
      data: { id: bookmark.id, title, url, collection },
    }
  },

  search_bookmarks: async (args) => {
    const query = sanitize(args.query)?.toLowerCase()
    if (!isNonEmptyString(query)) {
      return { success: false, message: 'Search query is required' }
    }

    const collection = sanitize(args.collection)
    const limit = typeof args.limit === 'number' ? args.limit : 20
    const store = getStore()

    let results = store.data.bookmarks.filter((b) => {
      const titleMatch = b.title.toLowerCase().includes(query)
      const urlMatch = b.url.toLowerCase().includes(query)
      const descMatch = b.description?.toLowerCase().includes(query)
      const tagMatch = b.tags.some((t) => t.toLowerCase().includes(query))
      return titleMatch || urlMatch || descMatch || tagMatch
    })

    if (collection) {
      results = results.filter((b) => b.collection === collection)
    }

    results = results.slice(0, limit)

    return {
      success: true,
      message: `Found ${results.length} bookmarks matching "${query}"`,
      data: results.map((b) => ({
        id: b.id,
        title: b.title,
        url: b.url,
        domain: b.domain,
        collection: b.collection,
        tags: b.tags,
        isRead: b.isRead,
      })),
    }
  },

  list_bookmarks: async (args) => {
    const collection = sanitize(args.collection)
    const tag = sanitize(args.tag)
    const unread = args.unread === true
    const limit = typeof args.limit === 'number' ? args.limit : 50
    const store = getStore()

    let bookmarks = [...store.data.bookmarks]

    if (collection) {
      bookmarks = bookmarks.filter((b) => b.collection === collection)
    }

    if (tag) {
      bookmarks = bookmarks.filter((b) => b.tags.includes(tag))
    }

    if (unread) {
      bookmarks = bookmarks.filter((b) => !b.isRead)
    }

    bookmarks = bookmarks.slice(0, limit)

    // Get collection stats
    const collections: Record<string, number> = {}
    store.data.bookmarks.forEach((b) => {
      const col = b.collection || 'Unsorted'
      collections[col] = (collections[col] || 0) + 1
    })

    return {
      success: true,
      message: `Found ${bookmarks.length} bookmarks`,
      data: {
        bookmarks: bookmarks.map((b) => ({
          id: b.id,
          title: b.title,
          url: b.url,
          domain: b.domain,
          collection: b.collection,
          tags: b.tags,
          isRead: b.isRead,
          createdAt: b.createdAt,
        })),
        collections,
      },
    }
  },

  update_bookmark: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Bookmark ID is required' }
    }

    const store = getStore()
    const bookmarkIndex = store.data.bookmarks.findIndex((b) => b.id === id)

    if (bookmarkIndex === -1) {
      return { success: false, message: `Bookmark not found: ${id}` }
    }

    const bookmark = store.data.bookmarks[bookmarkIndex]
    const updates: Partial<Bookmark> = {}

    if (args.title !== undefined) updates.title = sanitize(args.title)
    if (args.description !== undefined) updates.description = sanitize(args.description)
    if (args.collection !== undefined) updates.collection = sanitize(args.collection)
    if (args.tags !== undefined) updates.tags = parseTags(args.tags)
    if (args.isRead !== undefined) updates.isRead = args.isRead === true

    store.data.bookmarks[bookmarkIndex] = { ...bookmark, ...updates }
    await saveStore()

    return {
      success: true,
      message: `Bookmark updated: "${store.data.bookmarks[bookmarkIndex].title}"`,
      data: { id },
    }
  },

  delete_bookmark: async (args) => {
    const id = sanitize(args.id)
    if (!isNonEmptyString(id)) {
      return { success: false, message: 'Bookmark ID is required' }
    }

    const store = getStore()
    const bookmarkIndex = store.data.bookmarks.findIndex((b) => b.id === id)

    if (bookmarkIndex === -1) {
      return { success: false, message: `Bookmark not found: ${id}` }
    }

    const bookmark = store.data.bookmarks[bookmarkIndex]
    store.data.bookmarks.splice(bookmarkIndex, 1)
    await saveStore()

    return {
      success: true,
      message: `Bookmark deleted: "${bookmark.title}"`,
      data: { id, title: bookmark.title },
    }
  },
}
