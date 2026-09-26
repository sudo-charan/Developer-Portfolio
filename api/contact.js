import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { checkRateLimit, getRequestBodySize } from '../server/rateLimit.js'

const MAX_BODY_BYTES = 24 * 1024
const CONTACT_LIMIT = 5
const CONTACT_WINDOW_MS = 15 * 60 * 1000

function getAdminFirestore() {
  const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!credentialsJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not configured.')
  }

  const existingApp = getApps().find((app) => app.name === 'contact-api')
  const app =
    existingApp ||
    initializeApp(
      { credential: cert(JSON.parse(credentialsJson)) },
      'contact-api'
    )

  return getFirestore(app)
}

function isValidField(value, maxLength) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' })
  }

  if (getRequestBodySize(req.body) > MAX_BODY_BYTES) {
    return res.status(413).json({ error: 'The message is too large.' })
  }

  const { name, email, subject, message } = req.body || {}
  const normalized = {
    name: typeof name === 'string' ? name.trim() : '',
    email: typeof email === 'string' ? email.trim() : '',
    subject: typeof subject === 'string' ? subject.trim() : '',
    message: typeof message === 'string' ? message.trim() : '',
  }

  if (
    !isValidField(normalized.name, 100) ||
    !isValidField(normalized.email, 254) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) ||
    !isValidField(normalized.subject, 150) ||
    !isValidField(normalized.message, 5000)
  ) {
    return res.status(400).json({ error: 'Please check the message fields and try again.' })
  }

  const rateLimit = checkRateLimit(req, {
    bucket: 'contact',
    limit: CONTACT_LIMIT,
    windowMs: CONTACT_WINDOW_MS,
  })
  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds))
    return res.status(429).json({ error: 'Too many messages. Please wait and try again.' })
  }

  try {
    await getAdminFirestore().collection('contactMessages').add({
      ...normalized,
      createdAt: FieldValue.serverTimestamp(),
      status: 'unread',
      replyStatus: 'needs_reply',
    })
    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Contact message submission failed:', error)
    return res.status(500).json({ error: 'Unable to send your message right now.' })
  }
}
