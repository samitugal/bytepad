import { 
  saveUserData, 
  loadUserData, 
  subscribeToUserData, 
  isFirestoreConfigured,
  getCurrentUser
} from './firestore'
import { useNoteStore } from '../stores/noteStore'
import { useTaskStore } from '../stores/taskStore'
import { useHabitStore } from '../stores/habitStore'
import { useJournalStore } from '../stores/journalStore'
import { useBookmarkStore } from '../stores/bookmarkStore'
import type { Note, Task, Habit, JournalEntry, Bookmark } from '../types'

interface HabitSyncData {
  habits: Habit[]
  dailyStats: Array<{
    date: string
    completed: number
    total: number
    completionRate: number
  }>
}

// Debounce helper
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }) as T
}

// Track if we're currently syncing from cloud to prevent loops
let isSyncingFromCloud = false

// Store unsubscribers
const unsubscribers: (() => void)[] = []

// Sync Notes
const syncNotesToCloud = debounce(async () => {
  if (isSyncingFromCloud || !getCurrentUser()) return
  const notes = useNoteStore.getState().notes
  await saveUserData('notes', notes)
}, 1000)

// Sync Tasks
const syncTasksToCloud = debounce(async () => {
  if (isSyncingFromCloud || !getCurrentUser()) return
  const tasks = useTaskStore.getState().tasks
  await saveUserData('tasks', tasks)
}, 1000)

// Sync Habits
const syncHabitsToCloud = debounce(async () => {
  if (isSyncingFromCloud || !getCurrentUser()) return
  const { habits, dailyStats } = useHabitStore.getState()
  await saveUserData('habits', { habits, dailyStats })
}, 1000)

// Sync Journal
const syncJournalToCloud = debounce(async () => {
  if (isSyncingFromCloud || !getCurrentUser()) return
  const entries = useJournalStore.getState().entries
  await saveUserData('journal', entries)
}, 1000)

// Sync Bookmarks
const syncBookmarksToCloud = debounce(async () => {
  if (isSyncingFromCloud || !getCurrentUser()) return
  const bookmarks = useBookmarkStore.getState().bookmarks
  await saveUserData('bookmarks', bookmarks)
}, 1000)

// Initialize cloud sync - call this after user logs in
export async function initializeCloudSync(): Promise<void> {
  if (!isFirestoreConfigured() || !getCurrentUser()) {
    console.log('Cloud sync not available: Firebase not configured or user not logged in')
    return
  }

  console.log('Initializing cloud sync...')

  // Load initial data from cloud
  await loadAllDataFromCloud()

  // Subscribe to real-time updates from cloud
  setupCloudListeners()

  // Subscribe to local store changes
  setupLocalListeners()

  console.log('Cloud sync initialized')
}

// Load all data from cloud
async function loadAllDataFromCloud(): Promise<void> {
  isSyncingFromCloud = true

  try {
    // Load notes
    const notes = await loadUserData<Note[]>('notes')
    if (notes && notes.length > 0) {
      useNoteStore.setState({ notes })
    }

    // Load tasks
    const tasks = await loadUserData<Task[]>('tasks')
    if (tasks && tasks.length > 0) {
      useTaskStore.setState({ tasks })
    }

    // Load habits
    const habitsData = await loadUserData<HabitSyncData>('habits')
    if (habitsData?.habits && habitsData.habits.length > 0) {
      useHabitStore.setState({ 
        habits: habitsData.habits,
        dailyStats: habitsData.dailyStats || []
      } as never)
    }

    // Load journal
    const entries = await loadUserData<JournalEntry[]>('journal')
    if (entries && entries.length > 0) {
      useJournalStore.setState({ entries })
    }

    // Load bookmarks
    const bookmarks = await loadUserData<Bookmark[]>('bookmarks')
    if (bookmarks && bookmarks.length > 0) {
      useBookmarkStore.setState({ bookmarks })
    }
  } finally {
    isSyncingFromCloud = false
  }
}

