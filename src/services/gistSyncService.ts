// GitHub Gist Sync Service
// Syncs all app data to a GitHub Gist for cross-device synchronization

import { useSettingsStore } from '../stores/settingsStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useDailyNotesStore } from '../stores/dailyNotesStore'
import { useFocusStore } from '../stores/focusStore'
import { useGamificationStore } from '../stores/gamificationStore'

const GIST_FILENAME = 'bytepad-data.json'

interface SyncData {
    version: number
    lastModified: string
    data: {
        notes: unknown[]
        tasks: unknown[]
        habits: unknown[]
        journal: unknown[]
        bookmarks: unknown[]
        dailyNotes: unknown[]
        focusSessions: unknown[]
        gamification: {
            level: number
            currentXP: number
            totalXP: number
            tasksCompleted: number
            tasksCompletedToday: number
            habitsCompleted: number
            habitsCompletedToday: number
            pomodorosCompleted: number
            notesCreated: number
            journalEntries: number
            perfectDays: number
            currentStreak: number
            bestStreak: number
            lastActiveDate: string | null
            achievements: string[]
        } | null
        focusStats: {
            consecutiveSessions: number
            focusStreak: number
            lastFocusDate: string | null
        } | null
    }
}

// Get current data from all stores
function collectAllData(): SyncData {
    const notes = useNoteStore.getState().notes
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const journal = useJournalStore.getState().entries
    const bookmarks = useBookmarkStore.getState().bookmarks
    const dailyNotes = useDailyNotesStore.getState().dailyNotes
    const focusState = useFocusStore.getState()
    const gamificationState = useGamificationStore.getState()

    return {
        version: 1,
        lastModified: new Date().toISOString(),
        data: {
            notes,
            tasks,
            habits,
            journal,
            bookmarks,
            dailyNotes,
            focusSessions: focusState.sessions,
            gamification: {
                level: gamificationState.level,
                currentXP: gamificationState.currentXP,
                totalXP: gamificationState.totalXP,
                tasksCompleted: gamificationState.tasksCompleted,
                tasksCompletedToday: gamificationState.tasksCompletedToday,
                habitsCompleted: gamificationState.habitsCompleted,
                habitsCompletedToday: gamificationState.habitsCompletedToday,
                pomodorosCompleted: gamificationState.pomodorosCompleted,
                notesCreated: gamificationState.notesCreated,
                journalEntries: gamificationState.journalEntries,
                perfectDays: gamificationState.perfectDays,
                currentStreak: gamificationState.currentStreak,
                bestStreak: gamificationState.bestStreak,
                lastActiveDate: gamificationState.lastActiveDate,
                achievements: gamificationState.achievements,
            },
            focusStats: {
                consecutiveSessions: focusState.consecutiveSessions,
                focusStreak: focusState.focusStreak,
                lastFocusDate: focusState.lastFocusDate,
            },
        },
    }
}

// Helper to check if data has actually changed (shallow compare for arrays)
function hasDataChanged(oldData: unknown[], newData: unknown[]): boolean {
    if (oldData.length !== newData.length) return true
    // Quick check: compare JSON strings for small arrays, or just assume changed for large ones
    if (oldData.length > 100) return true
    return JSON.stringify(oldData) !== JSON.stringify(newData)
}

// Helper to check if remote data should replace local data
// Returns true only if remote has actual data (not empty) OR if we explicitly want to clear
function shouldApplyRemoteData(localData: unknown[], remoteData: unknown[] | undefined | null): boolean {
    // If remote data is undefined or null, don't apply
    if (remoteData === undefined || remoteData === null) return false
    
    // If remote is empty but local has data, DON'T overwrite (preserve local)
    if (remoteData.length === 0 && localData.length > 0) return false
    
    // If both are empty, no need to apply
    if (remoteData.length === 0 && localData.length === 0) return false
    
    // Remote has data, check if it's different
    return hasDataChanged(localData, remoteData)
}

