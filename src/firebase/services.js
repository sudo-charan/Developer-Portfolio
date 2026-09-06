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
import { ref, uploadBytes, getDownloadURL, deleteObject } from '@firebase/storage'
import { db, storage, auth } from './config'

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Check the Firebase environment configuration.')
  }
  return db
}

function requireStorage() {
  if (!storage) {
    throw new Error('Firebase Storage is not configured. This project runs on the Firebase Spark plan which does not include Storage. Configure Storage in the Firebase Console or upgrade to the Blaze plan.')
  }
  return storage
}

async function requireAdmin() {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Check the Firebase environment configuration.')
  }
  const user = auth.currentUser
  if (!user) {
    throw new Error('Authentication required. Please sign in.')
  }
  const tokenResult = await user.getIdTokenResult(true)
  if (tokenResult.claims?.admin !== true) {
    throw new Error('Admin privileges required.')
  }
  return user
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 10 * 1024 * 1024

function validateFile(file) {
  if (!file || !(file instanceof File)) {
    throw new Error('Invalid file: a File object is required.')
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`)
  }
}

function sanitizePath(path) {
  const clean = path.replace(/[^a-zA-Z0-9\-_./]/g, '')
  const segments = clean.split('/').filter(Boolean)
  if (segments.length === 0) {
    throw new Error('Invalid storage path: path must not be empty.')
  }
  for (const segment of segments) {
    if (segment === '..') {
      throw new Error('Invalid storage path: path traversal is not allowed.')
    }
  }
  return segments.join('/')
}

export const getSiteContent = async () => {
  const dbInstance = requireDb()
  const docRef = doc(dbInstance, 'siteContent', 'main')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export const getProjects = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'projects'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const getEducation = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'education'), orderBy('startYear', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const getCertificates = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'certificates'), orderBy('year', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
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
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'contactMessages'), orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
}

export const getUnreadMessageCount = async () => {
  const dbInstance = requireDb()
  const q = query(collection(dbInstance, 'contactMessages'), where('status', '==', 'unread'))
  const snapshot = await getDocs(q)
  return snapshot.size
}

export const getSettings = async () => {
  const dbInstance = requireDb()
  const docRef = doc(dbInstance, 'settings', 'general')
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}

export const uploadFile = async (path, file) => {
  await requireAdmin()
  validateFile(file)
  const storageInstance = requireStorage()
  const safePath = sanitizePath(path)
  const storageRef = ref(storageInstance, safePath)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export const deleteFile = async (path) => {
  await requireAdmin()
  const storageInstance = requireStorage()
  const safePath = sanitizePath(path)
  const storageRef = ref(storageInstance, safePath)
  await deleteObject(storageRef)
}

export const submitContactMessage = async (data) => {
  const dbInstance = requireDb()
  return addDoc(collection(dbInstance, 'contactMessages'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'unread',
  })
}
