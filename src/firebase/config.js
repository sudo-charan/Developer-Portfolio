import { initializeApp, getApps, getApp } from '@firebase/app'
import { getAuth } from '@firebase/auth'
import { getFirestore } from '@firebase/firestore'
import { getStorage } from '@firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let app = null
try {
  const hasExisting = getApps().length > 0
  app = hasExisting ? getApp() : initializeApp(firebaseConfig)
} catch (error) {
  console.error('Firebase initialization error:', error)
}

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null

let storage = null
if (app && firebaseConfig.storageBucket) {
  try {
    storage = getStorage(app)
  } catch (error) {
    console.warn('Firebase Storage not available:', error)
  }
}
export { storage }

export default app
