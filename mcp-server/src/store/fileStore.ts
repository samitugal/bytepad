import fs from 'fs/promises'
import path from 'path'
import type { StoreData, GistConfig } from './types.js'

const DATA_DIR = process.env.DATA_DIR || './data'
const DATA_FILE = path.join(DATA_DIR, 'bytepad-data.json')
const CONFIG_FILE = path.join(DATA_DIR, 'gist-config.json')

let store: StoreData | null = null
let gistConfig: GistConfig | null = null

// Default empty store
function createEmptyStore(): StoreData {
  return {
    version: 1,
    lastModified: new Date().toISOString(),
    data: {
      notes: [],
      tasks: [],
      habits: [],
      journal: [],
      bookmarks: [],
      dailyNotes: [],
      ideas: [],
      focusSessions: [],
      gamification: {
        level: 1,
        currentXP: 0,
        totalXP: 0,
        tasksCompleted: 0,
        tasksCompletedToday: 0,
        habitsCompleted: 0,
        habitsCompletedToday: 0,
        pomodorosCompleted: 0,
        notesCreated: 0,
        journalEntries: 0,
        perfectDays: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastActiveDate: null,
        achievements: [],
      },
      focusStats: {
        totalSessions: 0,
        totalFocusTime: 0,
        todayFocusTime: 0,
        weekFocusTime: 0,
        averageSessionLength: 0,
        longestSession: 0,
        sessionsPerTask: {},
      },
    },
  }
}

function createDefaultGistConfig(): GistConfig {
  return {
    token: process.env.GITHUB_TOKEN || null,
    gistId: process.env.GIST_ID || null,
    autoSync: false,
    syncInterval: 5,
    lastSyncAt: null,
  }
}

// Ensure data directory exists
async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {
    // Directory already exists
  }
}

// Load store from file
export async function loadStore(): Promise<StoreData> {
  await ensureDataDir()

  try {
    const content = await fs.readFile(DATA_FILE, 'utf-8')
    store = JSON.parse(content)
    return store!
  } catch {
    // File doesn't exist or is invalid, create empty store
    store = createEmptyStore()
    await saveStore()
    return store
  }
}

// Save store to file
export async function saveStore(): Promise<void> {
  if (!store) return

  await ensureDataDir()
  store.lastModified = new Date().toISOString()
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2))
}

// Get store (throws if not initialized)
export function getStore(): StoreData {
  if (!store) {
    throw new Error('Store not initialized. Call loadStore() first.')
  }
  return store
}

// Set store data (for imports/syncs)
export function setStoreData(data: StoreData): void {
  store = data
}

// Load Gist config
export async function loadGistConfig(): Promise<GistConfig> {
  await ensureDataDir()

  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8')
    gistConfig = JSON.parse(content)
    // Override with env vars if present
    if (process.env.GITHUB_TOKEN) {
      gistConfig!.token = process.env.GITHUB_TOKEN
    }
    if (process.env.GIST_ID) {
      gistConfig!.gistId = process.env.GIST_ID
    }
    return gistConfig!
  } catch {
    gistConfig = createDefaultGistConfig()
    await saveGistConfig()
    return gistConfig
  }
}

// Save Gist config
export async function saveGistConfig(): Promise<void> {
  if (!gistConfig) return

  await ensureDataDir()
  // Don't save token to file (keep in memory only from env)
  const configToSave = {
    ...gistConfig,
    token: null, // Never persist token
  }
  await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2))
}

// Get Gist config
export function getGistConfig(): GistConfig {
  if (!gistConfig) {
    gistConfig = createDefaultGistConfig()
  }
  return gistConfig
}

// Update Gist config
export function updateGistConfig(updates: Partial<GistConfig>): void {
  gistConfig = { ...getGistConfig(), ...updates }
}

// Initialize both store and config
export async function initializeStore(): Promise<void> {
  await loadStore()
  await loadGistConfig()
  console.error('[Store] Initialized successfully')
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

// Get today's date string (YYYY-MM-DD)
export function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// Count total items in store
export function countItems(): { total: number; breakdown: Record<string, number> } {
  const data = getStore().data
  const breakdown: Record<string, number> = {
    notes: data.notes.length,
    tasks: data.tasks.length,
    habits: data.habits.length,
    journal: data.journal.length,
    bookmarks: data.bookmarks.length,
    dailyNotes: data.dailyNotes.length,
    ideas: data.ideas.length,
    focusSessions: data.focusSessions.length,
  }
  const total = Object.values(breakdown).reduce((sum, count) => sum + count, 0)
  return { total, breakdown }
}
