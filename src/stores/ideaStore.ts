import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Idea } from '../types'
import { useGamificationStore, XP_VALUES } from './gamificationStore'
import { useNoteStore } from './noteStore'

const syncChannel = new BroadcastChannel('bytepad-ideas')

interface IdeaState {
  ideas: Idea[]
  filter: 'all' | 'active' | 'archived'
  
  addIdea: (idea: Partial<Idea>) => string
  updateIdea: (id: string, updates: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  archiveIdea: (id: string) => void
  unarchiveIdea: (id: string) => void
  reorderIdeas: (ideaIds: string[]) => void
  convertToNote: (id: string) => string | null
  linkToNote: (ideaId: string, noteId: string) => void
  linkToTask: (ideaId: string, taskId: string) => void
  unlinkNote: (ideaId: string, noteId: string) => void
  unlinkTask: (ideaId: string, taskId: string) => void
  setFilter: (filter: 'all' | 'active' | 'archived') => void
  getFilteredIdeas: () => Idea[]
}

const generateId = () => Math.random().toString(36).substring(2, 15)

export const useIdeaStore = create<IdeaState>()(
  persist(
    (set, get) => ({
      ideas: [],
      filter: 'active',

      addIdea: (ideaData) => {
        const id = generateId()
        const now = new Date()
        const ideas = get().ideas
        const maxOrder = ideas.length > 0 ? Math.max(...ideas.map(i => i.order)) : 0
        
        const idea: Idea = {
          title: ideaData.title || '',
          content: ideaData.content || '',
          color: ideaData.color || 'yellow',
          tags: ideaData.tags || [],
          linkedNoteIds: ideaData.linkedNoteIds || [],
          linkedTaskIds: ideaData.linkedTaskIds || [],
          status: 'active',
          order: maxOrder + 1,
          id,
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => ({
          ideas: [...state.ideas, idea],
        }))

        // Award XP
        const gamification = useGamificationStore.getState()
        gamification.addXP(XP_VALUES.noteCreate, 'noteCreate')

        // Sync across tabs
        syncChannel.postMessage({ type: 'add', idea })

        return id
      },

      updateIdea: (id, updates) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id
              ? { ...idea, ...updates, updatedAt: new Date() }
              : idea
          ),
        }))
        syncChannel.postMessage({ type: 'update', id, updates })
      },

      deleteIdea: (id) => {
        set((state) => ({
          ideas: state.ideas.filter((idea) => idea.id !== id),
        }))
        syncChannel.postMessage({ type: 'delete', id })
      },

      archiveIdea: (id) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id
              ? { ...idea, status: 'archived', updatedAt: new Date() }
              : idea
          ),
        }))
      },

      unarchiveIdea: (id) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === id
              ? { ...idea, status: 'active', updatedAt: new Date() }
              : idea
          ),
        }))
      },

      reorderIdeas: (ideaIds) => {
        set((state) => ({
          ideas: state.ideas.map((idea) => {
            const newOrder = ideaIds.indexOf(idea.id)
            if (newOrder !== -1) {
              return { ...idea, order: newOrder }
            }
            return idea
          }),
        }))
      },

      convertToNote: (id) => {
        const idea = get().ideas.find((i) => i.id === id)
        if (!idea) return null

        // Create note from idea
        const noteStore = useNoteStore.getState()
        const noteId = noteStore.addNote({
          title: idea.title || idea.content.slice(0, 50),
          content: idea.content,
          tags: idea.tags,
        })

        // Update idea status and link to note
        set((state) => ({
          ideas: state.ideas.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status: 'converted',
                  linkedNoteIds: [...i.linkedNoteIds, noteId],
                  updatedAt: new Date(),
                }
              : i
          ),
        }))

        return noteId
      },

      linkToNote: (ideaId, noteId) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === ideaId && !idea.linkedNoteIds.includes(noteId)
              ? {
                  ...idea,
                  linkedNoteIds: [...idea.linkedNoteIds, noteId],
                  updatedAt: new Date(),
                }
              : idea
          ),
        }))
      },

      linkToTask: (ideaId, taskId) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === ideaId && !idea.linkedTaskIds.includes(taskId)
              ? {
                  ...idea,
                  linkedTaskIds: [...idea.linkedTaskIds, taskId],
                  updatedAt: new Date(),
                }
              : idea
          ),
        }))
      },

      unlinkNote: (ideaId, noteId) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === ideaId
              ? {
                  ...idea,
                  linkedNoteIds: idea.linkedNoteIds.filter((id) => id !== noteId),
                  updatedAt: new Date(),
                }
              : idea
          ),
        }))
      },

      unlinkTask: (ideaId, taskId) => {
        set((state) => ({
          ideas: state.ideas.map((idea) =>
            idea.id === ideaId
              ? {
                  ...idea,
                  linkedTaskIds: idea.linkedTaskIds.filter((id) => id !== taskId),
                  updatedAt: new Date(),
                }
              : idea
          ),
        }))
      },

      setFilter: (filter) => set({ filter }),

      getFilteredIdeas: () => {
        const { ideas, filter } = get()
        let filtered = ideas

        if (filter === 'active') {
          filtered = ideas.filter((i) => i.status === 'active')
        } else if (filter === 'archived') {
          filtered = ideas.filter((i) => i.status === 'archived' || i.status === 'converted')
        }

        return filtered.sort((a, b) => a.order - b.order)
      },
    }),
    {
      name: 'bytepad-ideas',
    }
  )
)

// Listen for cross-tab sync
syncChannel.onmessage = (event) => {
  const { type, idea, id, updates } = event.data
  const store = useIdeaStore.getState()

  if (type === 'add' && idea) {
    useIdeaStore.setState((state) => ({
      ideas: state.ideas.some((i) => i.id === idea.id)
        ? state.ideas
        : [...state.ideas, idea],
    }))
  } else if (type === 'update' && id && updates) {
    store.updateIdea(id, updates)
  } else if (type === 'delete' && id) {
    store.deleteIdea(id)
  }
}
