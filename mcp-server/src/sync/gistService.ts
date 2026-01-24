// GitHub Gist Sync Service

import {
  getStore,
  setStoreData,
  saveStore,
  getGistConfig,
  updateGistConfig,
  saveGistConfig,
  countItems,
  type StoreData,
} from '../store/index.js'
import { logger } from '../utils/logger.js'

const GITHUB_API = 'https://api.github.com'

interface GistFile {
  filename: string
  content: string
}

interface GistResponse {
  id: string
  html_url: string
  files: Record<string, GistFile>
  updated_at: string
  owner?: { login: string }
}

interface GitHubUser {
  login: string
}

// Validate GitHub token
export async function validateToken(token: string): Promise<{
  valid: boolean
  username?: string
  scopes?: string[]
  message: string
}> {
  try {
    const response = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return { valid: false, message: `Invalid token: ${response.status}` }
    }

    const user = await response.json() as GitHubUser
    const scopes = response.headers.get('x-oauth-scopes')?.split(', ') || []

    return {
      valid: true,
      username: user.login,
      scopes,
      message: `Token valid for user: ${user.login}`,
    }
  } catch (error) {
    return { valid: false, message: `Validation failed: ${error}` }
  }
}

// Validate Gist access
export async function validateGist(token: string, gistId: string): Promise<{
  accessible: boolean
  isOwner: boolean
  message: string
}> {
  try {
    const response = await fetch(`${GITHUB_API}/gists/${gistId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return { accessible: false, isOwner: false, message: `Gist not accessible: ${response.status}` }
    }

    const gist = await response.json() as GistResponse
    const userResponse = await fetch(`${GITHUB_API}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })
    const user = await userResponse.json() as GitHubUser

    const isOwner = gist.owner?.login === user.login

    return {
      accessible: true,
      isOwner,
      message: isOwner ? 'Gist accessible (owner)' : 'Gist accessible (not owner)',
    }
  } catch (error) {
    return { accessible: false, isOwner: false, message: `Validation failed: ${error}` }
  }
}

// Create new Gist
export async function createGist(
  description = 'Bytepad Data',
  isPublic = false
): Promise<{
  success: boolean
  gistId?: string
  url?: string
  message: string
}> {
  const config = getGistConfig()

  if (!config.token) {
    return { success: false, message: 'GitHub token not configured' }
  }

  try {
    const store = getStore()

    const response = await fetch(`${GITHUB_API}/gists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description,
        public: isPublic,
        files: {
          'bytepad-data.json': {
            content: JSON.stringify(store, null, 2),
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, message: `Failed to create Gist: ${response.status} - ${error}` }
    }

    const gist = await response.json() as GistResponse

    // Update config with new Gist ID
    updateGistConfig({ gistId: gist.id, lastSyncAt: new Date().toISOString() })
    await saveGistConfig()

    logger.info('Created new Gist', { gistId: gist.id })

    return {
      success: true,
      gistId: gist.id,
      url: gist.html_url,
      message: `Created Gist: ${gist.id}`,
    }
  } catch (error) {
    logger.error('Failed to create Gist', error)
    return { success: false, message: `Create failed: ${error}` }
  }
}

// Read from Gist
export async function readFromGist(): Promise<{
  success: boolean
  data?: StoreData
  message: string
}> {
  const config = getGistConfig()

  if (!config.token || !config.gistId) {
    return { success: false, message: 'Gist not configured (token or gistId missing)' }
  }

  try {
    const response = await fetch(`${GITHUB_API}/gists/${config.gistId}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    })

    if (!response.ok) {
      return { success: false, message: `Failed to read Gist: ${response.status}` }
    }

    const gist = await response.json() as GistResponse
    const content = gist.files['bytepad-data.json']?.content

    if (!content) {
      return { success: false, message: 'No bytepad-data.json file in Gist' }
    }

    const data: StoreData = JSON.parse(content)
    return { success: true, data, message: 'Read from Gist successfully' }
  } catch (error) {
    logger.error('Failed to read from Gist', error)
    return { success: false, message: `Read failed: ${error}` }
  }
}

