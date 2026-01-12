import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TabType = 'note' | 'task' | 'dailynote' | 'journal' | 'bookmark' | 'home'

export interface Tab {
  id: string
  type: TabType
  entityId: string | null
  title: string
  isActive: boolean
  isPinned: boolean
}

interface TabState {
  tabs: Tab[]
  activeTabId: string | null
  maxTabs: number

  // Actions
  addTab: (type: TabType, entityId?: string | null, title?: string) => string
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabTitle: (tabId: string, title: string) => void
  updateTabEntity: (tabId: string, entityId: string) => void
  pinTab: (tabId: string) => void
  unpinTab: (tabId: string) => void
  closeOtherTabs: (tabId: string) => void
  closeAllTabs: () => void
  closeTabsToRight: (tabId: string) => void
  getActiveTab: () => Tab | undefined
  findTabByEntity: (type: TabType, entityId: string) => Tab | undefined
}

function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      maxTabs: 10,

      addTab: (type, entityId = null, title = 'Untitled') => {
        const state = get()
        
        // Check if tab with same entity already exists
        if (entityId) {
          const existingTab = state.tabs.find(t => t.type === type && t.entityId === entityId)
          if (existingTab) {
            // Activate existing tab instead of creating new one
            set({
              tabs: state.tabs.map(t => ({ ...t, isActive: t.id === existingTab.id })),
              activeTabId: existingTab.id,
            })
            return existingTab.id
          }
        }

        // Check max tabs limit
        if (state.tabs.length >= state.maxTabs) {
          // Close oldest unpinned tab
          const unpinnedTabs = state.tabs.filter(t => !t.isPinned)
          if (unpinnedTabs.length > 0) {
            const oldestTab = unpinnedTabs[0]
            set({
              tabs: state.tabs.filter(t => t.id !== oldestTab.id),
            })
          } else {
            // All tabs are pinned, can't add more
            return state.activeTabId || ''
          }
        }

        const newTab: Tab = {
          id: generateTabId(),
          type,
          entityId,
          title,
          isActive: true,
          isPinned: false,
        }

        set({
          tabs: [...state.tabs.map(t => ({ ...t, isActive: false })), newTab],
          activeTabId: newTab.id,
        })

        return newTab.id
      },

      closeTab: (tabId) => {
        const state = get()
        const tabIndex = state.tabs.findIndex(t => t.id === tabId)
        if (tabIndex === -1) return

        const newTabs = state.tabs.filter(t => t.id !== tabId)
        
        // If closing active tab, activate adjacent tab
        let newActiveTabId = state.activeTabId
        if (state.activeTabId === tabId && newTabs.length > 0) {
          // Try to activate the tab to the right, or left if at end
          const newIndex = Math.min(tabIndex, newTabs.length - 1)
          newActiveTabId = newTabs[newIndex].id
          newTabs[newIndex].isActive = true
        } else if (newTabs.length === 0) {
          newActiveTabId = null
        }

        set({
          tabs: newTabs.map(t => ({ ...t, isActive: t.id === newActiveTabId })),
          activeTabId: newActiveTabId,
        })
      },

      setActiveTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map(t => ({ ...t, isActive: t.id === tabId })),
          activeTabId: tabId,
        }))
      },

      updateTabTitle: (tabId, title) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === tabId ? { ...t, title } : t),
        }))
      },

      updateTabEntity: (tabId, entityId) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === tabId ? { ...t, entityId } : t),
        }))
      },

      pinTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === tabId ? { ...t, isPinned: true } : t),
        }))
      },

      unpinTab: (tabId) => {
        set((state) => ({
          tabs: state.tabs.map(t => t.id === tabId ? { ...t, isPinned: false } : t),
        }))
      },

      closeOtherTabs: (tabId) => {
        set((state) => ({
          tabs: state.tabs.filter(t => t.id === tabId || t.isPinned),
          activeTabId: tabId,
        }))
      },

      closeAllTabs: () => {
        set((state) => ({
          tabs: state.tabs.filter(t => t.isPinned),
          activeTabId: state.tabs.find(t => t.isPinned)?.id || null,
        }))
      },

      closeTabsToRight: (tabId) => {
        const state = get()
        const tabIndex = state.tabs.findIndex(t => t.id === tabId)
        if (tabIndex === -1) return

        set({
          tabs: state.tabs.filter((t, i) => i <= tabIndex || t.isPinned),
        })
      },

      getActiveTab: () => {
        const state = get()
        return state.tabs.find(t => t.id === state.activeTabId)
      },

      findTabByEntity: (type, entityId) => {
        return get().tabs.find(t => t.type === type && t.entityId === entityId)
      },
    }),
    {
      name: 'bytepad-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
)
