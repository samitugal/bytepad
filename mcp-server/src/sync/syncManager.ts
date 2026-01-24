// Sync Manager - handles auto-sync scheduling

import { getGistConfig, updateGistConfig, saveGistConfig } from '../store/index.js'
import { smartSync } from './gistService.js'
import { logger } from '../utils/logger.js'

let syncInterval: NodeJS.Timeout | null = null

// Start auto-sync scheduler
export function startAutoSync(): void {
  const config = getGistConfig()

  if (!config.autoSync || !config.token || !config.gistId) {
    logger.info('Auto-sync not enabled or not configured')
    return
  }

  // Clear existing interval
  stopAutoSync()

  const intervalMs = config.syncInterval * 60 * 1000 // Convert minutes to ms

  syncInterval = setInterval(async () => {
    logger.debug('Running scheduled sync...')
    try {
      const result = await smartSync()
      logger.info(`Auto-sync completed: ${result.action}`)
    } catch (error) {
      logger.error('Auto-sync failed', error)
    }
  }, intervalMs)

  logger.info(`Auto-sync started: every ${config.syncInterval} minutes`)
}

// Stop auto-sync scheduler
export function stopAutoSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
    logger.info('Auto-sync stopped')
  }
}

// Configure sync settings
export async function configureSyncSettings(settings: {
  token?: string
  gistId?: string
  autoSync?: boolean
  syncInterval?: number
}): Promise<{
  success: boolean
  message: string
}> {
  try {
    updateGistConfig(settings)
    await saveGistConfig()

    // Restart auto-sync if settings changed
    if (settings.autoSync !== undefined || settings.syncInterval !== undefined) {
      stopAutoSync()
      if (getGistConfig().autoSync) {
        startAutoSync()
      }
    }

    return { success: true, message: 'Sync settings updated' }
  } catch (error) {
    return { success: false, message: `Failed to update settings: ${error}` }
  }
}

// Initialize sync on startup
export async function initializeSync(): Promise<void> {
  const config = getGistConfig()

  if (config.autoSync && config.token && config.gistId) {
    // Do initial sync
    try {
      logger.info('Performing initial sync...')
      const result = await smartSync()
      logger.info(`Initial sync: ${result.action} - ${result.message}`)
    } catch (error) {
      logger.error('Initial sync failed', error)
    }

    // Start scheduler
    startAutoSync()
  }
}
