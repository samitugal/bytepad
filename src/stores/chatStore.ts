import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage } from '../types'

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setOpen: (open: boolean) => void
  toggleOpen: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isLoading: false,
      error: null,
      
      addMessage: (message) => set((state) => ({
        messages: [
          ...state.messages,
          {
            ...message,
            id: crypto.randomUUID(),
            timestamp: new Date(),
          }
        ].slice(-50) // Keep last 50 messages
      })),
      
      clearMessages: () => set({ messages: [] }),
      
      setOpen: (open) => set({ isOpen: open }),
      
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
    }),
    {
      name: 'bytepad-chat',
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    }
  )
)
