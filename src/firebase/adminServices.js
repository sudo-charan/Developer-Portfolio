import {
  collection,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'
import { uploadFile, deleteFile } from './services'
import { withTimeout, getUserFriendlyFirebaseError } from './errors'

const requireDb = () => {
  if (!db) {
    throw new Error('Firestore is not initialized. Check your Firebase config in .env')
  }
}

async function withTimeoutAndDb(operation) {
  requireDb()
  return withTimeout(operation, 15000)
}

export const addProject = async (project) => {
  try {
    const data = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'projects'), data))
    return ref.id
  } catch (err) {
    console.error('addProject failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateProject = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() }))
  } catch (err) {
    console.error('updateProject failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteProject = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'projects', id)))
  } catch (err) {
    console.error('deleteProject failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const addSkill = async (skill) => {
  try {
    const data = {
      ...skill,
      order: skill.order ?? Date.now(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'skills'), data))
    return ref.id
  } catch (err) {
    console.error('[Firebase CRUD] addSkill failed', {
      code: err.code,
      message: err.message,
    })
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateSkill = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'skills', id), data))
  } catch (err) {
    console.error('[Firebase CRUD] updateSkill failed', {
      collection: 'skills',
      id,
      code: err.code,
      message: err.message,
    })
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteSkill = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'skills', id)))
  } catch (err) {
    console.error('[Firebase CRUD] deleteSkill failed', {
      collection: 'skills',
      id,
      code: err.code,
      message: err.message,
    })
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const addExperience = async (exp) => {
  try {
    const data = {
      ...exp,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'experience'), data))
    return ref.id
  } catch (err) {
    console.error('addExperience failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateExperience = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'experience', id), data))
  } catch (err) {
    console.error('updateExperience failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteExperience = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'experience', id)))
  } catch (err) {
    console.error('deleteExperience failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const addEducation = async (edu) => {
  try {
    const data = {
      ...edu,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'education'), data))
    return ref.id
  } catch (err) {
    console.error('addEducation failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateEducation = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'education', id), data))
  } catch (err) {
    console.error('updateEducation failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteEducation = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'education', id)))
  } catch (err) {
    console.error('deleteEducation failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const addCertificate = async (cert) => {
  try {
    const data = {
      ...cert,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'certificates'), data))
    return ref.id
  } catch (err) {
    console.error('addCertificate failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateCertificate = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'certificates', id), data))
  } catch (err) {
    console.error('updateCertificate failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteCertificate = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'certificates', id)))
  } catch (err) {
    console.error('deleteCertificate failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const addCurrentWork = async (item) => {
  try {
    const data = {
      ...item,
      order: item.order ?? Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'currentWork'), data))
    return ref.id
  } catch (err) {
    console.error('addCurrentWork failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateCurrentWork = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'currentWork', id), { ...data, updatedAt: serverTimestamp() }))
  } catch (err) {
    console.error('updateCurrentWork failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteCurrentWork = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'currentWork', id)))
  } catch (err) {
    console.error('deleteCurrentWork failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const createBlogPost = async (post) => {
  try {
    const data = {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: post.publishedAt || serverTimestamp(),
    }
    const ref = await withTimeoutAndDb(() => addDoc(collection(db, 'blogPosts'), data))
    return ref.id
  } catch (err) {
    console.error('createBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateBlogPost = async (id, data) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'blogPosts', id), { ...data, updatedAt: serverTimestamp() }))
  } catch (err) {
    console.error('updateBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteBlogPost = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'blogPosts', id)))
  } catch (err) {
    console.error('deleteBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateSiteContent = async (data) => {
  try {
    const ref = doc(db, 'siteContent', 'main')
    await withTimeoutAndDb(() => setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true }))
  } catch (err) {
    console.error('updateSiteContent failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateSettings = async (data) => {
  try {
    const ref = doc(db, 'settings', 'general')
    await withTimeoutAndDb(() => setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true }))
  } catch (err) {
    console.error('updateSettings failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateMessageStatus = async (id, status) => {
  try {
    await withTimeoutAndDb(() => updateDoc(doc(db, 'contactMessages', id), { status }))
  } catch (err) {
    console.error('updateMessageStatus failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteContactMessage = async (id) => {
  try {
    await withTimeoutAndDb(() => deleteDoc(doc(db, 'contactMessages', id)))
  } catch (err) {
    console.error('deleteContactMessage failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const uploadAdminFile = async (path, file) => {
  try {
    return await withTimeoutAndDb(() => uploadFile(`admin/${path}`, file))
  } catch (err) {
    console.error('uploadAdminFile failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteAdminFile = async (path) => {
  try {
    return await withTimeoutAndDb(() => deleteFile(`admin/${path}`))
  } catch (err) {
    console.error('deleteAdminFile failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}
