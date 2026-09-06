import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { db, auth, storage } from '../../firebase/config'
import StatusIndicator from '../components/StatusIndicator'

const FIRESTORE_CHECK_COLLECTION = 'settings'
const FIRESTORE_CHECK_DOC = 'general'

async function checkFirestore() {
  if (!db) return { status: 'error', value: 'NOT INITIALIZED' }
  try {
    const { doc, getDoc } = await import('@firebase/firestore')
    const docRef = doc(db, FIRESTORE_CHECK_COLLECTION, FIRESTORE_CHECK_DOC)
    await getDoc(docRef)
    return { status: 'online', value: 'CONNECTED' }
  } catch (err) {
    console.error('[SystemStatus] Firestore check failed:', err)
    return { status: 'error', value: 'CONNECTION ERROR' }
  }
}

export default function SystemStatus() {
  const [status, setStatus] = useState({
    firebase: { status: 'loading', value: 'CHECKING' },
    firestore: { status: 'loading', value: 'CHECKING' },
    auth: { status: 'loading', value: 'CHECKING' },
    storage: { status: 'loading', value: 'CHECKING' },
    website: { status: 'online', value: 'ONLINE' },
  })

  const performChecks = useCallback(async () => {
    const firebaseStatus = db ? { status: 'online', value: 'INITIALIZED' } : { status: 'error', value: 'NOT INITIALIZED' }
    const authStatus = auth ? { status: 'online', value: 'ACTIVE' } : { status: 'error', value: 'NOT INITIALIZED' }
    const storageStatus = storage ? { status: 'online', value: 'AVAILABLE' } : { status: 'error', value: 'NOT INITIALIZED' }
    const firestoreStatus = await checkFirestore()

    return {
      firebase: firebaseStatus,
      firestore: firestoreStatus,
      auth: authStatus,
      storage: storageStatus,
      website: { status: 'online', value: 'ONLINE' },
    }
  }, [])

  useEffect(() => {
    performChecks().then(setStatus)
  }, [performChecks])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-dark-border bg-dark-surface p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">System Status</p>
          <button
            onClick={() => performChecks().then(setStatus)}
          className="p-1.5 border border-dark-border hover:border-accent hover:text-accent transition-colors"
          aria-label="Refresh system status"
        >
          <RefreshCw size={12} aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-4">
        <StatusIndicator label="Firebase" status={status.firebase.status} value={status.firebase.value} />
        <StatusIndicator label="Firestore" status={status.firestore.status} value={status.firestore.value} />
        <StatusIndicator label="Authentication" status={status.auth.status} value={status.auth.value} />
        <StatusIndicator label="Storage" status={status.storage.status} value={status.storage.value} />
        <StatusIndicator label="Website" status={status.website.status} value={status.website.value} />
      </div>
    </motion.div>
  )
}
