import { initializeApp, getApps } from 'firebase/app'
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  Firestore,
  Unsubscribe
} from 'firebase/firestore'
import { getAuth, onAuthStateChanged, User } from 'firebase/auth'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

const isConfigured = () => {
  return !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId)
}

// Initialize Firebase
let db: Firestore | null = null
let currentUser: User | null = null
const unsubscribers: Unsubscribe[] = []

if (isConfigured() && getApps().length === 0) {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  
  // Track auth state
  const auth = getAuth(app)
  onAuthStateChanged(auth, (user) => {
    currentUser = user
  })
}

export const isFirestoreConfigured = isConfigured

// Generic sync functions
export async function saveUserData<T>(
  collectionName: string, 
  data: T
): Promise<void> {
  if (!db || !currentUser) return
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, collectionName, 'data')
    await setDoc(docRef, { 
      data,
      updatedAt: new Date().toISOString(),
      userId: currentUser.uid
    })
  } catch (error) {
    console.error(`Error saving ${collectionName}:`, error)
  }
}

export async function loadUserData<T>(
  collectionName: string
): Promise<T | null> {
  if (!db || !currentUser) return null
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, collectionName, 'data')
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data().data as T
    }
    return null
  } catch (error) {
    console.error(`Error loading ${collectionName}:`, error)
    return null
  }
}

export function subscribeToUserData<T>(
  collectionName: string,
  callback: (data: T | null) => void
): Unsubscribe | null {
  if (!db || !currentUser) return null
  
  try {
    const docRef = doc(db, 'users', currentUser.uid, collectionName, 'data')
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data().data as T)
      } else {
        callback(null)
      }
    }, (error) => {
      console.error(`Error subscribing to ${collectionName}:`, error)
    })
    
    unsubscribers.push(unsubscribe)
    return unsubscribe
  } catch (error) {
    console.error(`Error setting up subscription for ${collectionName}:`, error)
    return null
  }
}

export function unsubscribeAll(): void {
  unsubscribers.forEach(unsub => unsub())
  unsubscribers.length = 0
}

export function getCurrentUser(): User | null {
  return currentUser
}

export { db }
