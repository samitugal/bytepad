import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Bookmark } from '../types'

// Cross-tab sync channel
const syncChannel = new BroadcastChannel('myflowspace-bookmarks')

interface BookmarkState {
  bookmarks: Bookmark[]
  selectedCollection: string | null
  selectedTag: string | null
  searchQuery: string
  sortBy: 'date' | 'title' | 'domain'
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'domain' | 'isRead'>) => string
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void
  deleteBookmark: (id: string) => void
  toggleRead: (id: string) => void
  setSelectedCollection: (collection: string | null) => void
  setSelectedTag: (tag: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'date' | 'title' | 'domain') => void
  getTopTags: (limit?: number) => { tag: string; count: number }[]
  getCollections: () => { name: string; count: number }[]
}

const generateId = () => Math.random().toString(36).substring(2, 15)

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      selectedCollection: null,
      selectedTag: null,
      searchQuery: '',
      sortBy: 'date',

      addBookmark: (bookmarkData) => {
        const id = generateId()
        const bookmark: Bookmark = {
          ...bookmarkData,
          id,
          domain: extractDomain(bookmarkData.url),
          isRead: false,
          createdAt: new Date(),
        }
        set((state) => ({
          bookmarks: [bookmark, ...state.bookmarks],
        }))
        return id
      },

      updateBookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id
              ? {
                  ...b,
                  ...updates,
                  domain: updates.url ? extractDomain(updates.url) : b.domain,
                }
              : b
          ),
        }))
      },

      deleteBookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }))
      },

      toggleRead: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, isRead: !b.isRead } : b
          ),
        }))
      },

      setSelectedCollection: (collection) => set({ selectedCollection: collection }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),

      getTopTags: (limit = 5) => {
        const tagCounts: Record<string, number> = {}
        get().bookmarks.forEach((b) => {
          b.tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })
        })
        return Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit)
          .map(([tag, count]) => ({ tag, count }))
      },

      getCollections: () => {
        const collectionCounts: Record<string, number> = {}
        get().bookmarks.forEach((b) => {
          const collection = b.collection || 'Unsorted'
          collectionCounts[collection] = (collectionCounts[collection] || 0) + 1
        })
        return Object.entries(collectionCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([name, count]) => ({ name, count }))
      },
    }),
    {
      name: 'myflowspace-bookmarks',
      partialize: (state) => ({ bookmarks: state.bookmarks }),
    }
  )
)

// Cross-tab synchronization
syncChannel.onmessage = (event) => {
  if (event.data?.type === 'SYNC') {
    useBookmarkStore.setState({ bookmarks: event.data.bookmarks })
  }
}

useBookmarkStore.subscribe((state) => {
  syncChannel.postMessage({ type: 'SYNC', bookmarks: state.bookmarks })
})

// Filtered bookmarks selector
export const getFilteredBookmarks = (state: BookmarkState): Bookmark[] => {
  let filtered = [...state.bookmarks]

  // Filter by collection
  if (state.selectedCollection) {
    if (state.selectedCollection === 'Unsorted') {
      filtered = filtered.filter((b) => !b.collection || b.collection === 'Unsorted')
    } else {
      filtered = filtered.filter((b) => b.collection === state.selectedCollection)
    }
  }

  // Filter by tag
  if (state.selectedTag) {
    filtered = filtered.filter((b) => b.tags.includes(state.selectedTag!))
  }

  // Filter by search query
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase()
    filtered = filtered.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q))
    )
  }

  // Sort
  filtered.sort((a, b) => {
    if (state.sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (state.sortBy === 'title') {
      return a.title.localeCompare(b.title)
    }
    return a.domain.localeCompare(b.domain)
  })

  return filtered
}
