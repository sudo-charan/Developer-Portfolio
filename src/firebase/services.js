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
import { ref, uploadBytes, getDownloadURL, deleteObject } from '@firebase/storage'
import { db, storage } from './config'

function requireDb() {
  if (!db) {
    throw new Error('Firestore is not initialized. Check the Firebase environment configuration.')
  }
  return db
}

function requireStorage() {
  if (!storage) {
    throw new Error('Firebase Storage is not initialized. Check the Firebase environment configuration.')
  }
  return storage
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
    q = query(collection(dbInstance, 'blogPosts'), orderBy('publishedAt', 'desc'))
  } else {
    q = query(
      collection(dbInstance, 'blogPosts'),
      where('status', '==', status),
      orderBy('publishedAt', 'desc')
    )
  }
  const snapshot = await getDocs(q)
  let posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
  if (status !== 'all') {
    posts = posts.sort((a, b) => {
      const aTime = a.publishedAt?.seconds ? a.publishedAt.seconds * 1000 : new Date(a.publishedAt || 0).getTime()
      const bTime = b.publishedAt?.seconds ? b.publishedAt.seconds * 1000 : new Date(b.publishedAt || 0).getTime()
      return bTime - aTime
    })
  }
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
  const storageInstance = requireStorage()
  const storageRef = ref(storageInstance, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export const deleteFile = async (path) => {
  const storageInstance = requireStorage()
  const storageRef = ref(storageInstance, path)
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
