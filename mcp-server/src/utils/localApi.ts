// Local API Helper - Unified approach for local-first operations
// When Electron app is running, use local API (changes sync to Gist automatically)
// When not running, fall back to file store

import { logger } from './logger.js'

const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://127.0.0.1:31337'
const REQUEST_TIMEOUT = 5000 // 5 seconds

export interface LocalApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  source: 'local' | 'fallback'
}

// Check if Electron app is running
let isAppRunning: boolean | null = null
let lastHealthCheck = 0
const HEALTH_CHECK_INTERVAL = 30000 // 30 seconds

async function checkAppHealth(): Promise<boolean> {
  const now = Date.now()

  // Use cached result if recent
  if (isAppRunning !== null && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return isAppRunning
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 2000)

    const response = await fetch(`${LOCAL_API_URL}/api/health`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    isAppRunning = response.ok
    lastHealthCheck = now

    if (isAppRunning) {
      logger.debug('Electron app is running - using local API')
    }

    return isAppRunning
  } catch {
    isAppRunning = false
    lastHealthCheck = now
    logger.debug('Electron app not running - using file store')
    return false
  }
}

// Reset health check cache (useful after errors)
export function resetHealthCache(): void {
  isAppRunning = null
  lastHealthCheck = 0
}

// Make a request to the local API
async function localRequest<T>(
  method: string,
  endpoint: string,
  body?: unknown
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(`${LOCAL_API_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    const result = await response.json() as { success?: boolean; data?: T; error?: string }

    if (!response.ok) {
      return { success: false, error: result.error || `HTTP ${response.status}` }
    }

    return { success: true, data: result.data }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message.includes('abort')) {
      return { success: false, error: 'Request timeout' }
    }
    return { success: false, error: message }
  }
}

// ============================================
// TASK OPERATIONS
// ============================================

export async function localGetTasks(): Promise<LocalApiResponse<unknown[]>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<unknown[]>('GET', '/api/tasks')
  return { ...result, source: 'local' }
}

export async function localCreateTask(data: {
  title: string
  description?: string
  priority?: string
  deadline?: string
  tags?: string[]
}): Promise<LocalApiResponse<{ id: string; message: string }>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<{ id: string; message: string }>('POST', '/api/tasks', data)
  return { ...result, source: 'local' }
}

export async function localUpdateTask(
  id: string,
  updates: Record<string, unknown>
): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('PATCH', `/api/tasks/${id}`, updates)
  return { ...result, source: 'local' }
}

export async function localToggleTask(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('POST', `/api/tasks/${id}/toggle`)
  return { ...result, source: 'local' }
}

export async function localDeleteTask(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('DELETE', `/api/tasks/${id}`)
  return { ...result, source: 'local' }
}

// ============================================
// NOTE OPERATIONS
// ============================================

export async function localGetNotes(): Promise<LocalApiResponse<unknown[]>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<unknown[]>('GET', '/api/notes')
  return { ...result, source: 'local' }
}

export async function localGetNote(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('GET', `/api/notes/${id}`)
  return { ...result, source: 'local' }
}

export async function localCreateNote(data: {
  title: string
  content?: string
  tags?: string[]
}): Promise<LocalApiResponse<{ id: string; message: string }>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<{ id: string; message: string }>('POST', '/api/notes', data)
  return { ...result, source: 'local' }
}

export async function localUpdateNote(
  id: string,
  updates: Record<string, unknown>
): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('PATCH', `/api/notes/${id}`, updates)
  return { ...result, source: 'local' }
}

export async function localDeleteNote(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('DELETE', `/api/notes/${id}`)
  return { ...result, source: 'local' }
}

// ============================================
// HABIT OPERATIONS
// ============================================

export async function localGetHabits(): Promise<LocalApiResponse<unknown[]>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<unknown[]>('GET', '/api/habits')
  return { ...result, source: 'local' }
}

export async function localCreateHabit(data: {
  name: string
  frequency?: string
  category?: string
}): Promise<LocalApiResponse<{ id: string; message: string }>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<{ id: string; message: string }>('POST', '/api/habits', data)
  return { ...result, source: 'local' }
}

export async function localUpdateHabit(
  id: string,
  updates: Record<string, unknown>
): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('PATCH', `/api/habits/${id}`, updates)
  return { ...result, source: 'local' }
}

export async function localDeleteHabit(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('DELETE', `/api/habits/${id}`)
  return { ...result, source: 'local' }
}

export async function localToggleHabit(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('POST', `/api/habits/${id}/toggle`)
  return { ...result, source: 'local' }
}

// ============================================
// BOOKMARK OPERATIONS
// ============================================

export async function localGetBookmarks(): Promise<LocalApiResponse<unknown[]>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<unknown[]>('GET', '/api/bookmarks')
  return { ...result, source: 'local' }
}

export async function localCreateBookmark(data: {
  url: string
  title?: string
  description?: string
  collection?: string
  tags?: string[]
}): Promise<LocalApiResponse<{ id: string; message: string }>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<{ id: string; message: string }>('POST', '/api/bookmarks', data)
  return { ...result, source: 'local' }
}

export async function localUpdateBookmark(
  id: string,
  updates: Record<string, unknown>
): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('PATCH', `/api/bookmarks/${id}`, updates)
  return { ...result, source: 'local' }
}

export async function localDeleteBookmark(id: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('DELETE', `/api/bookmarks/${id}`)
  return { ...result, source: 'local' }
}

// ============================================
// JOURNAL OPERATIONS
// ============================================

export async function localGetJournal(): Promise<LocalApiResponse<unknown[]>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<unknown[]>('GET', '/api/journal')
  return { ...result, source: 'local' }
}

export async function localCreateJournalEntry(data: {
  content: string
  mood?: number
  energy?: number
  tags?: string[]
}): Promise<LocalApiResponse<{ message: string }>> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest<{ message: string }>('POST', '/api/journal', data)
  return { ...result, source: 'local' }
}

export async function localUpdateJournalEntry(
  date: string,
  updates: Record<string, unknown>
): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('PATCH', `/api/journal/${date}`, updates)
  return { ...result, source: 'local' }
}

export async function localDeleteJournalEntry(date: string): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('DELETE', `/api/journal/${date}`)
  return { ...result, source: 'local' }
}

// ============================================
// SUMMARY OPERATIONS
// ============================================

export async function localGetDailySummary(): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('GET', '/api/summary/daily')
  return { ...result, source: 'local' }
}

export async function localGetWeeklySummary(): Promise<LocalApiResponse> {
  if (!(await checkAppHealth())) {
    return { success: false, error: 'App not running', source: 'fallback' }
  }

  const result = await localRequest('GET', '/api/summary/weekly')
  return { ...result, source: 'local' }
}

// ============================================
// HEALTH CHECK
// ============================================

export async function localHealthCheck(): Promise<LocalApiResponse<{ status: string; version: string }>> {
  const isRunning = await checkAppHealth()

  if (!isRunning) {
    return {
      success: false,
      error: 'Electron app is not running',
      source: 'fallback',
    }
  }

  const result = await localRequest<{ status: string; version: string }>('GET', '/api/health')
  return { ...result, source: 'local' }
}

// Check if app is available (for tools to decide whether to use local or fallback)
export async function isLocalApiAvailable(): Promise<boolean> {
  return checkAppHealth()
}
