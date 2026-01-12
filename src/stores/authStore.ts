import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { signInWithGoogle, signOutUser, onAuthChange, isFirebaseConfigured, User } from '../services/firebase'
import { initializeCloudSync, stopCloudSync } from '../services/cloudSync'

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
        
        // Initialize cloud sync after login
        if (user) {
          setTimeout(() => initializeCloudSync(), 500)
        }
      },

      signOut: async () => {
        set({ isLoading: true })
        stopCloudSync()
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
          
          // Initialize cloud sync if user is logged in
          if (user) {
            setTimeout(() => initializeCloudSync(), 500)
          } else {
            stopCloudSync()
          }
        })
      },
    }),
    {
      name: 'bytepad-auth',
      partialize: () => ({ 
        // Don't persist user object, let Firebase handle it
      }),
    }
  )
)
