import { initializeApp } from 'firebase-admin/app'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions'
import { onSchedule } from 'firebase-functions/v2/scheduler'

initializeApp()

const db = getFirestore()
const MAX_POSTS_PER_RUN = 250

export const publishScheduledBlogPosts = onSchedule('every 1 minutes', async () => {
  const now = Timestamp.now()
  const duePosts = await db.collection('blogPosts')
    .where('status', '==', 'scheduled')
    .where('scheduledAt', '<=', now)
    .orderBy('scheduledAt', 'asc')
    .limit(MAX_POSTS_PER_RUN)
    .get()

  let publishedCount = 0
  for (let start = 0; start < duePosts.docs.length; start += 25) {
    const batch = duePosts.docs.slice(start, start + 25)
    const results = await Promise.all(batch.map((post) =>
      db.runTransaction(async (transaction) => {
        const current = await transaction.get(post.ref)
        if (!current.exists) return false

        const data = current.data()
        if (data.status !== 'scheduled' ||
          !(data.scheduledAt instanceof Timestamp) ||
          data.scheduledAt.toMillis() > now.toMillis()) {
          return false
        }

        const activityRef = db.collection('adminActivity').doc()
        transaction.update(post.ref, {
          status: 'published',
          publishedAt: data.scheduledAt,
          scheduledAt: FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        transaction.create(activityRef, {
          action: 'published',
          collection: 'blogPosts',
          entityId: post.id,
          label: String(data.title || post.id).slice(0, 120),
          actor: 'Firebase Scheduler',
          createdAt: FieldValue.serverTimestamp(),
        })
        return true
      })
    ))
    publishedCount += results.filter(Boolean).length
  }

  if (publishedCount > 0) {
    logger.info('Published scheduled blog posts.', { count: publishedCount })
  }
})
