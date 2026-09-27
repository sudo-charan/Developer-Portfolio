import {
  collection,
  doc,
  writeBatch,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  deleteField,
} from '@firebase/firestore'
import { getIdTokenResult } from '@firebase/auth'
import { db, auth } from './config'
import { withTimeout, getUserFriendlyFirebaseError } from './errors'
import { requireDb } from './services'

/**
 * Ensures the current user has a valid Firebase ID token with the `admin`
 * custom claim. Force-refreshes the token so the Firestore SDK picks up the
 * latest claims before any admin operation proceeds.
 *
 * This closes the gap where AdminSessionContext validates the claim via
 * getIdTokenResult but the Firestore SDK's internal token cache may lag.
 */
async function requireAdminToken() {
  if (!auth || !auth.currentUser) {
    throw new Error('No authenticated user. Please sign in.')
  }
  const tokenResult = await getIdTokenResult(auth.currentUser, true)
  const hasAdminClaim = tokenResult.claims?.admin === true
  if (!hasAdminClaim) {
    throw new Error('Missing admin claim. Access denied.')
  }
  return tokenResult
}

async function withTimeoutAndDb(operation) {
  await requireAdminToken()
  requireDb()
  return withTimeout(operation, 15000)
}

async function commitAuditedMutation({ action, collectionName, entityId, label, mutate }) {
  return withTimeoutAndDb(async () => {
    const batch = writeBatch(db)
    mutate(batch)
    batch.set(doc(collection(db, 'adminActivity')), {
      action,
      collection: collectionName,
      entityId,
      label: String(label || entityId).slice(0, 120),
      actor: auth.currentUser.email || 'admin',
      createdAt: serverTimestamp(),
    })
    await batch.commit()
  })
}

function blogPostAction(data) {
  if (data.status === 'scheduled') return 'scheduled'
  const fields = Object.keys(data).filter((field) => !['publishedAt', 'scheduledAt'].includes(field))
  if (fields.length === 1 && data.status === 'published') return 'published'
  if (fields.length === 1 && data.status === 'draft') return 'unpublished'
  return 'updated'
}