// Write to Gist
export async function writeToGist(): Promise<{
  success: boolean
  message: string
}> {
  const config = getGistConfig()

  if (!config.token || !config.gistId) {
    return { success: false, message: 'Gist not configured (token or gistId missing)' }
  }

  try {
    const store = getStore()

    const response = await fetch(`${GITHUB_API}/gists/${config.gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'bytepad-data.json': {
            content: JSON.stringify(store, null, 2),
          },
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      return { success: false, message: `Failed to write Gist: ${response.status} - ${error}` }
    }

    // Update last sync time
    updateGistConfig({ lastSyncAt: new Date().toISOString() })
    await saveGistConfig()

    logger.info('Wrote to Gist successfully')
    return { success: true, message: 'Pushed to Gist successfully' }
  } catch (error) {
    logger.error('Failed to write to Gist', error)
    return { success: false, message: `Write failed: ${error}` }
  }
}

// Pull from Gist (overwrites local)
export async function pullFromGist(force = false): Promise<{
  success: boolean
  message: string
  itemCount?: number
}> {
  const readResult = await readFromGist()

  if (!readResult.success || !readResult.data) {
    return { success: false, message: readResult.message }
  }

  const remoteData = readResult.data
  const localCount = countItems()

  // Safety check: warn if remote has significantly less data
  if (!force) {
    const remoteItems = Object.values(remoteData.data).reduce((sum: number, arr: unknown) => {
      return sum + (Array.isArray(arr) ? arr.length : 0)
    }, 0)

    if (remoteItems < localCount.total * 0.5 && localCount.total > 10) {
      return {
        success: false,
        message: `Warning: Remote has ${remoteItems} items, local has ${localCount.total}. Use force=true to override.`,
      }
    }
  }

  // Apply remote data
  setStoreData(remoteData)
  await saveStore()

  const newCount = countItems()

  logger.info('Pulled from Gist', { items: newCount.total })

  return {
    success: true,
    message: `Pulled from Gist: ${newCount.total} items`,
    itemCount: newCount.total,
  }
}

// Push to Gist
export async function pushToGist(force = false, createIfMissing = false): Promise<{
  success: boolean
  message: string
  gistId?: string
}> {
  const config = getGistConfig()

  if (!config.token) {
    return { success: false, message: 'GitHub token not configured' }
  }

  // Create Gist if needed
  if (!config.gistId && createIfMissing) {
    const createResult = await createGist()
    if (!createResult.success) {
      return createResult
    }
    return {
      success: true,
      message: `Created and pushed to new Gist`,
      gistId: createResult.gistId,
    }
  }

  if (!config.gistId) {
    return { success: false, message: 'Gist ID not configured. Use createIfMissing=true to create one.' }
  }

  // Data validation before push
  if (!force) {
    const readResult = await readFromGist()
    if (readResult.success && readResult.data) {
      const localCount = countItems()
      const remoteItems = Object.values(readResult.data.data).reduce((sum: number, arr: unknown) => {
        return sum + (Array.isArray(arr) ? arr.length : 0)
      }, 0)

      if (localCount.total < remoteItems * 0.5 && remoteItems > 10) {
        return {
          success: false,
          message: `Warning: Local has ${localCount.total} items, remote has ${remoteItems}. Use force=true to override.`,
        }
      }
    }
  }

  return await writeToGist()
}

// Smart sync (pull if remote newer, push if local newer)
export async function smartSync(): Promise<{
  success: boolean
  action: 'pull' | 'push' | 'none'
  message: string
}> {
  const config = getGistConfig()

  if (!config.token || !config.gistId) {
    return { success: false, action: 'none', message: 'Gist not configured' }
  }

  const readResult = await readFromGist()

  if (!readResult.success || !readResult.data) {
    // Remote doesn't exist or error, push local
    const pushResult = await writeToGist()
    return {
      success: pushResult.success,
      action: 'push',
      message: pushResult.message,
    }
  }

  const localStore = getStore()
  const remoteData = readResult.data

  const localModified = new Date(localStore.lastModified).getTime()
  const remoteModified = new Date(remoteData.lastModified).getTime()

  if (remoteModified > localModified) {
    // Remote is newer, pull
    setStoreData(remoteData)
    await saveStore()
    logger.info('Smart sync: pulled (remote newer)')
    return { success: true, action: 'pull', message: 'Pulled from Gist (remote was newer)' }
  } else if (localModified > remoteModified) {
    // Local is newer, push
    const pushResult = await writeToGist()
    logger.info('Smart sync: pushed (local newer)')
    return { success: pushResult.success, action: 'push', message: 'Pushed to Gist (local was newer)' }
  } else {
    // Same, no action needed
    return { success: true, action: 'none', message: 'Already in sync' }
  }
}

// Get sync status
export function getSyncStatus(): {
  configured: boolean
  gistId: string | null
  lastSyncAt: string | null
  autoSync: boolean
  syncInterval: number
} {
  const config = getGistConfig()
  return {
    configured: !!(config.token && config.gistId),
    gistId: config.gistId,
    lastSyncAt: config.lastSyncAt,
    autoSync: config.autoSync,
    syncInterval: config.syncInterval,
  }
}
