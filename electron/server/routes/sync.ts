import { Router, Request, Response } from 'express';
import { storeBridge } from '../bridges/storeBridge';
import { logger } from '../utils/logger';
import { BrowserWindow, ipcMain } from 'electron';

const router = Router();

// Sync status tracking
let syncStatus = {
  lastSync: null as string | null,
  syncInProgress: false,
  lastError: null as string | null,
  pendingChanges: false,
};

// Get main window for sending sync commands
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

// Sync command via IPC
async function sendSyncCommand(command: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const window = getMainWindow();
    if (!window) {
      resolve({ success: false, error: 'Main window not available' });
      return;
    }

    const requestId = `sync_${Date.now()}`;

    const timeout = setTimeout(() => {
      ipcMain.removeAllListeners(`sync:response:${requestId}`);
      resolve({ success: false, error: 'Sync operation timed out' });
    }, 30000); // 30 second timeout

    ipcMain.once(`sync:response:${requestId}`, (_, success: boolean, error?: string) => {
      clearTimeout(timeout);
      resolve({ success, error });
    });

    window.webContents.send(`sync:${command}`, requestId);
  });
}

// GET /api/sync/status - Get current sync status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const settings = await storeBridge.getState('settings') as {
      gistSync?: {
        enabled: boolean;
        gistId?: string;
        lastSync?: string;
      };
    };

    const gistSync = settings?.gistSync || { enabled: false };

    res.json({
      success: true,
      data: {
        gistEnabled: gistSync.enabled,
        gistId: gistSync.gistId || null,
        lastSync: gistSync.lastSync || syncStatus.lastSync,
        syncInProgress: syncStatus.syncInProgress,
        pendingChanges: syncStatus.pendingChanges,
        lastError: syncStatus.lastError,
      },
    });
  } catch (error) {
    logger.error('Failed to get sync status:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// GET /api/sync/gist-info - Get Gist information
router.get('/gist-info', async (req: Request, res: Response) => {
  try {
    const settings = await storeBridge.getState('settings') as {
      gistSync?: {
        enabled: boolean;
        gistId?: string;
        token?: string;
        lastSync?: string;
      };
    };

    const gistSync = settings?.gistSync;

    if (!gistSync?.enabled || !gistSync.gistId) {
      return res.status(404).json({
        success: false,
        error: 'Gist sync not configured',
      });
    }

    res.json({
      success: true,
      data: {
        gistId: gistSync.gistId,
        lastSync: gistSync.lastSync,
        tokenConfigured: !!gistSync.token,
      },
    });
  } catch (error) {
    logger.error('Failed to get gist info:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/sync/push - Force push to Gist
router.post('/push', async (req: Request, res: Response) => {
  try {
    if (syncStatus.syncInProgress) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress',
      });
    }

    syncStatus.syncInProgress = true;
    syncStatus.lastError = null;

    logger.info('Starting force push to Gist...');

    const result = await sendSyncCommand('forcePush');

    syncStatus.syncInProgress = false;

    if (result.success) {
      syncStatus.lastSync = new Date().toISOString();
      syncStatus.pendingChanges = false;
      logger.info('Force push completed successfully');
    } else {
      syncStatus.lastError = result.error || 'Unknown error';
      logger.error('Force push failed:', result.error);
    }

    res.json({
      success: result.success,
      message: result.success ? 'Push completed' : 'Push failed',
      error: result.error,
      timestamp: syncStatus.lastSync,
    });
  } catch (error) {
    syncStatus.syncInProgress = false;
    syncStatus.lastError = (error as Error).message;
    logger.error('Failed to push to Gist:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/sync/pull - Force pull from Gist
router.post('/pull', async (req: Request, res: Response) => {
  try {
    if (syncStatus.syncInProgress) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress',
      });
    }

    syncStatus.syncInProgress = true;
    syncStatus.lastError = null;

    logger.info('Starting force pull from Gist...');

    const result = await sendSyncCommand('forcePull');

    syncStatus.syncInProgress = false;

    if (result.success) {
      syncStatus.lastSync = new Date().toISOString();
      logger.info('Force pull completed successfully');
    } else {
      syncStatus.lastError = result.error || 'Unknown error';
      logger.error('Force pull failed:', result.error);
    }

    res.json({
      success: result.success,
      message: result.success ? 'Pull completed' : 'Pull failed',
      error: result.error,
      timestamp: syncStatus.lastSync,
    });
  } catch (error) {
    syncStatus.syncInProgress = false;
    syncStatus.lastError = (error as Error).message;
    logger.error('Failed to pull from Gist:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// POST /api/sync/trigger - Trigger smart sync
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    if (syncStatus.syncInProgress) {
      return res.status(409).json({
        success: false,
        error: 'Sync already in progress',
      });
    }

    syncStatus.syncInProgress = true;
    syncStatus.lastError = null;

    logger.info('Starting smart sync...');

    const result = await sendSyncCommand('smartSync');

    syncStatus.syncInProgress = false;

    if (result.success) {
      syncStatus.lastSync = new Date().toISOString();
      syncStatus.pendingChanges = false;
      logger.info('Smart sync completed successfully');
    } else {
      syncStatus.lastError = result.error || 'Unknown error';
      logger.error('Smart sync failed:', result.error);
    }

    res.json({
      success: result.success,
      message: result.success ? 'Sync completed' : 'Sync failed',
      error: result.error,
      timestamp: syncStatus.lastSync,
    });
  } catch (error) {
    syncStatus.syncInProgress = false;
    syncStatus.lastError = (error as Error).message;
    logger.error('Failed to trigger sync:', error);
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});

// Mark pending changes (called internally when data is modified via API)
export function markPendingChanges() {
  syncStatus.pendingChanges = true;
}

export default router;