// Setup real-time listeners for cloud changes
function setupCloudListeners(): void {
  // Notes listener
  const notesUnsub = subscribeToUserData<Note[]>('notes', (notes) => {
    if (notes) {
      isSyncingFromCloud = true
      useNoteStore.setState({ notes })
      isSyncingFromCloud = false
    }
  })
  if (notesUnsub) unsubscribers.push(notesUnsub)

  // Tasks listener
  const tasksUnsub = subscribeToUserData<Task[]>('tasks', (tasks) => {
    if (tasks) {
      isSyncingFromCloud = true
      useTaskStore.setState({ tasks })
      isSyncingFromCloud = false
    }
  })
  if (tasksUnsub) unsubscribers.push(tasksUnsub)

  // Habits listener
  const habitsUnsub = subscribeToUserData<HabitSyncData>('habits', (data) => {
    if (data?.habits) {
      isSyncingFromCloud = true
      useHabitStore.setState({ 
        habits: data.habits,
        dailyStats: data.dailyStats || []
      } as never)
      isSyncingFromCloud = false
    }
  })
  if (habitsUnsub) unsubscribers.push(habitsUnsub)

  // Journal listener
  const journalUnsub = subscribeToUserData<JournalEntry[]>('journal', (entries) => {
    if (entries) {
      isSyncingFromCloud = true
      useJournalStore.setState({ entries })
      isSyncingFromCloud = false
    }
  })
  if (journalUnsub) unsubscribers.push(journalUnsub)

  // Bookmarks listener
  const bookmarksUnsub = subscribeToUserData<Bookmark[]>('bookmarks', (bookmarks) => {
    if (bookmarks) {
      isSyncingFromCloud = true
      useBookmarkStore.setState({ bookmarks })
      isSyncingFromCloud = false
    }
  })
  if (bookmarksUnsub) unsubscribers.push(bookmarksUnsub)
}

// Setup local store listeners to sync changes to cloud
function setupLocalListeners(): void {
  // Notes
  const notesUnsub = useNoteStore.subscribe(() => {
    if (!isSyncingFromCloud) syncNotesToCloud()
  })
  unsubscribers.push(notesUnsub)

  // Tasks
  const tasksUnsub = useTaskStore.subscribe(() => {
    if (!isSyncingFromCloud) syncTasksToCloud()
  })
  unsubscribers.push(tasksUnsub)

  // Habits
  const habitsUnsub = useHabitStore.subscribe(() => {
    if (!isSyncingFromCloud) syncHabitsToCloud()
  })
  unsubscribers.push(habitsUnsub)

  // Journal
  const journalUnsub = useJournalStore.subscribe(() => {
    if (!isSyncingFromCloud) syncJournalToCloud()
  })
  unsubscribers.push(journalUnsub)

  // Bookmarks
  const bookmarksUnsub = useBookmarkStore.subscribe(() => {
    if (!isSyncingFromCloud) syncBookmarksToCloud()
  })
  unsubscribers.push(bookmarksUnsub)
}

// Cleanup - call this when user logs out
export function stopCloudSync(): void {
  unsubscribers.forEach(unsub => unsub())
  unsubscribers.length = 0
  console.log('Cloud sync stopped')
}

// Force sync all data to cloud
export async function forceSyncToCloud(): Promise<void> {
  if (!isFirestoreConfigured() || !getCurrentUser()) return

  const notes = useNoteStore.getState().notes
  const tasks = useTaskStore.getState().tasks
  const { habits, dailyStats } = useHabitStore.getState()
  const entries = useJournalStore.getState().entries
  const bookmarks = useBookmarkStore.getState().bookmarks

  await Promise.all([
    saveUserData('notes', notes),
    saveUserData('tasks', tasks),
    saveUserData('habits', { habits, dailyStats }),
    saveUserData('journal', entries),
    saveUserData('bookmarks', bookmarks),
  ])

  console.log('Force sync to cloud completed')
}
