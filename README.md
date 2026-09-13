# Charanraj M — Portfolio

Modern, dark-themed personal portfolio website built with React, Vite, Tailwind CSS, and Firebase.

## Features

- **Responsive design** — Mobile-first layout with Tailwind CSS
- **Dark theme** — Full dark mode with smooth transitions via Tailwind CSS 4
- **Animations** — Framer Motion for page transitions, skill badges, and interactive elements
- **Admin dashboard** — Full CRUD management for projects, skills, experience, education, certificates, blog posts, and contact messages
- **Firebase backend** — Real-time data with Firestore, authentication with Firebase Auth, and file storage with Firebase Storage
- **Blog** — Markdown-like content management with publish/unpublish workflow
- **Contact form** — User-submitted messages stored in Firestore with admin inbox
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
   - Contact message inbox with read/unread/starred/archived filtering
   - Settings management (hero, about, social links, resume URL)


## Firebase Security

Firestore and Storage rules are configured in:

- `firestore.rules` — Defines read/write access:
  - Public collections (projects, skills, experience, education, certificates, currentWork, blogPosts) are readable by everyone
  - Admin-only write access via `isAdmin()` custom claim check
  - `contactMessages` create is open to everyone with `status: 'unread'` enforced
  - `currentWork` has a single active item enforced via rules
- `storage.rules` — Admin-only file uploads, public reads

Deploy rules:
```bash
firebase deploy --only firestore:rules,storage:rules
# or
firebase deploy
```

## Analytics

Vercel Web Analytics is integrated at the application root (`src/main.jsx`) to track page views across client-side navigation. It is privacy-friendly — no cookies or personal data collection.

## Deployment

Firebase hosting and rules are configured via `firebase.json`, `.firebaserc`, `firestore.rules`, and `storage.rules`.

Build and deploy:
```bash
npm run build
firebase deploy
```

## License

Private project. All rights reserved.
