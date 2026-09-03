# Charanraj M — Portfolio

Modern, dark-themed personal portfolio website built with React, Vite, Tailwind CSS, and Firebase.

## Tech Stack

- React 19 + Vite 8
- Tailwind CSS 4
- Firebase Auth + Firestore + Storage
- Framer Motion
- React Router 7
- Lucide Icons


## Getting Started

1. Install dependencies:
   ```
   npm install
   ```
2. Create `.env` from `.env.example` and add Firebase credentials.
3. Start the dev server:
   ```
   npm run dev
   ```
4. Open `http://localhost:5173`

## Admin Setup

1. Create a Firebase user for admin access.
2. Run the admin claim script:
   ```
   node scripts/set-admin-claim.js <UID>
   ```
3. Visit `/admin/login` to access the dashboard.

## Available Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — build for production
- `npm run lint` — run Oxlint
- `npm run preview` — preview production build

## Deployment

Firebase hosting and rules are configured via `firebase.json`, `.firebaserc`, `firestore.rules`, and `storage.rules`.

Deploy rules and hosting:
```
firebase deploy
```

## License

Private project. All rights reserved.
