// GitHub Gist Sync Service
// Syncs all app data to a GitHub Gist for cross-device synchronization

import { z } from 'zod'
import { useSettingsStore } from '../stores/settingsStore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import { useDailyNotesStore } from '../stores/dailyNotesStore'
import { useFocusStore } from '../stores/focusStore'
import { useGamificationStore, deriveLevelAndXP } from '../stores/gamificationStore'
import { useIdeaStore } from '../stores/ideaStore'
import { logger } from '../utils/logger'

const GIST_FILENAME = 'bytepad-data.json'

// Races `promise` against a timer. Used anywhere a network call must not be
// allowed to block indefinitely (app-quit push, startup hydration wait).
// Rejects with `timeoutMessage` if the timer wins; otherwise settles exactly
// like `promise`.
function withTimeout<T>(promise: Promise<T>, ms: number, timeoutMessage: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(timeoutMessage)), ms)
        promise.then(
            (value) => {
                clearTimeout(timer)
                resolve(value)
            },
            (error) => {
                clearTimeout(timer)
                reject(error)
            }
        )
    })
}

interface SyncData {
    version: number
    lastModified: string
    data: {
        // Each collection is optional at this type level (not just in practice) because
        // parseSyncData() below parses collections independently and drops any single
        // corrupt one to `undefined` rather than rejecting the whole payload - see the
        // per-collection parsing rationale there.
        notes: unknown[] | undefined
        tasks: unknown[] | undefined
        habits: unknown[] | undefined
        journal: unknown[] | undefined
        bookmarks: unknown[] | undefined
        dailyNotes: unknown[] | undefined
        ideas: unknown[] | undefined
        focusSessions: unknown[] | undefined
        gamification: {
            // Only `totalXP` is required - see gamificationSchema below for why. Every
            // other field is optional so a remote blob from an older/newer app version
            // that's missing one of these counters still validates; applyData falls back
            // to the current local value for whichever of these come back undefined
            // instead of overwriting a real counter with `undefined` or a made-up 0.
            level?: number
            currentXP?: number
            totalXP: number
            tasksCompleted?: number
            tasksCompletedToday?: number
            habitsCompleted?: number
            habitsCompletedToday?: number
            pomodorosCompleted?: number
            notesCreated?: number
            journalEntries?: number
            perfectDays?: number
            currentStreak?: number
            bestStreak?: number
            lastActiveDate?: string | null
            achievements?: string[]
        } | null
        focusStats: {
            consecutiveSessions?: number
            focusStreak?: number
            lastFocusDate?: string | null
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
    const ideas = useIdeaStore.getState().ideas
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
            ideas,
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
//
// This used to bail to `true` (assume changed) for any array over 100 items,
// presumably to avoid an expensive JSON.stringify on large collections. Two
// things made that guard worse than not having it, rather than a genuine
// perf/safety trade-off:
//   1. It is never on the push/quit path - writeToGist doesn't call this at
//      all. Only the pull-side `shouldApplyRemoteData` does (from
//      syncWithGist, pullOnStartup, forcePullFromGist), each a handful of
//      calls per session, not a hot loop.
//   2. "Assume changed" doesn't skip work, it moves it: the caller still
//      unconditionally replaces the whole store's array and triggers a
//      re-render, which costs more than the string compare it avoided.
// Net effect: any user with >100 notes/tasks/etc. had this dirty check
// permanently disabled for that collection, so every pull reapplied
// byte-identical remote data. Comparing unconditionally instead - if a
// genuinely huge collection ever makes this measurably slow, the fix is a
// cheaper comparison (e.g. hashing), not skipping the comparison.
function hasDataChanged(oldData: unknown[], newData: unknown[]): boolean {
    if (oldData.length !== newData.length) return true
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
    const currentIdeas = useIdeaStore.getState().ideas
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
    if (shouldApply(currentIdeas, data.ideas as unknown[])) {
        updates.push(() => useIdeaStore.setState({ ideas: data.ideas as never[] }))
    }
    if (shouldApply(currentFocusSessions, data.focusSessions as unknown[])) {
        updates.push(() => useFocusStore.setState({ sessions: data.focusSessions as never[] }))
    }
    if (data.focusStats) {
        const currentFocus = useFocusStore.getState()
        // Every focusStats field is optional (see SyncData) so a blob missing one still
        // validates - fall back to the current local value for whichever field is
        // undefined instead of writing `undefined` into a store field typed as `number`.
        const consecutiveSessions = data.focusStats.consecutiveSessions ?? currentFocus.consecutiveSessions
        const focusStreak = data.focusStats.focusStreak ?? currentFocus.focusStreak
        const lastFocusDate = data.focusStats.lastFocusDate ?? currentFocus.lastFocusDate
        if (currentFocus.consecutiveSessions !== consecutiveSessions ||
            currentFocus.focusStreak !== focusStreak ||
            currentFocus.lastFocusDate !== lastFocusDate) {
            updates.push(() => useFocusStore.setState({
                consecutiveSessions,
                focusStreak,
                lastFocusDate,
            }))
        }
    }
    // parseSyncData() already guarantees a non-null `data.gamification` has a finite
    // numeric `totalXP` - it drops the whole gamification block to `null` otherwise (see
    // gamificationSchema) - so this `typeof`/`isFinite` check should never actually fail
    // here. It's kept as a second, cheap guard directly at the deriveLevelAndXP call site
    // anyway: applyData is the one place that ever calls deriveLevelAndXP with data that
    // came off the network, and a defense-in-depth check here means a future caller of
    // applyData that skips parseSyncData (or a bug in it) still can't turn a bad `totalXP`
    // into a persisted NaN - mirroring the identical guard gamificationStore's own persist
    // `merge` already applies (`typeof persisted.totalXP === 'number' ? ... : ...`).
    if (data.gamification && typeof data.gamification.totalXP === 'number' && Number.isFinite(data.gamification.totalXP)) {
        const currentGamification = useGamificationStore.getState()
        // `level`/`currentXP` are derived values (see deriveLevelAndXP), not independent
        // source-of-truth fields — comparing them here would make this dirty-check fire
        // against a peer device that hasn't picked up a level-table change yet (its stored
        // `level` differs from ours even though the underlying `totalXP` doesn't), causing
        // the two devices to flap the remote blob back and forth on every sync. `totalXP` is
        // the only value we trust verbatim, so that's the only one worth comparing.
        const gamificationChanged = currentGamification.totalXP !== data.gamification.totalXP

        if (gamificationChanged) {
            // Never trust a remote `level`/`currentXP` verbatim — always re-derive them from
            // `totalXP` through the same helper the persist `merge` uses, so a stale blob
            // (e.g. from a device that hasn't picked up a level-table change) can't push a
            // wrong level back into this store.
            const { level, currentXP } = deriveLevelAndXP(data.gamification.totalXP)
            const remoteGamification = data.gamification
            // Every field below `totalXP` is optional (see SyncData/gamificationSchema) so
            // a remote blob from an older app version that never had, say, `perfectDays`
            // still validates and applies. Fall back to the current local value for
            // whichever counter is missing instead of overwriting a real value with
            // `undefined` (which would just relocate the NaN-on-persist hazard this whole
            // schema exists to close) or a made-up 0 (silent, wrong-looking data loss).
            updates.push(() => useGamificationStore.setState({
                level,
                currentXP,
                totalXP: remoteGamification.totalXP,
                tasksCompleted: remoteGamification.tasksCompleted ?? currentGamification.tasksCompleted,
                tasksCompletedToday: remoteGamification.tasksCompletedToday ?? currentGamification.tasksCompletedToday,
                habitsCompleted: remoteGamification.habitsCompleted ?? currentGamification.habitsCompleted,
                habitsCompletedToday: remoteGamification.habitsCompletedToday ?? currentGamification.habitsCompletedToday,
                pomodorosCompleted: remoteGamification.pomodorosCompleted ?? currentGamification.pomodorosCompleted,
                notesCreated: remoteGamification.notesCreated ?? currentGamification.notesCreated,
                journalEntries: remoteGamification.journalEntries ?? currentGamification.journalEntries,
                perfectDays: remoteGamification.perfectDays ?? currentGamification.perfectDays,
                currentStreak: remoteGamification.currentStreak ?? currentGamification.currentStreak,
                bestStreak: remoteGamification.bestStreak ?? currentGamification.bestStreak,
                lastActiveDate: remoteGamification.lastActiveDate ?? currentGamification.lastActiveDate,
                achievements: remoteGamification.achievements ?? currentGamification.achievements,
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

// ---------------------------------------------------------------------------
// Inbound validation
//
// The Gist is the user's own document - they can hand-edit it, it can be left
// over from an older app version, or it can be truncated by an interrupted
// push. `readFromGist` used to do `JSON.parse(...) as SyncData`, a
// compile-time-only assertion that checks nothing at runtime, and whatever
// came back was written into the stores and then persisted, silently
// replacing good local data. The schemas below follow the same pattern
// already used for untrusted JSON at `electron/server/routes/bulk.ts`
// (`noteImportSchema`, `taskImportSchema`, etc.): validate the envelope
// loosely, validate/strip each item individually, and never let one bad
// field reject data that was otherwise fine.
// ---------------------------------------------------------------------------

// A collection item (a note, task, habit, journal entry, bookmark, daily
// note, idea or focus session) is treated as an opaque object here. This
// service is a sync transport, not the source of truth for any entity's
// shape - that lives in each entity store and in the bulk-import schemas
// (electron/server/routes/bulk.ts) that already validate field-by-field when
// data is actually imported. Re-declaring per-entity schemas here would mean
// this file silently drops any field a newer app version added to an entity
// (or any field an older version never had), which is exactly the
// "rejects real users' existing gists" failure mode we've been told to
// avoid. All we need at this boundary is protection against a collection
// slot containing something that could never be an entity at all (a string,
// a number, `null`, ...), so a truncated or hand-edited array can't reach a
// store's `setState`.
const syncItemSchema = z.record(z.string(), z.unknown())
const syncCollectionSchema = z.array(syncItemSchema)

// Gamification is validated as its own object (not folded into the generic
// item schema) because `totalXP` is the one field this file actively
// computes with: `deriveLevelAndXP(data.gamification.totalXP)` at the
// applyData call site. Every other field is optional so an older or newer
// gamification shape still passes - `totalXP` is the sole exception: it is
// the only value `applyData` re-derives `level`/`currentXP` from (mirroring
// gamificationStore's own persist `merge`, which applies the identical
// `typeof persisted.totalXP === 'number'` guard), so a gamification block
// without a valid `totalXP` cannot be safely applied at all. `.finite()`
// additionally rejects the one way a valid JSON document can still produce a
// non-finite number (e.g. `1e1000` parses to `Infinity`).
const gamificationSchema = z.object({
    level: z.number().optional(),
    currentXP: z.number().optional(),
    totalXP: z.number().finite(),
    tasksCompleted: z.number().optional(),
    tasksCompletedToday: z.number().optional(),
    habitsCompleted: z.number().optional(),
    habitsCompletedToday: z.number().optional(),
    pomodorosCompleted: z.number().optional(),
    notesCreated: z.number().optional(),
    journalEntries: z.number().optional(),
    perfectDays: z.number().optional(),
    currentStreak: z.number().optional(),
    bestStreak: z.number().optional(),
    lastActiveDate: z.string().nullable().optional(),
    achievements: z.array(z.string()).optional(),
})

const focusStatsSchema = z.object({
    consecutiveSessions: z.number().optional(),
    focusStreak: z.number().optional(),
    lastFocusDate: z.string().nullable().optional(),
})

// Envelope only. `data` itself is intentionally left as a loose record here -
// each of its collections is parsed independently in parseSyncData() so a
// single corrupt collection (e.g. `tasks` truncated into a bare string)
// doesn't fail this top-level parse and take every other, valid collection
// down with it. `version` and `lastModified` have been present on every
// SyncData this app has ever written (schema version has never left `1`),
// so unlike the `data.*` fields, their absence indicates real corruption
// rather than an older/newer legitimate shape, and refusing the pull here is
// the correct response.
const syncEnvelopeSchema = z.object({
    version: z.number(),
    lastModified: z.string(),
    data: z.record(z.string(), z.unknown()),
})

// Parses one already-JSON.parsed Gist payload into a SyncData, or throws.
// Granularity: the envelope (version/lastModified/data-is-an-object) is
// validated as a single unit and refuses the whole pull on failure - a blob
// that fails at this level is too structurally broken to partially trust.
// Below that, each collection and the gamification/focusStats blocks are
// parsed independently: a single corrupt collection is dropped (becomes
// `undefined`, i.e. treated the same as "remote didn't send this
// collection", which applyData already knows to leave local data alone for)
// instead of discarding the other, valid collections in the same payload.
function parseSyncData(raw: unknown): SyncData {
    const envelope = syncEnvelopeSchema.safeParse(raw)
    if (!envelope.success) {
        throw new Error('Invalid data format in Gist')
    }

    const rawData = envelope.data.data

    const parseCollection = (key: string): unknown[] | undefined => {
        const value = rawData[key]
        if (value === undefined || value === null) return undefined
        const parsed = syncCollectionSchema.safeParse(value)
        if (!parsed.success) {
            logger.warn(`[GistSync] Dropping corrupt "${key}" collection from remote data:`, parsed.error.issues)
            return undefined
        }
        return parsed.data
    }

    let gamification: SyncData['data']['gamification'] = null
    if (rawData.gamification !== undefined && rawData.gamification !== null) {
        const parsedGamification = gamificationSchema.safeParse(rawData.gamification)
        if (parsedGamification.success) {
            gamification = parsedGamification.data
        } else {
            logger.warn('[GistSync] Dropping corrupt gamification data from remote (missing/invalid totalXP):', parsedGamification.error.issues)
        }
    }

    let focusStats: SyncData['data']['focusStats'] = null
    if (rawData.focusStats !== undefined && rawData.focusStats !== null) {
        const parsedFocusStats = focusStatsSchema.safeParse(rawData.focusStats)
        if (parsedFocusStats.success) {
            focusStats = parsedFocusStats.data
        } else {
            logger.warn('[GistSync] Dropping corrupt focusStats data from remote:', parsedFocusStats.error.issues)
        }
    }

    return {
        version: envelope.data.version,
        lastModified: envelope.data.lastModified,
        data: {
            notes: parseCollection('notes'),
            tasks: parseCollection('tasks'),
            habits: parseCollection('habits'),
            journal: parseCollection('journal'),
            bookmarks: parseCollection('bookmarks'),
            dailyNotes: parseCollection('dailyNotes'),
            ideas: parseCollection('ideas'),
            focusSessions: parseCollection('focusSessions'),
            gamification,
            focusStats,
        },
    }
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

    let parsedJson: unknown
    try {
        parsedJson = JSON.parse(file.content)
    } catch {
        throw new Error('Invalid data format in Gist')
    }

    // parseSyncData throws 'Invalid data format in Gist' itself when the
    // envelope doesn't validate - let that propagate as-is rather than
    // wrapping it, so callers (syncWithGist, forcePullFromGist,
    // pullOnStartup) keep seeing the same error shape they already handle.
    return parseSyncData(parsedJson)
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

// Fetches the current remote copy and runs validateDataBeforePush against
// what we're about to write. Pulled out of writeToGist so every push path
// shares this exact check instead of each caller rolling its own - see the
// `validation` modes on writeToGist below for how each path uses the result.
async function checkPushSafety(
    token: string,
    gistId: string,
    localData: SyncData
): Promise<{ valid: boolean; warnings: string[] }> {
    const remoteData = await readFromGist(token, gistId)
    return validateDataBeforePush(localData, remoteData)
}

// How long the close-push safety check is allowed to take before pushOnClose
// gives up waiting on it and writes unvalidated. Keeps app-quit from hanging
// on a slow/stalled network call - see writeToGist's 'best-effort' mode.
const CLOSE_PUSH_VALIDATION_TIMEOUT_MS = 4000

// Write data to Gist
//
// `validation` controls how checkPushSafety (above) gates the write:
//   - 'enforce'     refuse to write (throw) if validateDataBeforePush finds a
//                    critical warning - e.g. local data that looks
//                    empty/truncated next to a populated remote. Used by the
//                    normal sync path and by forcePushToGist: "force" means
//                    "push now without doing the pull-first merge dance that
//                    syncWithGist does", not "overwrite the Gist even when
//                    the push itself looks like data loss".
//   - 'best-effort' runs the same check under a timeout. If the check
//                    *completes* and finds a critical warning, the write is
//                    still blocked - this mode is not a way to skip an actual
//                    bad-push finding. It only changes what happens when the
//                    check can't be completed at all (timeout, or a
//                    readFromGist network error): instead of refusing to
//                    push, it falls back to writing without validation. Used
//                    exclusively by pushOnClose, which runs during app quit -
//                    it must never hang shutdown on a network round trip, and
//                    its purpose is "still try to save the user's work even
//                    if we can't fully verify it first".
//   - 'skip'        no check at all.
export async function writeToGist(
    token: string,
    gistId: string,
    validation: 'enforce' | 'best-effort' | 'skip' = 'enforce'
): Promise<void> {
    const data = collectAllData()

    if (validation !== 'skip') {
        let safety: { valid: boolean; warnings: string[] } | null = null
        try {
            safety = validation === 'best-effort'
                ? await withTimeout(
                    checkPushSafety(token, gistId, data),
                    CLOSE_PUSH_VALIDATION_TIMEOUT_MS,
                    'Push validation timed out'
                )
                : await checkPushSafety(token, gistId, data)
        } catch (error) {
            if (validation === 'enforce') {
                // No fallback in 'enforce' mode: a failed safety check must
                // never silently turn into an unvalidated push.
                throw error
            }
            // 'best-effort': couldn't determine safety in time (timeout or a
            // readFromGist network error). Push anyway rather than dropping
            // the user's work at quit - see the mode doc comment above.
            logger.warn('[GistSync] Could not validate close push in time, pushing without validation:', error)
        }

        if (safety && !safety.valid) {
            logger.warn('[GistSync] Push blocked due to potential data loss:', safety.warnings)
            throw new Error(`Push blocked: ${safety.warnings.join('; ')}`)
        }

        if (safety && safety.warnings.length > 0) {
            logger.warn('[GistSync] Push warnings:', safety.warnings)
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

// Count total items in sync data
function countTotalItems(data: SyncData): number {
    return (
        (data.data.notes?.length || 0) +
        (data.data.tasks?.length || 0) +
        (data.data.habits?.length || 0) +
        (data.data.journal?.length || 0) +
        (data.data.bookmarks?.length || 0) +
        (data.data.dailyNotes?.length || 0)
    )
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
            const remoteItemCount = countTotalItems(remoteData)
            const localItemCount = countTotalItems(localData)
            
            // SAFETY: If remote has more data than local, always pull first
            // This prevents pushing incomplete/corrupted local data
            if (remoteItemCount > localItemCount) {
                logger.info(`[GistSync] Remote has more data (${remoteItemCount} vs ${localItemCount}), pulling...`)
                applyData(remoteData)
                setGistSync({
                    lastSyncAt: new Date().toISOString(),
                    lastSyncStatus: 'success',
                    lastSyncError: null,
                })
                return { success: true, message: 'Pulled latest data from Gist (remote has more data)' }
            }
            
            // If counts are equal or local has more, check timestamps
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

        // Push local data to Gist (validation happens inside writeToGist)
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
        // 'enforce': force push only skips syncWithGist's pull-first merge
        // dance, not the data-loss safety check - see writeToGist's mode doc.
        await writeToGist(gistSync.githubToken, gistSync.gistId, 'enforce')

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

// Simple sync: Pull on app start, Push on app close
// No auto-sync intervals, no debounced sync

// ---------------------------------------------------------------------------
// Startup hydration wait
//
// initializeSync() used to wait a fixed delay (previously 3s) before pulling,
// guessing that every store would have finished rehydrating from
// localStorage by then. zustand's persist middleware always finishes
// hydration asynchronously - even for a synchronous storage like localStorage,
// it goes through a Promise chain (see `toThenable`/`hydrate` in
// zustand/middleware) - but every persisted store here exposes
// `persist.hasHydrated()` / `persist.onFinishHydration()`, so there is no
// need to guess how long that takes. Waiting on those directly means the pull
// fires as soon as every store involved in sync is actually ready (typically
// within a tick, not seconds), while a bounded timeout still protects against
// a store whose storage layer never resolves (e.g. corrupted localStorage).
// ---------------------------------------------------------------------------
const STORE_HYDRATION_TIMEOUT_MS = 5000

// Every store collectAllData()/applyData() read from or write to - keep this
// list in sync with those two functions.
const SYNCED_STORES = [
    useNoteStore,
    useTaskStore,
    useHabitStore,
    useJournalStore,
    useBookmarkStore,
    useDailyNotesStore,
    useIdeaStore,
    useFocusStore,
    useGamificationStore,
] as const

function waitForStoreHydration(): Promise<void> {
    const pending = SYNCED_STORES.filter((store) => !store.persist.hasHydrated())
    if (pending.length === 0) return Promise.resolve()

    const hydrated = Promise.all(
        pending.map(
            (store) =>
                new Promise<void>((resolve) => {
                    const unsubscribe = store.persist.onFinishHydration(() => {
                        unsubscribe()
                        resolve()
                    })
                })
        )
    ).then(() => undefined)

    // Best-effort: if a store's storage layer never resolves, don't block the
    // startup pull forever - fall through and let pullOnStartup run against
    // whatever did hydrate in time.
    return withTimeout(hydrated, STORE_HYDRATION_TIMEOUT_MS, 'Store hydration timed out').catch(() => undefined)
}

// Pull data from Gist on app startup
export async function pullOnStartup(): Promise<{ success: boolean; message: string }> {
    const settings = useSettingsStore.getState()
    const { gistSync, setGistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return { success: false, message: 'Gist sync not configured' }
    }

    logger.info('[GistSync] Pulling data on startup...')
    setGistSync({ lastSyncStatus: 'pending' })

    try {
        const remoteData = await readFromGist(gistSync.githubToken, gistSync.gistId)
        
        if (remoteData) {
            applyData(remoteData, false)
            setGistSync({
                lastSyncAt: new Date().toISOString(),
                lastSyncStatus: 'success',
                lastSyncError: null,
            })
            logger.info('[GistSync] Startup pull completed successfully')
            return { success: true, message: 'Pulled data from Gist' }
        }
        
        return { success: true, message: 'No remote data found' }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('[GistSync] Startup pull failed:', error)
        setGistSync({
            lastSyncStatus: 'error',
            lastSyncError: errorMessage,
        })
        return { success: false, message: errorMessage }
    }
}

// Push data to Gist on app close
export async function pushOnClose(): Promise<{ success: boolean; message: string }> {
    const settings = useSettingsStore.getState()
    const { gistSync, setGistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return { success: false, message: 'Gist sync not configured' }
    }

    logger.info('[GistSync] Pushing data on close...')
    setGistSync({ lastSyncStatus: 'pending' })

    try {
        // 'best-effort': validated like every other push, but bounded so a
        // slow/stalled validation check can't hang app quit - see
        // writeToGist's mode doc.
        await writeToGist(gistSync.githubToken, gistSync.gistId, 'best-effort')
        
        setGistSync({
            lastSyncAt: new Date().toISOString(),
            lastSyncStatus: 'success',
            lastSyncError: null,
        })
        logger.info('[GistSync] Close push completed successfully')
        return { success: true, message: 'Pushed data to Gist' }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        logger.error('[GistSync] Close push failed:', error)
        setGistSync({
            lastSyncStatus: 'error',
            lastSyncError: errorMessage,
        })
        return { success: false, message: errorMessage }
    }
}

// Initialize sync on app start (called from App.tsx)
export function initializeSync(): void {
    const settings = useSettingsStore.getState()
    const { gistSync } = settings

    if (!gistSync.enabled || !gistSync.githubToken || !gistSync.gistId) {
        return
    }

    // Wait for stores to actually finish hydrating, then pull
    logger.info('[GistSync] Waiting for stores to hydrate...')
    waitForStoreHydration().then(() => {
        pullOnStartup()
    })
}

// Legacy functions - kept for compatibility but do nothing
export function startAutoSync(): void {
    // Auto-sync removed - use initializeSync() instead
    initializeSync()
}

export function stopAutoSync(): void {
    // No-op - auto-sync removed
}

export function triggerDebouncedSync(): void {
    // No-op - debounced sync removed
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
