// GitHub Gist Sync Service
// Syncs all app data to a GitHub Gist for cross-device synchronization

import { useSettingsStore } from '../stores/settingsStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'

const GIST_FILENAME = 'myflowspace-data.json'

interface SyncData {
    version: number
    lastModified: string
    data: {
        notes: unknown[]
        tasks: unknown[]
        habits: unknown[]
        journal: unknown[]
        bookmarks: unknown[]
    }
}

// Get current data from all stores
function collectAllData(): SyncData {
    const notes = useNoteStore.getState().notes
    const tasks = useTaskStore.getState().tasks
    const habits = useHabitStore.getState().habits
    const journal = useJournalStore.getState().entries
    const bookmarks = useBookmarkStore.getState().bookmarks

    return {
        version: 1,
        lastModified: new Date().toISOString(),
        data: {
            notes,
            tasks,
            habits,
            journal,
            bookmarks,
        },
    }
}

// Apply synced data to all stores
function applyData(syncData: SyncData): void {
    const { data } = syncData

    if (data.notes) {
        useNoteStore.setState({ notes: data.notes as never[] })
    }
    if (data.tasks) {
        useTaskStore.setState({ tasks: data.tasks as never[] })
    }
    if (data.habits) {
        useHabitStore.setState({ habits: data.habits as never[] })
    }
    if (data.journal) {
        useJournalStore.setState({ entries: data.journal as never[] })
    }
    if (data.bookmarks) {
        useBookmarkStore.setState({ bookmarks: data.bookmarks as never[] })
    }
}

// Create a new Gist
export async function createGist(token: string, description: string = 'MyFlowSpace Data'): Promise<string> {
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

// Write data to Gist
export async function writeToGist(token: string, gistId: string): Promise<void> {
    const data = collectAllData()

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
        await writeToGist(gistSync.githubToken, gistSync.gistId)

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

        applyData(remoteData)

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
