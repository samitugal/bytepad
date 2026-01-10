import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyNote, DailyNoteCard } from '../types'

const syncChannel = new BroadcastChannel('myflowspace-dailynotes')

type FilterType = 'all' | 'pinned' | 'newest'

interface DailyNotesState {
  dailyNotes: DailyNote[]
  currentDate: string // YYYY-MM-DD
  filter: FilterType
  searchQuery: string
  
  // Actions
  setCurrentDate: (date: string) => void
  goToToday: () => void
  goToPrevDay: () => void
  goToNextDay: () => void
  setFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  
  // Daily Note CRUD
  getDailyNote: (date: string) => DailyNote | undefined
  getOrCreateDailyNote: (date: string) => DailyNote
  
  // Card CRUD
  addCard: (date: string, card: Omit<DailyNoteCard, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateCard: (date: string, cardId: string, updates: Partial<DailyNoteCard>) => void
  deleteCard: (date: string, cardId: string) => void
  togglePinCard: (date: string, cardId: string) => void
  
  // Filtered cards
  getFilteredCards: (date: string) => DailyNoteCard[]
}

const generateId = () => Math.random().toString(36).substring(2, 15)

const getTodayString = () => new Date().toISOString().split('T')[0]

export const useDailyNotesStore = create<DailyNotesState>()(
  persist(
    (set, get) => ({
      dailyNotes: [],
      currentDate: getTodayString(),
      filter: 'all',
      searchQuery: '',

      setCurrentDate: (date) => set({ currentDate: date }),
      
      goToToday: () => set({ currentDate: getTodayString() }),
      
      goToPrevDay: () => {
        const current = new Date(get().currentDate)
        current.setDate(current.getDate() - 1)
        set({ currentDate: current.toISOString().split('T')[0] })
      },
      
      goToNextDay: () => {
        const current = new Date(get().currentDate)
        current.setDate(current.getDate() + 1)
        set({ currentDate: current.toISOString().split('T')[0] })
      },
      
      setFilter: (filter) => set({ filter }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),

      getDailyNote: (date) => {
        return get().dailyNotes.find(dn => dn.date === date)
      },

      getOrCreateDailyNote: (date) => {
        const existing = get().dailyNotes.find(dn => dn.date === date)
        if (existing) return existing

        const now = new Date()
        const newNote: DailyNote = {
          id: generateId(),
          date,
          cards: [],
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => ({
          dailyNotes: [...state.dailyNotes, newNote],
        }))
        
        syncChannel.postMessage({ type: 'sync' })
        return newNote
      },

      addCard: (date, cardData) => {
        const cardId = generateId()
        const now = new Date()
        const newCard: DailyNoteCard = {
          ...cardData,
          id: cardId,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => {
          const noteIndex = state.dailyNotes.findIndex(dn => dn.date === date)
          
          if (noteIndex === -1) {
            // Create new daily note with this card
            const newNote: DailyNote = {
              id: generateId(),
              date,
              cards: [newCard],
              createdAt: now,
              updatedAt: now,
            }
            return { dailyNotes: [...state.dailyNotes, newNote] }
          }
          
          // Add card to existing note
          const updatedNotes = [...state.dailyNotes]
          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            cards: [...updatedNotes[noteIndex].cards, newCard],
            updatedAt: now,
          }
          return { dailyNotes: updatedNotes }
        })

        syncChannel.postMessage({ type: 'sync' })
        return cardId
      },

      updateCard: (date, cardId, updates) => {
        set((state) => {
          const noteIndex = state.dailyNotes.findIndex(dn => dn.date === date)
          if (noteIndex === -1) return state

          const updatedNotes = [...state.dailyNotes]
          const cardIndex = updatedNotes[noteIndex].cards.findIndex(c => c.id === cardId)
          if (cardIndex === -1) return state

          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            cards: updatedNotes[noteIndex].cards.map(card =>
              card.id === cardId
                ? { ...card, ...updates, updatedAt: new Date() }
                : card
            ),
            updatedAt: new Date(),
          }
          return { dailyNotes: updatedNotes }
        })

        syncChannel.postMessage({ type: 'sync' })
      },

      deleteCard: (date, cardId) => {
        set((state) => {
          const noteIndex = state.dailyNotes.findIndex(dn => dn.date === date)
          if (noteIndex === -1) return state

          const updatedNotes = [...state.dailyNotes]
          updatedNotes[noteIndex] = {
            ...updatedNotes[noteIndex],
            cards: updatedNotes[noteIndex].cards.filter(c => c.id !== cardId),
            updatedAt: new Date(),
          }
          return { dailyNotes: updatedNotes }
        })

        syncChannel.postMessage({ type: 'sync' })
      },

      togglePinCard: (date, cardId) => {
        const state = get()
        const note = state.dailyNotes.find(dn => dn.date === date)
        if (!note) return

        const card = note.cards.find(c => c.id === cardId)
        if (!card) return

        get().updateCard(date, cardId, { pinned: !card.pinned })
      },

      getFilteredCards: (date) => {
        const state = get()
        const note = state.dailyNotes.find(dn => dn.date === date)
        if (!note) return []

        let cards = [...note.cards]

        // Apply search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase()
          cards = cards.filter(card =>
            card.title.toLowerCase().includes(query) ||
            card.content.toLowerCase().includes(query) ||
            card.tags.some(tag => tag.toLowerCase().includes(query))
          )
        }

        // Apply filter type
        switch (state.filter) {
          case 'pinned':
            cards = cards.filter(card => card.pinned)
            break
          case 'newest':
            cards = cards.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            break
          default:
            // 'all' - pinned first, then by date
            cards = cards.sort((a, b) => {
              if (a.pinned && !b.pinned) return -1
              if (!a.pinned && b.pinned) return 1
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            })
        }

        return cards
      },
    }),
    {
      name: 'myflowspace-dailynotes',
    }
  )
)

// Cross-tab sync listener
syncChannel.onmessage = () => {
  // Trigger re-render by getting fresh state
  useDailyNotesStore.persist.rehydrate()
}
