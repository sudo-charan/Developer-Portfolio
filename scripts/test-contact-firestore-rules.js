import assert from 'node:assert/strict'
import { deleteApp, initializeApp } from '@firebase/app'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  getDoc,
  getFirestore,
  serverTimestamp,
  terminate,
} from '@firebase/firestore'

const app = initializeApp({ projectId: 'demo-contact-rules', apiKey: 'demo' })
const db = getFirestore(app)
connectFirestoreEmulator(db, '127.0.0.1', 8080)

const contactMessages = collection(db, 'contactMessages')
const validMessage = {
  name: 'Test Visitor',
  email: 'visitor@example.com',
  subject: 'Rules test',
  message: 'Testing contact submission rules.',
  createdAt: serverTimestamp(),
  status: 'unread',
  replyStatus: 'needs_reply',
}

const accepted = await addDoc(contactMessages, validMessage)

await assert.rejects(
  addDoc(contactMessages, { ...validMessage, status: 'read' }),
  (error) => error.code === 'permission-denied',
)
await assert.rejects(
  addDoc(contactMessages, { ...validMessage, email: 'not-an-email' }),
  (error) => error.code === 'permission-denied',
)
await assert.rejects(
  addDoc(contactMessages, { ...validMessage, extraField: true }),
  (error) => error.code === 'permission-denied',
)
await assert.rejects(
  getDoc(accepted),
  (error) => error.code === 'permission-denied',
)

console.log('Contact Firestore rules allow valid submissions and reject invalid writes and public reads.')
await terminate(db)
await deleteApp(app)
