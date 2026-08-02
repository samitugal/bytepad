# Cloud Sync (Bring Your Own Firebase)

Downloaded bytepad builds ship with Firebase unconfigured, on purpose. There is no shared bytepad backend — running one for every downloader would mean taking on hosting, quota, and data-stewardship for other people's data, which isn't part of the v1 plan. Instead, cloud sync and Google sign-in are available to anyone willing to connect their own Firebase project.

If you just want sync working without any setup, use **[Gist Sync](./sync.md)** — it works out of the box with nothing but a GitHub token.

Cloud sync is the alternative for people who want Google sign-in and real-time Firestore sync backed by infrastructure they control.

## Setup

1. **Configure environment variables.** Copy [`.env.example`](../../.env.example) (repo root) to `.env` and fill in the `VITE_FIREBASE_*` values. That file's "Firebase Setup Steps" comment walks through creating the Firebase project, enabling Google sign-in, and enabling Firestore — follow it in order.
2. **Deploy the Firestore rules.** Still following `.env.example`'s steps, deploy [`firestore.rules`](../../firestore.rules) (repo root) to your project before storing any real data. The rules restrict every document to the signed-in user's own `uid`.
3. **(Optional) Pin the Firebase CLI project.** Copy [`.firebaserc.example`](../../.firebaserc.example) to `.firebaserc` and set your project id, so `firebase deploy` doesn't need a `--project` flag every time. `.firebaserc` is gitignored — it stays local to you.
4. **Restart bytepad.** Environment variables are read at build/start time, so restart `npm run dev` (or rebuild the app) after saving `.env`.

Once these values are present, `isConfigured()` in `src/services/firebase.ts` flips to `true`: the "cloud sync is disabled" note in Settings disappears, and both Google sign-in and Firestore sync become available.

## What you get

- Google sign-in
- Firestore-backed sync across devices, in addition to (not instead of) Gist Sync

## Data ownership

The Firebase project is yours — created under your own Google account, billed to you (Firebase's free tier covers typical personal use), and accessible only with your credentials. bytepad never sees your Firebase keys or your data; they stay in your `.env` and your Firestore instance.

## See also

- [`.env.example`](../../.env.example) — the full list of `VITE_FIREBASE_*` variables and setup steps
- [`.firebaserc.example`](../../.firebaserc.example) — Firebase CLI project template
- [Gist Sync](./sync.md) — the sync path that works without any setup
- [Configuration](../getting-started/configuration.md) — general settings reference
