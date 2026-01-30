/**
 * File-based Store Bridge for Docker
 * Reads/writes JSON files instead of IPC to Electron
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

type StoreChangeCallback = (storeName: string, action: string, data: unknown) => void;

let dataDir = '/app/data';
const storeChangeCallbacks: StoreChangeCallback[] = [];

// Store file mapping
const storeFiles: Record<string, string> = {
  notes: 'notes.json',
  tasks: 'tasks.json',
  habits: 'habits.json',
  journal: 'journal.json',
  bookmarks: 'bookmarks.json',
  ideas: 'ideas.json',
  dailyNotes: 'dailyNotes.json',
  focus: 'focus.json',
  gamification: 'gamification.json',
};

// Initialize data directory
export async function initializeStore(dir: string): Promise<void> {
  dataDir = dir;

  // Ensure directory exists
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    logger.error('Failed to create data directory:', err);
  }

  // Initialize empty files if they don't exist
  for (const [storeName, fileName] of Object.entries(storeFiles)) {
    const filePath = path.join(dataDir, fileName);
    try {
      await fs.access(filePath);
    } catch {
      // File doesn't exist, create empty array/object
      const initialData = storeName === 'gamification' || storeName === 'focus' ? {} : [];
      await fs.writeFile(filePath, JSON.stringify(initialData, null, 2));
      logger.debug(`Initialized ${fileName}`);
    }
  }
}

// Read store data
async function readStore(storeName: string): Promise<unknown[]> {
  const fileName = storeFiles[storeName];
  if (!fileName) {
    throw new Error(`Unknown store: ${storeName}`);
  }

  const filePath = path.join(dataDir, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    logger.error(`Failed to read ${storeName}:`, err);
    return [];
  }
}

// Write store data
async function writeStore(storeName: string, data: unknown): Promise<void> {
  const fileName = storeFiles[storeName];
  if (!fileName) {
    throw new Error(`Unknown store: ${storeName}`);
  }

  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

// Emit store change
function emitChange(storeName: string, action: string, data: unknown) {
  storeChangeCallbacks.forEach((callback) => callback(storeName, action, data));
}

// Store bridge interface (matches Electron version)
export const fileStoreBridge = {
  // Get all items from a store
  async getAll(storeName: string): Promise<unknown[]> {
    const data = await readStore(storeName);
    return Array.isArray(data) ? data : [];
  },

  // Get single item by ID
  async getById(storeName: string, id: string): Promise<unknown | null> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) return null;
    return data.find((item: { id?: string }) => item.id === id) || null;
  },

  // Get store state (for non-array stores like gamification)
  async getState(storeName: string): Promise<unknown> {
    const fileName = storeFiles[storeName];
    if (!fileName) return null;

    const filePath = path.join(dataDir, fileName);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  // Create new item
  async create(storeName: string, item: unknown): Promise<unknown> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) {
      throw new Error(`Store ${storeName} is not an array`);
    }

    const newItem = {
      ...(item as object),
      id: (item as { id?: string }).id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.push(newItem);
    await writeStore(storeName, data);
    emitChange(storeName, 'created', newItem);
    return newItem;
  },

  // Update existing item
  async update(storeName: string, id: string, updates: unknown): Promise<unknown | null> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) return null;

    const index = data.findIndex((item: { id?: string }) => item.id === id);
    if (index === -1) return null;

    const updatedItem = {
      ...data[index],
      ...(updates as object),
      updatedAt: new Date().toISOString(),
    };

    data[index] = updatedItem;
    await writeStore(storeName, data);
    emitChange(storeName, 'updated', updatedItem);
    return updatedItem;
  },

  // Delete item
  async delete(storeName: string, id: string): Promise<boolean> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) return false;

    const index = data.findIndex((item: { id?: string }) => item.id === id);
    if (index === -1) return false;

    data.splice(index, 1);
    await writeStore(storeName, data);
    emitChange(storeName, 'deleted', { id });
    return true;
  },

  // Search items
  async search(storeName: string, query: string): Promise<unknown[]> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) return [];

    const lowerQuery = query.toLowerCase();
    return data.filter((item: Record<string, unknown>) => {
      const searchableFields = ['title', 'content', 'description', 'name'];
      return searchableFields.some((field) => {
        const value = item[field];
        return typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
      });
    });
  },

  // Bulk import
  async bulkImport(storeName: string, items: unknown[]): Promise<number> {
    const data = await readStore(storeName);
    if (!Array.isArray(data)) return 0;

    let imported = 0;
    for (const item of items) {
      const newItem = {
        ...(item as object),
        id: (item as { id?: string }).id || generateId(),
        createdAt: (item as { createdAt?: string }).createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.push(newItem);
      imported++;
    }

    await writeStore(storeName, data);
    emitChange(storeName, 'bulk_imported', { count: imported });
    return imported;
  },
};

// Register change callback
export function onStoreChange(callback: StoreChangeCallback) {
  storeChangeCallbacks.push(callback);
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