// Apply synced data to all stores with batched updates to prevent input blocking
// If forceOverwrite is true, it will overwrite local data even if remote is empty
function applyData(syncData: SyncData, forceOverwrite: boolean = false): void {
    const { data } = syncData

    // Save current focus before applying updates
    const activeElement = document.activeElement as HTMLElement | null
    const selectionStart = (activeElement as HTMLInputElement)?.selectionStart
    const selectionEnd = (activeElement as HTMLInputElement)?.selectionEnd

    // Collect all updates that need to be applied
    const updates: Array<() => void> = []

    // Get current state for comparison
    const currentNotes = useNoteStore.getState().notes
    const currentTasks = useTaskStore.getState().tasks
    const currentHabits = useHabitStore.getState().habits
    const currentJournal = useJournalStore.getState().entries
    const currentBookmarks = useBookmarkStore.getState().bookmarks
    const currentDailyNotes = useDailyNotesStore.getState().dailyNotes
    const currentFocusSessions = useFocusStore.getState().sessions

    // Only add updates for stores that have actually changed AND remote has data
    // This prevents empty remote arrays from wiping out local data (unless forceOverwrite is true)
    const shouldApply = (local: unknown[], remote: unknown[] | undefined | null) => {
        if (forceOverwrite) {
            // Force overwrite: apply if remote exists (even if empty)
            return remote !== undefined && remote !== null && hasDataChanged(local, remote)
        }
        return shouldApplyRemoteData(local, remote)
    }

    if (shouldApply(currentNotes, data.notes as unknown[])) {
        updates.push(() => useNoteStore.setState({ notes: data.notes as never[] }))
    }
    if (shouldApply(currentTasks, data.tasks as unknown[])) {
        updates.push(() => useTaskStore.setState({ tasks: data.tasks as never[] }))
    }
    if (shouldApply(currentHabits, data.habits as unknown[])) {
        updates.push(() => useHabitStore.setState({ habits: data.habits as never[] }))
    }
    if (shouldApply(currentJournal, data.journal as unknown[])) {
        updates.push(() => useJournalStore.setState({ entries: data.journal as never[] }))
    }
    if (shouldApply(currentBookmarks, data.bookmarks as unknown[])) {
        updates.push(() => useBookmarkStore.setState({ bookmarks: data.bookmarks as never[] }))
    }
    if (shouldApply(currentDailyNotes, data.dailyNotes as unknown[])) {
        updates.push(() => useDailyNotesStore.setState({ dailyNotes: data.dailyNotes as never[] }))
    }
    if (shouldApply(currentFocusSessions, data.focusSessions as unknown[])) {
        updates.push(() => useFocusStore.setState({ sessions: data.focusSessions as never[] }))
    }
    if (data.focusStats) {
        const currentFocus = useFocusStore.getState()
        if (currentFocus.consecutiveSessions !== data.focusStats.consecutiveSessions ||
            currentFocus.focusStreak !== data.focusStats.focusStreak ||
            currentFocus.lastFocusDate !== data.focusStats.lastFocusDate) {
            updates.push(() => useFocusStore.setState({
                consecutiveSessions: data.focusStats!.consecutiveSessions,
                focusStreak: data.focusStats!.focusStreak,
                lastFocusDate: data.focusStats!.lastFocusDate,
            }))
        }
    }
    if (data.gamification) {
        const currentGamification = useGamificationStore.getState()
        // Check if gamification data changed
        const gamificationChanged =
            currentGamification.level !== data.gamification.level ||
            currentGamification.currentXP !== data.gamification.currentXP ||
            currentGamification.totalXP !== data.gamification.totalXP

        if (gamificationChanged) {
            updates.push(() => useGamificationStore.setState({
                level: data.gamification!.level,
                currentXP: data.gamification!.currentXP,
                totalXP: data.gamification!.totalXP,
                tasksCompleted: data.gamification!.tasksCompleted,
                tasksCompletedToday: data.gamification!.tasksCompletedToday,
                habitsCompleted: data.gamification!.habitsCompleted,
                habitsCompletedToday: data.gamification!.habitsCompletedToday,
                pomodorosCompleted: data.gamification!.pomodorosCompleted,
                notesCreated: data.gamification!.notesCreated,
                journalEntries: data.gamification!.journalEntries,
                perfectDays: data.gamification!.perfectDays,
                currentStreak: data.gamification!.currentStreak,
                bestStreak: data.gamification!.bestStreak,
                lastActiveDate: data.gamification!.lastActiveDate,
                achievements: data.gamification!.achievements,
            }))
        }
    }

    // If no updates needed, return early
    if (updates.length === 0) return

    // Apply all updates in a single microtask to batch React renders
    queueMicrotask(() => {
        // Apply all updates
        updates.forEach(update => update())

        // Restore focus after updates complete
        requestAnimationFrame(() => {
            if (activeElement && document.body.contains(activeElement)) {
                activeElement.focus()
                // Restore cursor position for input/textarea
                if (selectionStart !== null && selectionEnd !== null) {
                    const inputElement = activeElement as HTMLInputElement | HTMLTextAreaElement
                    if (inputElement.setSelectionRange) {
                        try {
                            inputElement.setSelectionRange(selectionStart, selectionEnd)
                        } catch {
                            // Ignore if element doesn't support selection
                        }
                    }
                }
            }
        })
    })
}

