# Charanraj M — Portfolio

Modern, dark-themed personal portfolio website built with React, Vite, Tailwind CSS, and Firebase.

## Features

- **Responsive design** — Mobile-first layout with Tailwind CSS
- **Dark theme** — Full dark mode with smooth transitions via Tailwind CSS 4
- **"Ask Charan AI" Assistant** — Interactive cyberpunk floating drawer AI agent for recruiters and tech leads powered by a Vercel Serverless Function (`/api/ask-charan`) using server-only `GEMINI_API_KEY` / `OPENAI_API_KEY` with Firestore as source of truth and client fallback
- **Admin dashboard** — Full CRUD management for projects, skills, experience, education, certificates, blog posts, and contact messages, with an admin-only recent activity history
- **Firebase backend** — Real-time data with Firestore, authentication with Firebase Auth, and file storage with Firebase Storage
- **Blog** — Markdown content management with draft preview, publish/unpublish, and scheduled publishing
- **Contact form** — User-submitted messages stored in Firestore with an admin inbox, search, filtered CSV export, and separate read/reply tracking
- **Analytics** — Vercel Web Analytics for privacy-friendly pageview tracking
- **Performance** — Code splitting, lazy loading, and optimized assets

## Tech Stack

- **React 19** + **Vite 8** — Build tooling
- **Tailwind CSS 4** — Styling with custom dark theme variables
- **Firebase** — Auth, Firestore, Storage (modular SDK)
- **Framer Motion 13** — Animations and gesture-based drag interactions
- **React Router 7** — Client-side routing
- **Lucide React** — Icon library
- **Vercel Analytics** — Privacy-friendly analytics
- **Oxlint** — Linting

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- A Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd charanraj-portfolio
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your Firebase credentials to `.env`:
   ```
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abc123
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Open `http://localhost:5173`

## Admin Setup

1. Create a Firebase user for admin access.
2. Set the `admin` custom claim on the user:
   ```bash
   node scripts/set-admin-claim.js <UID>
   ```
3. Visit `/admin/login` to access the dashboard.
4. The admin dashboard supports:
   - Full CRUD for projects, skills, experience, education, certificates, blog posts
   - Drag-and-drop reordering (via Framer Motion) for all sortable collections
   - Contact message inbox with search, read/unread/starred/archived and needs-reply/replied filters, bulk follow-up actions, and CSV export of the current filtered results
   - Settings management (hero, about, social links, resume URL)

## Scheduled blog publishing

The admin blog editor can preview posts and schedule publication in the admin's local timezone. Scheduled times are stored in Firestore as UTC timestamps; a Firebase scheduled function checks for due posts every minute, publishes them, and records the publication in the admin activity history. Scheduled posts remain private until published.

The scheduled function requires Firebase Functions and Cloud Scheduler, which require the Blaze billing plan. Install the Functions dependencies and deploy its code, the updated Firestore rules, and the scheduled-post index:

```bash
npm --prefix functions ci
firebase deploy --only functions,firestore:rules,firestore:indexes
```

To cancel a scheduled post, change its status to Draft in the admin blog editor. The public blog and sitemap include only posts whose status is `published`.

### Contact submissions and serverless API

The public contact form writes through the Firebase client SDK and does not require a Firebase service-account secret or Vercel environment variable. Firestore rules allow unauthenticated creates only for validated contact-message fields; public reads, updates, and deletes remain denied. Deploy the Firestore rules before using the form.

The AI assistant uses the serverless `/api/ask-charan` route. Configure its server-only API keys in Vercel. That endpoint limits request size and conversation history and applies a best-effort in-memory limit of 12 requests per IP per 10 minutes; in-memory limits can reset across serverless instances or cold starts.

## Firebase Security

Firestore and Storage rules are configured in:

- `firestore.rules` — Defines read/write access:
  - Public collections (projects, skills, experience, education, certificates, currentWork, blogPosts) are readable by everyone
  - Admin-only write access via `isAdmin()` custom claim check
  - `adminActivity` is readable by admins and append-only; content mutations and their activity entries are committed together
  - `contactMessages` allows only tightly validated public submissions; reading and managing messages remain admin-only
  - `currentWork` has a single active item enforced via rules
- `storage.rules` — Admin-only file uploads, public reads

Deploy rules and indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
# or
firebase deploy
```

## Analytics

Vercel Web Analytics is integrated at the application root (`src/main.jsx`) to track page views across client-side navigation. It is privacy-friendly — no cookies or personal data collection.

## Search metadata

The home, blog, and published blog-post routes update their page title, description, canonical URL, social metadata, and structured data in the browser. `/robots.txt` excludes the admin area and points crawlers to `/api/sitemap`, which lists the home page, blog index, and published Firestore posts. The sitemap endpoint uses `VITE_FIREBASE_PROJECT_ID` or `FIREBASE_PROJECT_ID`, and adds `VITE_FIREBASE_API_KEY` to Firestore REST requests when configured; these are the same Firebase client settings used by the frontend.

If the production domain changes, update the site URL in `index.html`, `src/hooks/usePageMetadata.js`, `api/sitemap.js`, and `public/robots.txt`. Route metadata is client-rendered; reliable social previews and indexing by crawlers that do not execute JavaScript still require prerendering or server-side rendering.

## Deployment

Firebase hosting and rules are configured via `firebase.json`, `.firebaserc`, `firestore.rules`, and `storage.rules`.

Build and deploy:
```bash
npm run build
firebase deploy
```

## License

Private project. All rights reserved.
