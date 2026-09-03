/**
 * Local-only script: set the Firebase custom claim `admin: true` for a user.
 *
 * Setup:
 *   1. Install the Admin SDK locally:
 *      npm install firebase-admin --save-dev
 *
 *   2. Download your Firebase service account JSON from:
 *      Firebase Console -> Project Settings -> Service Accounts -> Generate new private key
 *
 *   3. Save it as:
 *      scripts/service-account.json
 *
 *   4. Run the script with the target user UID:
 *      node scripts/set-admin-claim.js <UID>
 *
 * After running:
 *   - The user must sign out and sign in again to refresh their ID token.
 *   - You can verify access by visiting /admin in the app.
 *
 * Security notes:
 *   - scripts/service-account.json is gitignored.
 *   - Do not commit this file or deploy it with the frontend.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const serviceAccountPath = join(__dirname, 'service-account.json')

let serviceAccount
try {
  const raw = readFileSync(serviceAccountPath, 'utf-8')
  serviceAccount = JSON.parse(raw)
  } catch (error) {
    console.error('Missing or invalid service account file at:', serviceAccountPath)
    console.error('Download it from Firebase Console -> Project Settings -> Service Accounts')
    console.error('Details:', error)
    process.exit(1)
  }

if (!serviceAccount.project_id) {
  console.error('Invalid service account JSON. Ensure it includes project_id.')
  process.exit(1)
}

const app = initializeApp({
  credential: cert(serviceAccount),
})

const auth = getAuth(app)

const uid = process.argv[2]

if (!uid) {
  console.error('Usage: node scripts/set-admin-claim.js <UID>')
  process.exit(1)
}

async function setAdminClaim() {
  try {
    await auth.setCustomUserClaims(uid, { admin: true })
    console.log(`Success: set admin: true for UID ${uid}`)
    console.log('Next steps:')
    console.log('  1. Ask the user to sign out and sign in again.')
    console.log('  2. This refreshes the Firebase ID token on the client.')
    console.log('  3. Then visit /admin to verify access.')

    const userRecord = await auth.getUser(uid)
    console.log('Verification - custom claims:', userRecord.customClaims)
  } catch (error) {
    console.error('Failed to set custom claim:', error)
    process.exit(1)
  } finally {
    await app.delete().catch(() => {})
  }
}

await setAdminClaim()
