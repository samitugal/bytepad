import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Firestore,
  Unsubscribe
} from 'firebase/firestore'
import { onAuthStateChanged, User } from 'firebase/auth'
import { app, auth, isFirebaseConfigured } from './firebase'
import { logger } from '../utils/logger'

// Firebase app/auth are initialized once in src/services/firebase.ts;
// this module only derives Firestore from that shared app instance.
let db: Firestore | null = null
let currentUser: User | null = null
const unsubscribers: Unsubscribe[] = []

if (app && auth) {
  db = getFirestore(app)

  // Track auth state
  onAuthStateChanged(auth, (user) => {
    currentUser = user
  })
}

export const isFirestoreConfigured = isFirebaseConfigured

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
    logger.error(`Error saving ${collectionName}:`, error)
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
    logger.error(`Error loading ${collectionName}:`, error)
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
      logger.error(`Error subscribing to ${collectionName}:`, error)
    })
    
    unsubscribers.push(unsubscribe)
    return unsubscribe
  } catch (error) {
    logger.error(`Error setting up subscription for ${collectionName}:`, error)
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
