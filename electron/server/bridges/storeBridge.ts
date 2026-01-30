import { ipcMain, BrowserWindow } from 'electron';
import { logger } from '../utils/logger';

// Store names that can be accessed via bridge
export type StoreName =
  | 'notes'
  | 'tasks'
  | 'habits'
  | 'journal'
  | 'bookmarks'
  | 'ideas'
  | 'dailyNotes'
  | 'focus'
  | 'gamification'
  | 'settings';

// Pending requests for request/response pattern
const pendingRequests = new Map<string, {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}>();

let requestCounter = 0;

function generateRequestId(): string {
  return `req_${Date.now()}_${++requestCounter}`;
}

export function setupStoreBridge(mainWindow: BrowserWindow) {
  // Handle responses from renderer
  ipcMain.on('store:response', (_, requestId: string, data: unknown, error?: string) => {
    const pending = pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pendingRequests.delete(requestId);

      if (error) {
        pending.reject(new Error(error));
      } else {
        pending.resolve(data);
      }
    }
  });

  // Listen for store changes from renderer (for WebSocket broadcast)
  ipcMain.on('store:changed', (_, storeName: StoreName, action: string, data: unknown) => {
    logger.debug(`Store changed: ${storeName}.${action}`);
    // This will be used by WebSocket to broadcast changes
    storeChangeListeners.forEach(listener => listener(storeName, action, data));
  });
}

// Store change listeners for WebSocket broadcast
type StoreChangeListener = (storeName: StoreName, action: string, data: unknown) => void;
const storeChangeListeners: Set<StoreChangeListener> = new Set();

export function onStoreChange(listener: StoreChangeListener): () => void {
  storeChangeListeners.add(listener);
  return () => storeChangeListeners.delete(listener);
}

// Send request to renderer and wait for response
async function sendToRenderer<T>(
  mainWindow: BrowserWindow,
  channel: string,
  ...args: unknown[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    const requestId = generateRequestId();

    const timeout = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(new Error(`Request ${requestId} timed out`));
    }, 10000); // 10 second timeout

    pendingRequests.set(requestId, { resolve: resolve as (value: unknown) => void, reject, timeout });

    mainWindow.webContents.send(channel, requestId, ...args);
  });
}

// Get main window reference
let mainWindowRef: BrowserWindow | null = null;

export function setMainWindow(window: BrowserWindow) {
  mainWindowRef = window;
}

function getMainWindow(): BrowserWindow {
  if (!mainWindowRef || mainWindowRef.isDestroyed()) {
    throw new Error('Main window not available');
  }
  return mainWindowRef;
}

// Store access methods
export const storeBridge = {
  // Get all data from a store
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const window = getMainWindow();
    return sendToRenderer<T[]>(window, 'store:getAll', storeName);
  },

  // Get single item by ID
  async getById<T>(storeName: StoreName, id: string): Promise<T | null> {
    const window = getMainWindow();
    return sendToRenderer<T | null>(window, 'store:getById', storeName, id);
  },

  // Create new item
  async create<T>(storeName: StoreName, data: Partial<T>): Promise<T> {
    const window = getMainWindow();
    return sendToRenderer<T>(window, 'store:create', storeName, data);
  },

  // Update existing item
  async update<T>(storeName: StoreName, id: string, data: Partial<T>): Promise<T> {
    const window = getMainWindow();
    return sendToRenderer<T>(window, 'store:update', storeName, id, data);
  },

  // Delete item
  async delete(storeName: StoreName, id: string): Promise<boolean> {
    const window = getMainWindow();
    return sendToRenderer<boolean>(window, 'store:delete', storeName, id);
  },

  // Execute store action
  async action<T>(storeName: StoreName, actionName: string, ...args: unknown[]): Promise<T> {
    const window = getMainWindow();
    return sendToRenderer<T>(window, 'store:action', storeName, actionName, ...args);
  },

  // Search across store
  async search<T>(storeName: StoreName, query: string): Promise<T[]> {
    const window = getMainWindow();
    return sendToRenderer<T[]>(window, 'store:search', storeName, query);
  },

  // Get store state (for sync status, etc.)
  async getState(storeName: StoreName): Promise<unknown> {
    const window = getMainWindow();
    return sendToRenderer<unknown>(window, 'store:getState', storeName);
  },
};

export default storeBridge;