export const addProject = async (project) => {
  try {
    const data = {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      order: project.order ?? Date.now(),
    }
    const ref = doc(collection(db, 'projects'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'projects',
      entityId: ref.id,
      label: project.name,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('addProject failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateProject = async (id, data) => {
  try {
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'projects',
      entityId: id,
      label: data.name || id,
      mutate: (batch) => batch.update(doc(db, 'projects', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateProject failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteProject = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'projects',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'projects', id)),
    })
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
    const ref = doc(collection(db, 'skills'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'skills',
      entityId: ref.id,
      label: skill.name,
      mutate: (batch) => batch.set(ref, data),
    })
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
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'skills',
      entityId: id,
      label: data.name || id,
      mutate: (batch) => batch.update(doc(db, 'skills', id), { ...data, updatedAt: serverTimestamp() }),
    })
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
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'skills',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'skills', id)),
    })
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
      order: exp.order ?? Date.now(),
    }
    const ref = doc(collection(db, 'experience'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'experience',
      entityId: ref.id,
      label: exp.role || exp.company,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('addExperience failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateExperience = async (id, data) => {
  try {
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'experience',
      entityId: id,
      label: data.role || data.company || id,
      mutate: (batch) => batch.update(doc(db, 'experience', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateExperience failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteExperience = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'experience',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'experience', id)),
    })
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
      order: edu.order ?? Date.now(),
    }
    const ref = doc(collection(db, 'education'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'education',
      entityId: ref.id,
      label: edu.degree || edu.institution,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('addEducation failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateEducation = async (id, data) => {
  try {
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'education',
      entityId: id,
      label: data.degree || data.institution || id,
      mutate: (batch) => batch.update(doc(db, 'education', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateEducation failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteEducation = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'education',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'education', id)),
    })
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
      order: cert.order ?? Date.now(),
    }
    const ref = doc(collection(db, 'certificates'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'certificates',
      entityId: ref.id,
      label: cert.name,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('addCertificate failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateCertificate = async (id, data) => {
  try {
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'certificates',
      entityId: id,
      label: data.name || id,
      mutate: (batch) => batch.update(doc(db, 'certificates', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateCertificate failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteCertificate = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'certificates',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'certificates', id)),
    })
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
    const ref = doc(collection(db, 'currentWork'))
    await commitAuditedMutation({
      action: 'created',
      collectionName: 'currentWork',
      entityId: ref.id,
      label: item.title,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('addCurrentWork failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateCurrentWork = async (id, data) => {
  try {
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'currentWork',
      entityId: id,
      label: data.title || id,
      mutate: (batch) => batch.update(doc(db, 'currentWork', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateCurrentWork failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteCurrentWork = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'currentWork',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'currentWork', id)),
    })
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
    }
    if (post.status === 'published') {
      data.publishedAt = post.publishedAt || serverTimestamp()
    }
    const ref = doc(collection(db, 'blogPosts'))
    await commitAuditedMutation({
      action: post.status === 'published' ? 'published' : post.status === 'scheduled' ? 'scheduled' : 'created',
      collectionName: 'blogPosts',
      entityId: ref.id,
      label: post.title,
      mutate: (batch) => batch.set(ref, data),
    })
    return ref.id
  } catch (err) {
    console.error('createBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateBlogPost = async (id, data, activityAction = blogPostAction(data)) => {
  try {
    await commitAuditedMutation({
      action: activityAction,
      collectionName: 'blogPosts',
      entityId: id,
      label: data.title || id,
      mutate: (batch) => batch.update(doc(db, 'blogPosts', id), { ...data, updatedAt: serverTimestamp() }),
    })
  } catch (err) {
    console.error('updateBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteBlogPost = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'deleted',
      collectionName: 'blogPosts',
      entityId: id,
      label: id,
      mutate: (batch) => batch.delete(doc(db, 'blogPosts', id)),
    })
  } catch (err) {
    console.error('deleteBlogPost failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateSettings = async (data) => {
  try {
    const ref = doc(db, 'settings', 'general')
    await commitAuditedMutation({
      action: 'updated',
      collectionName: 'settings',
      entityId: ref.id,
      label: 'General settings',
      mutate: (batch) => batch.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true }),
    })
  } catch (err) {
    console.error('updateSettings failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const getRecentAdminActivity = async (count = 10) => {
  try {
    return await withTimeoutAndDb(async () => {
      const q = query(
        collection(db, 'adminActivity'),
        orderBy('createdAt', 'desc'),
        limit(count)
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map((activity) => ({ id: activity.id, ...activity.data() }))
    })
  } catch (err) {
    console.error('getRecentAdminActivity failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const getContactMessages = async () => {
  try {
    return await withTimeoutAndDb(async () => {
      const q = query(collection(db, 'contactMessages'), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    })
  } catch (err) {
    console.error('getContactMessages failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const getUnreadMessageCount = async () => {
  try {
    return withTimeoutAndDb(async () => {
      const q = query(collection(db, 'contactMessages'), where('status', '==', 'unread'))
      const snapshot = await getDocs(q)
      return snapshot.size
    })
  } catch (err) {
    console.error('getUnreadMessageCount failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateMessageStatus = async (id, status) => {
  try {
    await commitAuditedMutation({
      action: 'message_status_changed',
      collectionName: 'contactMessages',
      entityId: id,
      label: `Contact message marked ${status}`,
      mutate: (batch) => batch.update(doc(db, 'contactMessages', id), { status }),
    })
  } catch (err) {
    console.error('updateMessageStatus failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const updateMessageReplyStatus = async (id, replyStatus) => {
  try {
    await commitAuditedMutation({
      action: 'message_status_changed',
      collectionName: 'contactMessages',
      entityId: id,
      label: `Contact message marked ${replyStatus === 'replied' ? 'replied' : 'needs reply'}`,
      mutate: (batch) => batch.update(doc(db, 'contactMessages', id), {
        replyStatus,
        repliedAt: replyStatus === 'replied' ? serverTimestamp() : deleteField(),
      }),
    })
  } catch (err) {
    console.error('updateMessageReplyStatus failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const toggleMessageStar = async (id, isStarred) => {
  try {
    await commitAuditedMutation({
      action: 'message_status_changed',
      collectionName: 'contactMessages',
      entityId: id,
      label: `Contact message ${isStarred ? 'starred' : 'unstarred'}`,
      mutate: (batch) => batch.update(doc(db, 'contactMessages', id), { isStarred }),
    })
  } catch (err) {
    console.error('toggleMessageStar failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const toggleMessageArchive = async (id, isArchived) => {
  try {
    await commitAuditedMutation({
      action: 'message_status_changed',
      collectionName: 'contactMessages',
      entityId: id,
      label: `Contact message ${isArchived ? 'archived' : 'unarchived'}`,
      mutate: (batch) => batch.update(doc(db, 'contactMessages', id), { isArchived }),
    })
  } catch (err) {
    console.error('toggleMessageArchive failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const bulkUpdateMessages = async (ids, updates) => {
  try {
    if (ids.length === 0) return
    const shouldAuditStatus = typeof updates.status === 'string' ||
      typeof updates.replyStatus === 'string' ||
      typeof updates.isArchived === 'boolean' ||
      typeof updates.isStarred === 'boolean'
    const maximumUpdates = shouldAuditStatus ? 499 : 500
    if (ids.length > maximumUpdates) {
      throw new Error(`Cannot update more than ${maximumUpdates} messages at once.`)
    }
    if (shouldAuditStatus) {
      const messageUpdates = { ...updates }
      if (updates.replyStatus === 'replied') {
        messageUpdates.repliedAt = serverTimestamp()
      } else if (updates.replyStatus === 'needs_reply') {
        messageUpdates.repliedAt = deleteField()
      }
      const statusLabel = updates.replyStatus
        ? `marked ${updates.replyStatus === 'replied' ? 'replied' : 'needs reply'}`
        : typeof updates.status === 'string'
          ? `marked ${updates.status}`
          : typeof updates.isArchived === 'boolean'
            ? `${updates.isArchived ? 'archived' : 'unarchived'}`
            : `${updates.isStarred ? 'starred' : 'unstarred'}`
      await commitAuditedMutation({
        action: 'message_status_changed',
        collectionName: 'contactMessages',
        entityId: ids.length === 1 ? ids[0] : 'bulk',
        label: `${ids.length} contact message${ids.length === 1 ? '' : 's'} ${statusLabel}`,
        mutate: (batch) => ids.forEach((id) => batch.update(doc(db, 'contactMessages', id), messageUpdates)),
      })
      return
    }
    await withTimeoutAndDb(async () => {
      const batch = writeBatch(db)
      ids.forEach((id) => batch.update(doc(db, 'contactMessages', id), updates))
      await batch.commit()
    })
  } catch (err) {
    console.error('bulkUpdateMessages failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const deleteContactMessage = async (id) => {
  try {
    await commitAuditedMutation({
      action: 'message_status_changed',
      collectionName: 'contactMessages',
      entityId: id,
      label: 'Contact message deleted',
      mutate: (batch) => batch.delete(doc(db, 'contactMessages', id)),
    })
  } catch (err) {
    console.error('deleteContactMessage failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}

export const reorderItems = async (collectionName, orderPairs) => {
  try {
    await commitAuditedMutation({
      action: 'reordered',
      collectionName,
      entityId: 'multiple',
      label: `${orderPairs.length} ${collectionName} items`,
      mutate: (batch) => {
        // Reordering writes only the order field to stay within the collection's rules.
        orderPairs.forEach(({ id, order }) => {
          batch.update(doc(db, collectionName, id), { order })
        })
      },
    })
  } catch (err) {
    console.error('reorderItems failed:', err)
    throw new Error(getUserFriendlyFirebaseError(err))
  }
}
