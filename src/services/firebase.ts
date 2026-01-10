import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'

// Firebase configuration - User needs to add their own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// Initialize Firebase only if config is provided
let app: ReturnType<typeof initializeApp> | null = null
let auth: ReturnType<typeof getAuth> | null = null

const isConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
}

if (isConfigured()) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    console.warn('Firebase not configured. Please add Firebase config to .env file.')
    return null
  }
  
  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    return null
  }
}

export const signOutUser = async (): Promise<void> => {
  if (!auth) return
  
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Sign-out error:', error)
  }
}

export const onAuthChange = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null)
    return () => {}
  }
  
  return onAuthStateChanged(auth, callback)
}

export const isFirebaseConfigured = isConfigured

export type { User }
