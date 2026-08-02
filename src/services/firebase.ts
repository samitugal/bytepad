import { initializeApp, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, Auth } from 'firebase/auth'
import { logger } from '../utils/logger'

// Firebase configuration - User needs to add their own config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

// This module owns the single Firebase app/auth initialization for the
// whole client. Other services (e.g. src/services/firestore.ts) must
// import `app` / `auth` from here instead of calling initializeApp again.
let app: FirebaseApp | null = null
let auth: Auth | null = null

const isConfigured = () => {
  return firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
}

if (isConfigured()) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
}

export { app, auth }

const googleProvider = new GoogleAuthProvider()

export const signInWithGoogle = async (): Promise<User | null> => {
  if (!auth) {
    logger.warn('Firebase not configured. Please add Firebase config to .env file.')
    return null
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    return result.user
  } catch (error) {
    logger.error('Google sign-in error:', error)
    return null
  }
}

export const signOutUser = async (): Promise<void> => {
  if (!auth) return
  
  try {
    await signOut(auth)
  } catch (error) {
    logger.error('Sign-out error:', error)
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
