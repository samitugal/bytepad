// Gist Sync Tools for MCP Server

import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { getStore, getGistConfig, updateGistConfig, saveGistConfig, countItems, type ToolResult } from '../store/index.js'
import {
  validateToken,
  validateGist,
  createGist,
  pullFromGist,
  pushToGist,
  smartSync,
  getSyncStatus,
} from '../sync/index.js'
import { configureSyncSettings, startAutoSync, stopAutoSync } from '../sync/syncManager.js'
import { isNonEmptyString, sanitize } from '../utils/index.js'

// Tool definitions
export const syncToolDefinitions: Tool[] = [
  {
    name: 'gist_configure',
    description: 'Configure Gist sync settings (GitHub token and Gist ID)',
    inputSchema: {
      type: 'object',
      properties: {
        token: { type: 'string', description: 'GitHub personal access token (with gist scope)' },
        gistId: { type: 'string', description: 'Existing Gist ID to use' },
        autoSync: { type: 'boolean', description: 'Enable automatic sync (default: false)' },
        syncInterval: { type: 'number', description: 'Sync interval in minutes (default: 5)' },
      },
    },
  },
  {
    name: 'gist_status',
    description: 'Get current Gist sync status and configuration',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gist_validate',
    description: 'Validate GitHub token and Gist access',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gist_create',
    description: 'Create a new Gist for Bytepad data',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Gist description (default: "Bytepad Data")' },
        public: { type: 'boolean', description: 'Make Gist public (default: false)' },
      },
    },
  },
  {
    name: 'gist_pull',
    description: 'Pull data from Gist (overwrites local data)',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force pull even if remote has less data (default: false)',
        },
      },
    },
  },
  {
    name: 'gist_push',
    description: 'Push local data to Gist',
    inputSchema: {
      type: 'object',
      properties: {
        force: {
          type: 'boolean',
          description: 'Force push even if local has less data (default: false)',
        },
        createIfMissing: {
          type: 'boolean',
          description: 'Create Gist if not configured (default: false)',
        },
      },
    },
  },
  {
    name: 'gist_sync',
    description: 'Smart sync - pull if remote is newer, push if local is newer',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'gist_export',
    description: 'Export all data as JSON (returns data without pushing to Gist)',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['full', 'minimal'],
          description: 'full = with metadata, minimal = data only (default: full)',
        },
      },
    },
  },
]

// Tool executors
export const syncToolExecutors: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>> = {
  gist_configure: async (args) => {
    const updates: Record<string, unknown> = {}

    if (args.token !== undefined) {
      const token = sanitize(args.token)
      if (isNonEmptyString(token)) {
        updates.token = token
      }
    }

    if (args.gistId !== undefined) {
      const gistId = sanitize(args.gistId)
      if (isNonEmptyString(gistId)) {
        updates.gistId = gistId
      }
    }

    if (args.autoSync !== undefined) {
      updates.autoSync = args.autoSync === true
    }

    if (args.syncInterval !== undefined && typeof args.syncInterval === 'number') {
      updates.syncInterval = Math.max(1, args.syncInterval)
    }

    if (Object.keys(updates).length === 0) {
      return { success: false, message: 'No valid configuration provided' }
    }

    const result = await configureSyncSettings(updates)

    // If auto-sync changed, start/stop accordingly
    if (updates.autoSync === true) {
      startAutoSync()
    } else if (updates.autoSync === false) {
      stopAutoSync()
    }

    return {
      success: result.success,
      message: result.message,
      data: {
        configured: Object.keys(updates),
        status: getSyncStatus(),
      },
    }
  },

  gist_status: async () => {
    const status = getSyncStatus()
    const itemCount = countItems()

    return {
      success: true,
      message: status.configured ? 'Gist sync is configured' : 'Gist sync is not configured',
      data: {
        ...status,
        localItems: itemCount,
      },
    }
  },

  gist_validate: async () => {
    const config = getGistConfig()

    if (!config.token) {
      return {
        success: false,
        message: 'GitHub token not configured',
        data: { tokenValid: false, gistAccessible: false },
      }
    }

    const tokenResult = await validateToken(config.token)

    if (!tokenResult.valid) {
      return {
        success: false,
        message: tokenResult.message,
        data: { tokenValid: false, gistAccessible: false },
      }
    }

    if (!config.gistId) {
      return {
        success: true,
        message: `Token valid for ${tokenResult.username}, but no Gist ID configured`,
        data: {
          tokenValid: true,
          username: tokenResult.username,
          scopes: tokenResult.scopes,
          gistAccessible: false,
        },
      }
    }

    const gistResult = await validateGist(config.token, config.gistId)

    return {
      success: true,
      message: gistResult.accessible
        ? `Token valid for ${tokenResult.username}, Gist accessible`
        : `Token valid, but Gist not accessible`,
      data: {
        tokenValid: true,
        username: tokenResult.username,
        scopes: tokenResult.scopes,
        gistAccessible: gistResult.accessible,
        isOwner: gistResult.isOwner,
      },
    }
  },

  gist_create: async (args) => {
    const description = sanitize(args.description) || 'Bytepad Data'
    const isPublic = args.public === true

    const result = await createGist(description, isPublic)

    return {
      success: result.success,
      message: result.message,
      data: result.success
        ? { gistId: result.gistId, url: result.url }
        : undefined,
    }
  },

  gist_pull: async (args) => {
    const force = args.force === true

    const result = await pullFromGist(force)

    return {
      success: result.success,
      message: result.message,
      data: result.success
        ? { itemCount: result.itemCount }
        : undefined,
    }
  },

  gist_push: async (args) => {
    const force = args.force === true
    const createIfMissing = args.createIfMissing === true

    const result = await pushToGist(force, createIfMissing)

    return {
      success: result.success,
      message: result.message,
      data: result.gistId ? { gistId: result.gistId } : undefined,
    }
  },

  gist_sync: async () => {
    const result = await smartSync()

    return {
      success: result.success,
      message: result.message,
      data: { action: result.action },
    }
  },

  gist_export: async (args) => {
    const format = args.format === 'minimal' ? 'minimal' : 'full'
    const store = getStore()
    const itemCount = countItems()

    const data = format === 'full' ? store : store.data

    return {
      success: true,
      message: `Exported ${itemCount.total} items`,
      data: {
        format,
        itemCount,
        exportedAt: new Date().toISOString(),
        data,
      },
    }
  },
}
