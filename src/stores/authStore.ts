import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signInWithGoogle, signOutUser, onAuthChange, isFirebaseConfigured, User } from '../services/firebase'

interface AuthState {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  initialize: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      isConfigured: isFirebaseConfigured(),

      signIn: async () => {
        set({ isLoading: true })
        const user = await signInWithGoogle()
        set({ user, isLoading: false })
      },

      signOut: async () => {
        set({ isLoading: true })
        await signOutUser()
        set({ user: null, isLoading: false })
      },

      initialize: () => {
        if (!isFirebaseConfigured()) {
          set({ isConfigured: false })
          return
        }
        
        onAuthChange((user) => {
          set({ user, isLoading: false })
        })
      },
    }),
    {
      name: 'myflowspace-auth',
      partialize: () => ({ 
        // Don't persist user object, let Firebase handle it
      }),
    }
  )
)