// Create a new Gist
export async function createGist(token: string, description: string = 'BytePad Data'): Promise<string> {
    const data = collectAllData()

    const response = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
            description,
            public: false,
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(data, null, 2),
                },
            },
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create Gist')
    }

    const gist = await response.json()
    return gist.id
}

// Read data from Gist
export async function readFromGist(token: string, gistId: string): Promise<SyncData | null> {
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github+json',
        },
    })

    if (!response.ok) {
        if (response.status === 404) {
            return null
        }
        const error = await response.json()
        throw new Error(error.message || 'Failed to read Gist')
    }

    const gist = await response.json()
    const file = gist.files[GIST_FILENAME]

    if (!file) {
        return null
    }

    try {
        return JSON.parse(file.content) as SyncData
    } catch {
        throw new Error('Invalid data format in Gist')
    }
}

// Validate data before pushing - prevent accidental data loss
function validateDataBeforePush(localData: SyncData, remoteData: SyncData | null): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []
    
    // Check if local data seems incomplete (might be corrupted localStorage)
    const totalLocalItems = 
        (localData.data.notes?.length || 0) +
        (localData.data.tasks?.length || 0) +
        (localData.data.habits?.length || 0) +
        (localData.data.journal?.length || 0) +
        (localData.data.bookmarks?.length || 0) +
        (localData.data.dailyNotes?.length || 0)
    
    if (remoteData) {
        const totalRemoteItems = 
            (remoteData.data.notes?.length || 0) +
            (remoteData.data.tasks?.length || 0) +
            (remoteData.data.habits?.length || 0) +
            (remoteData.data.journal?.length || 0) +
            (remoteData.data.bookmarks?.length || 0) +
            (remoteData.data.dailyNotes?.length || 0)
        
        // Warn if local has significantly less data than remote (potential data loss)
        if (totalRemoteItems > 0 && totalLocalItems < totalRemoteItems * 0.5) {
            warnings.push(`Local data (${totalLocalItems} items) is much smaller than remote (${totalRemoteItems} items)`)
        }
        
        // Check each store for potential data loss
        if ((remoteData.data.notes?.length || 0) > 0 && (localData.data.notes?.length || 0) === 0) {
            warnings.push('Local notes are empty but remote has notes')
        }
        if ((remoteData.data.tasks?.length || 0) > 0 && (localData.data.tasks?.length || 0) === 0) {
            warnings.push('Local tasks are empty but remote has tasks')
        }
        if ((remoteData.data.habits?.length || 0) > 0 && (localData.data.habits?.length || 0) === 0) {
            warnings.push('Local habits are empty but remote has habits')
        }
        
        // Check for content loss in notes (notes exist but content is empty)
        const localNotes = localData.data.notes as Array<{ id: string; title: string; content: string }> || []
        const remoteNotes = remoteData.data.notes as Array<{ id: string; title: string; content: string }> || []
        
        for (const localNote of localNotes) {
            const remoteNote = remoteNotes.find(n => n.id === localNote.id)
            if (remoteNote && remoteNote.content && remoteNote.content.length > 10 && (!localNote.content || localNote.content.length === 0)) {
                warnings.push(`Note "${localNote.title || localNote.id}" has empty content but remote has content`)
            }
        }
    }
    
    // If there are critical warnings, don't allow push
    const hasCriticalWarning = warnings.some(w => 
        w.includes('empty content but remote has content') ||
        w.includes('much smaller than remote')
    )
    
    return { valid: !hasCriticalWarning, warnings }
}

// Write data to Gist
export async function writeToGist(token: string, gistId: string, skipValidation: boolean = false): Promise<void> {
    const data = collectAllData()
    
    // Validate data before pushing (unless explicitly skipped)
    if (!skipValidation) {
        const remoteData = await readFromGist(token, gistId)
        const validation = validateDataBeforePush(data, remoteData)
        
        if (!validation.valid) {
            console.warn('[GistSync] Push blocked due to potential data loss:', validation.warnings)
            throw new Error(`Push blocked: ${validation.warnings.join('; ')}`)
        }
        
        if (validation.warnings.length > 0) {
            console.warn('[GistSync] Push warnings:', validation.warnings)
        }
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github+json',
        },
        body: JSON.stringify({
            files: {
                [GIST_FILENAME]: {
                    content: JSON.stringify(data, null, 2),
                },
            },
        }),
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to write to Gist')
    }
}

