import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JournalEntry } from '../types'

// Cross-tab sync channel
const syncChannel = new BroadcastChannel('bytepad-journal')

interface JournalState {
  entries: JournalEntry[]
  addEntry: (entry: Omit<JournalEntry, 'id'>) => string
  updateEntry: (id: string, updates: Partial<JournalEntry>) => void
  deleteEntry: (id: string) => void
  getEntryByDate: (date: string) => JournalEntry | undefined
  getTodayEntry: () => JournalEntry | undefined
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const getToday = () => new Date().toISOString().split('T')[0]

export const useJournalStore = create<JournalState>()(
  persist(
    (set, get) => ({
      entries: [],

      addEntry: (entryData) => {
        const id = generateId()
        const entry: JournalEntry = {
          ...entryData,
          id,
        }
        set((state) => ({
          entries: [entry, ...state.entries],
        }))
        return id
      },

      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updates } : entry
          ),
        }))
      },

      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }))
      },

      getEntryByDate: (date) => {
        return get().entries.find((entry) => entry.date === date)
      },

      getTodayEntry: () => {
        const today = getToday()
        return get().entries.find((entry) => entry.date === today)
      },
    }),
    {
      name: 'bytepad-journal',
      partialize: (state) => ({ entries: state.entries }),
    }
  )
)

// Cross-tab synchronization
syncChannel.onmessage = (event) => {
  if (event.data?.type === 'SYNC') {
    useJournalStore.setState({ entries: event.data.entries })
  }
}

useJournalStore.subscribe((state) => {
  syncChannel.postMessage({ type: 'SYNC', entries: state.entries })
})
