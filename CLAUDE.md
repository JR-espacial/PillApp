# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server on port 3000 (0.0.0.0)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # TypeScript type checking (tsc --noEmit)
npm run clean     # Remove dist/
npm run deploy    # build + firebase deploy --only hosting
```

No test framework is configured.

## Environment

Copy `.env.example` to `.env.local` and fill in values from the Firebase console:
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_VAPID_KEY` — for FCM web push (optional, leave blank to skip)

Firebase project: `pillapp-3d6e17` (already set in `.firebaserc`).

## Architecture

### Data flow
All user data lives in Firestore under `users/{uid}/medications`, `users/{uid}/doses`, `users/{uid}/history`. Three hooks read live via `onSnapshot` and write through mutations:

- `src/hooks/useMedications.ts` — `addMed` uses a batch write: one document in `medications` + one dose document per entry in `med.times` (converted to display strings via `formatTime`). `deleteMed` removes only the medication; doses are not cascade-deleted.
- `src/hooks/useTodayDoses.ts` — queries doses filtered to today's ISO date. `markTaken` uses `setDoc` with `merge: true` (safe on non-existent docs) and appends a history entry.
- `src/hooks/useHistory.ts` — `orderBy('createdAt', 'desc'), limit(30)`.

### Auth
`src/context/AuthContext.tsx` wraps the app in `AuthProvider`. On first load it calls `signInAnonymously`. The `signInWithGoogle` function upgrades the anonymous account via `linkWithPopup` (preserving Firestore data), falling back to `signInWithPopup` if the credential is already in use. `main.tsx` wraps `<App>` in `<AuthProvider>`.

### UI
All screens (`HomeScreen`, `MedsScreen`, `HistoryScreen`, `AddMedScreen`) live in `src/App.tsx`. Navigation is a `currentScreen` state variable — no router library. Screen transitions use Framer Motion `AnimatePresence mode="wait"`.

### Key types (`src/types.ts`)
- `Medication.times: string[]` — `"HH:MM"` 24-hour strings, one per daily dose. This drives both dose creation and notification scheduling.
- `Dose.time: string` — display string (`"8:00 AM"`), converted from `HH:MM` via `formatTime` at write time.
- `HistoryItem.date: string` — ISO `"YYYY-MM-DD"`. Display labels (`Today`, `Yesterday`, etc.) are computed client-side in `HistoryScreen` via `getDateLabel()`.

### Notifications (`src/notifications.ts`)
- `formatTime(hhmm)` — shared converter used by both the hook and notification scheduler.
- `scheduleNotifications(name, times)` — sets a `setTimeout` per upcoming dose; fires a browser `Notification` when the time hits. Only works while the tab is open. Background push requires FCM + a Cloud Function (future work, needs Blaze plan).

### Firebase config (`src/firebase/config.ts`)
Uses `initializeFirestore` with `persistentLocalCache()` (Firebase 12 — `enableIndexedDbPersistence` was removed). `getFirebaseMessaging()` is async and checks `isSupported()` before returning.

### Firestore security rules
Single rule in `firestore.rules`: authenticated users can only read/write their own `users/{uid}/**` path. Deploy rules with `firebase deploy --only firestore`.

### PWA
`vite-plugin-pwa` in `vite.config.ts` generates `dist/sw.js` and `dist/manifest.webmanifest`. Icons expected at `public/icons/icon-192.png` and `public/icons/icon-512.png` (not yet created). `sw.js` must be served `no-cache` — configured in `firebase.json`.

### Styling
Tailwind CSS v4 with a custom Material Design 3 theme defined via `@theme` in `src/index.css`. All color tokens use MD3 naming (`primary`, `secondary`, `tertiary`, `surface-container`, etc.).
