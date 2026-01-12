import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Note } from '../types'
import { useGamificationStore, XP_VALUES } from './gamificationStore'

// Cross-tab sync channel
const syncChannel = new BroadcastChannel('myflowspace-notes')

interface NoteState {
  notes: Note[]
  activeNoteId: string | null
  searchQuery: string
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNote: (id: string, updates: Partial<Note>) => void
  deleteNote: (id: string) => void
  setActiveNote: (id: string | null) => void
  setSearchQuery: (query: string) => void
  getActiveNote: () => Note | null
  togglePin: (id: string) => void
  getSortedNotes: () => Note[]
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],
      activeNoteId: null,
      searchQuery: '',

      addNote: (noteData) => {
        const id = generateId()
        const now = new Date()
        const note: Note = {
          ...noteData,
          id,
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          notes: [note, ...state.notes],
          activeNoteId: id,
        }))

        // Award XP for note creation
        const gamification = useGamificationStore.getState()
        gamification.addXP(XP_VALUES.noteCreate, 'noteCreate')
        gamification.incrementStat('notesCreated')

        return id
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, ...updates, updatedAt: new Date() }
              : note
          ),
        }))
      },

      deleteNote: (id) => {
        set((state) => {
          const newNotes = state.notes.filter((note) => note.id !== id)
          const newActiveId = state.activeNoteId === id
            ? newNotes[0]?.id || null
            : state.activeNoteId
          return { notes: newNotes, activeNoteId: newActiveId }
        })
      },

      setActiveNote: (id) => set({ activeNoteId: id }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      getActiveNote: () => {
        const state = get()
        return state.notes.find((note) => note.id === state.activeNoteId) || null
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id
              ? { ...note, pinned: !note.pinned, updatedAt: new Date() }
              : note
          ),
        }))
      },

      getSortedNotes: () => {
        const state = get()
        // Pinned notes first, then by createdAt (newest first)
        return [...state.notes].sort((a, b) => {
          if (a.pinned && !b.pinned) return -1
          if (!a.pinned && b.pinned) return 1
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
      },
    }),
    {
      name: 'myflowspace-notes',
      partialize: (state) => ({ notes: state.notes }),
    }
  )
)

// Cross-tab synchronization
syncChannel.onmessage = (event) => {
  if (event.data?.type === 'SYNC') {
    useNoteStore.setState({ notes: event.data.notes })
  }
}

// Subscribe to store changes and broadcast to other tabs
useNoteStore.subscribe((state) => {
  syncChannel.postMessage({ type: 'SYNC', notes: state.notes })
})