// Sync: Pull from Gist, merge, push back
export async function syncWithGist(): Promise<{ success: boolean; message: string }> {
    const settings = useSettingsStore.getState()
    const { gistSync, setGistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return { success: false, message: 'Gist sync not configured' }
    }

    setGistSync({ lastSyncStatus: 'pending' })

    try {
        // Read remote data
        const remoteData = await readFromGist(gistSync.githubToken, gistSync.gistId)
        const localData = collectAllData()

        if (remoteData) {
            const remoteTime = new Date(remoteData.lastModified).getTime()
            const localTime = new Date(localData.lastModified).getTime()

            // If remote is newer, apply remote data
            if (remoteTime > localTime) {
                applyData(remoteData)
                setGistSync({
                    lastSyncAt: new Date().toISOString(),
                    lastSyncStatus: 'success',
                    lastSyncError: null,
                })
                return { success: true, message: 'Pulled latest data from Gist' }
            }
        }

        // Push local data to Gist
        await writeToGist(gistSync.githubToken, gistSync.gistId)

        setGistSync({
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: null,
        })

        return { success: true, message: 'Pushed local data to Gist' }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setGistSync({
            lastSyncStatus: 'error',
            lastSyncError: errorMessage,
        })
        return { success: false, message: errorMessage }
    }
}

// Force push local data to Gist (overwrites remote)
export async function forcePushToGist(): Promise<{ success: boolean; message: string }> {
    const settings = useSettingsStore.getState()
    const { gistSync, setGistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return { success: false, message: 'Gist sync not configured' }
    }

    setGistSync({ lastSyncStatus: 'pending' })

    try {
        // Skip validation for force push - user explicitly wants to overwrite remote
        await writeToGist(gistSync.githubToken, gistSync.gistId, true)

        setGistSync({
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: null,
        })

        return { success: true, message: 'Force pushed local data to Gist' }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setGistSync({
            lastSyncStatus: 'error',
            lastSyncError: errorMessage,
        })
        return { success: false, message: errorMessage }
    }
}

// Force pull from Gist (overwrites local)
export async function forcePullFromGist(): Promise<{ success: boolean; message: string }> {
    const settings = useSettingsStore.getState()
    const { gistSync, setGistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return { success: false, message: 'Gist sync not configured' }
    }

    setGistSync({ lastSyncStatus: 'pending' })

    try {
        const remoteData = await readFromGist(gistSync.githubToken, gistSync.gistId)

        if (!remoteData) {
            throw new Error('No data found in Gist')
        }

        // Force overwrite local data with remote data (even if remote has empty arrays)
        applyData(remoteData, true)

        setGistSync({
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: null,
        })

        return { success: true, message: 'Force pulled data from Gist' }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setGistSync({
            lastSyncStatus: 'error',
            lastSyncError: errorMessage,
        })
        return { success: false, message: errorMessage }
    }
}

// Auto-sync interval manager
let syncIntervalId: number | null = null
let debouncedSyncTimeoutId: number | null = null
const DEBOUNCE_DELAY_MS = 30000 // 30 seconds debounce for data change sync

export function startAutoSync(): void {
    stopAutoSync()

    const settings = useSettingsStore.getState()
    const { gistSync } = settings

    if (!gistSync.enabled || !gistSync.autoSync || gistSync.syncInterval <= 0) {
        return
    }

    const intervalMs = gistSync.syncInterval * 60 * 1000 // Convert minutes to ms

    syncIntervalId = window.setInterval(() => {
        syncWithGist()
    }, intervalMs)

    // Also sync immediately on start
    syncWithGist()
}

export function stopAutoSync(): void {
    if (syncIntervalId !== null) {
        window.clearInterval(syncIntervalId)
        syncIntervalId = null
    }
    if (debouncedSyncTimeoutId !== null) {
        window.clearTimeout(debouncedSyncTimeoutId)
        debouncedSyncTimeoutId = null
    }
}

// Debounced sync triggered by data changes
export function triggerDebouncedSync(): void {
    const settings = useSettingsStore.getState()
    const { gistSync } = settings

    // Only trigger if sync is enabled
    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return
    }

    // Clear existing debounce timer
    if (debouncedSyncTimeoutId !== null) {
        window.clearTimeout(debouncedSyncTimeoutId)
    }

    // Set new debounce timer
    debouncedSyncTimeoutId = window.setTimeout(() => {
        syncWithGist()
        debouncedSyncTimeoutId = null
    }, DEBOUNCE_DELAY_MS)
}

// Validate GitHub token
export async function validateGitHubToken(token: string): Promise<boolean> {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
            },
        })
        return response.ok
    } catch {
        return false
    }
}

// Validate Gist ID
export async function validateGistId(token: string, gistId: string): Promise<boolean> {
    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github+json',
            },
        })
        return response.ok
    } catch {
        return false
    }
}
