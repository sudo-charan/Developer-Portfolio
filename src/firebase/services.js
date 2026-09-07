import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  addDoc,
  serverTimestamp,
} from '@firebase/firestore'
import { db } from './config'
import { withTimeout } from './errors'

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Check the Firebase environment configuration.')
  }
  return db
}

export { requireDb }

async function withTimeoutAndDb(operation) {
  requireDb()
  return withTimeout(operation, 15000)
}

export const getSiteContent = async () => {
  const dbInstance = requireDb()
  const docRef = doc(dbInstance, 'siteContent', 'main')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

function sortByOrder(items, fallbackKey, fallbackDesc = false) {
  return [...items].sort((a, b) => {
    const aOrder = typeof a.order === 'number'
    const bOrder = typeof b.order === 'number'
    if (aOrder && bOrder) return a.order - b.order
    if (aOrder) return -1
    if (bOrder) return 1
    const aVal = a[fallbackKey]
    const bVal = b[fallbackKey]
    if (fallbackDesc) return (bVal > aVal) ? 1 : (bVal < aVal) ? -1 : 0
    return (aVal > bVal) ? 1 : (aVal < bVal) ? -1 : 0
  })
}

export const getProjects = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'projects'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return sortByOrder(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    'createdAt',
    true
  )
}

export const getSkills = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'skills'), orderBy('order', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const getExperience = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'experience'), orderBy('startDate', 'desc'))
  const snapshot = await getDocs(q)
  return sortByOrder(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    'startDate',
    true
  )
}

export const getEducation = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'education'), orderBy('startYear', 'desc'))
  const snapshot = await getDocs(q)
  return sortByOrder(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    'startYear',
    true
  )
}

export const getCertificates = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'certificates'), orderBy('year', 'desc'))
  const snapshot = await getDocs(q)
  return sortByOrder(
    snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    'year',
    true
  )
}

export const getCurrentWork = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'currentWork'), orderBy('order', 'asc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const getBlogPosts = async (status = 'published') => {
  const dbInstance = requireDb()
  let q
  if (status === 'all') {
    q = query(collection(dbInstance, 'blogPosts'))
  } else {
    q = query(collection(dbInstance, 'blogPosts'), where('status', '==', status))
  }
  const snapshot = await getDocs(q)
  let posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  posts = posts.sort((a, b) => {
    const aTime = a.publishedAt?.seconds ? a.publishedAt.seconds * 1000 : new Date(a.publishedAt || 0).getTime()
    const bTime = b.publishedAt?.seconds ? b.publishedAt.seconds * 1000 : new Date(b.publishedAt || 0).getTime()
    return bTime - aTime
  })
  return posts
}

export const getBlogPost = async (id) => {
  const dbInstance = requireDb()
  const docRef = doc(dbInstance, 'blogPosts', id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export const getContactMessages = async () => {
  return withTimeoutAndDb(async () => {
    const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  })
}

export const getUnreadMessageCount = async () => {
  return withTimeoutAndDb(async () => {
    const q = query(collection(db, 'contactMessages'), where('status', '==', 'unread'))
    const snapshot = await getDocs(q)
    return snapshot.size
  })
}

export const getSettings = async () => {
  const dbInstance = requireDb()
  const docRef = doc(dbInstance, 'settings', 'general')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export const submitContactMessage = async (data) => {
  const dbInstance = requireDb()
  return addDoc(collection(dbInstance, 'contactMessages'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'unread',
  })
}
