# ESTER ❤️ KYPHER

A private, shared digital diary for two people — built with React, TypeScript,
and Firebase (Auth, Firestore, Storage).

## What's included

- Email/password + Google sign-in, password reset, protected routes, persistent sessions
- Couple profile with a live "together for X years, Y months, Z days" counter
- Home dashboard: greeting, today's memories, on-this-day, recent activity, quick actions
- Daily memory creation (title, what you did, how your day went, a private note to your
  partner, mood, tags, location, multiple photos) — **plus editing and deleting your own
  memories**, including removing individual photos from an existing entry
- Shared chronological timeline, grouped by day, clearly attributed to whoever wrote it
- Reactions (❤️ 😍 🥹 😂 👍) and threaded comments on every memory
- Photo gallery grouped by month, fullscreen swipeable viewer, delete-your-own-uploads
- Interactive calendar with dots on days that have memories
- Special Memories page (mark any entry as ❤️ Special)
- On This Day (surfaces memories from the same date in past years)
- Our Story: a manually-curated milestone timeline
- Search across titles, entries, tags, dates and locations
- In-app notifications for new memories, comments, reactions, photos, and anniversary
  countdowns — the comment/reaction/gallery-photo/anniversary ones are sent by **Cloud
  Functions**, so they fire even if the other person isn't in the app
- Relationship statistics (memories, photos, special moments, days shared)
- Bottom nav on mobile, sidebar on desktop, floating "+" button
- **Light and dark mode**, toggle in the top bar (desktop) or Profile page (mobile) —
  every existing color class follows the toggle via CSS variables, so it required no
  per-component changes
- Image compression before upload, lazy-loaded photos, loading/empty states
- Dark, romantic, glassmorphism-adjacent visual style (see Design below)

## 1. Set up Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** → Email/Password and Google sign-in providers
3. Create a **Cloud Firestore** database (production mode)
4. Enable **Storage**
5. In Project Settings → General, add a Web App and copy the config values
6. Copy `.env.example` to `.env` and fill in the Firebase config, plus the
   two email addresses that make up this couple:

   ```
   VITE_PARTNER_1_EMAIL=ester@example.com
   VITE_PARTNER_2_EMAIL=kypher@example.com
   ```

## 2. Install and run

Firebase Storage requires the pay-as-you-go Blaze billing plan (this is a
platform-wide Google policy, not specific to this app). If you're not ready
to enable that yet, that's fine — leave `VITE_PHOTOS_ENABLED=false` in your
`.env` and the app runs fully without photos: memories, timeline, comments,
reactions, calendar, search, and milestones all work on the free tier alone.
Flip it to `true` once Storage is set up, and the photo UI reappears with no
other changes needed.

```bash
npm install
npm run dev
```

Have Ester and Kypher each sign up once (email/password or Google) with the
addresses set in `.env`. The app automatically creates their shared couple
space the moment both accounts exist. After that, set the relationship start
date, anniversary, and quote from the Profile page.

## 3. Deploy the security rules

```bash
npm install -g firebase-tools
firebase login
firebase init   # select Firestore, Storage, Functions, Hosting; point at the
                 # existing firestore.rules / storage.rules / functions folder
                 # in this repo rather than overwriting them
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

## 4. Deploy the Cloud Functions (comment/reaction/anniversary notifications)

The client already creates a notification when a new memory is added. Three
more notification types — new comment, new reaction, and gallery photo — plus
the anniversary reminder are sent server-side, because they need to fire even
when the recipient isn't currently in the app.

```bash
cd functions
npm install
npm run build
cd ..
firebase deploy --only functions
```

This deploys:
- `onCommentCreate` — notifies the other partner when a comment is added
- `onReactionWrite` — notifies the memory's author when a reaction is added or changed
- `onGalleryPhotoCreate` — notifies the other partner for photos uploaded directly to the gallery
- `checkAnniversaries` — a daily scheduled function that reminds both partners 30/14/7/3/1/0 days before the anniversary date

The app works fully without deploying functions — you'll just miss those four
background notifications until you do.

## 5. Deploy the app (optional)

```bash
npm run build
firebase deploy --only hosting
```

## Locking the app to exactly two people

Two layers work together:

- **Client-side (`AuthContext.tsx`)**: sign-up/sign-in is rejected for any
  email not listed in `VITE_PARTNER_1_EMAIL` / `VITE_PARTNER_2_EMAIL`. This
  is a UX guard, not a security boundary — anyone could bypass the client.
- **Firestore rules (`firestore.rules`)**: the real boundary. Every read and
  write on `memories`, `photos`, `comments`, `reactions`, `notifications`,
  and `milestones` checks that the requester is `partner1Id` or `partner2Id`
  on the matching `couples/{coupleId}` document. A stranger who signs up
  anyway can only ever create and see their *own* isolated couple space —
  they cannot read or write Ester & Kypher's documents, because they can
  never become a member of that couple's document.

**Known limitation to be aware of:** Firebase Storage's `getDownloadURL()`
returns a URL containing an access token that bypasses Storage security
rules for anyone who has the link — this is a Firebase platform behavior,
not something rules can close. Treat those URLs as "unlisted," not
public-proof: don't post them outside the app. If you want photos to be
strictly inaccessible without a live, rules-checked session, the more
robust approach is a Cloud Function that streams image bytes through an
authenticated HTTPS endpoint instead of using public download URLs — that's
a good next step if this app's contents ever need to withstand a shared
or leaked link.

## Design

Dark ink/navy background, warm paper-white text, a soft rose accent for
"you" and a plum accent for "your partner," with a serif display face
(Fraunces) for headings and Inter for everything else — meant to feel like
a shared handwritten journal rather than a generic SaaS dashboard. Adjust
the palette in `tailwind.config.js`.

## Project structure

```
src/
  firebase/       Firebase app init, Firestore queries, Storage upload/compress
  contexts/       AuthContext (session/profile/couple), ThemeContext (light/dark)
  hooks/          usePartnerProfile, useRelationshipStats, usePhotosForMemory
  components/     Navigation, MemoryCard, PhotoGrid, ReactionBar, CommentThread,
                  ThemeToggle, NotificationBell, ...
  pages/          Login, Dashboard, Timeline, AddMemory (create + edit + delete),
                  Gallery, CalendarPage, OurStory, SpecialMemories, Search, Profile
  types/          Shared TypeScript types matching the Firestore schema
functions/        Cloud Functions: comment/reaction/photo notifications, anniversary reminders
firestore.rules   Firestore security rules
firestore.indexes.json  Composite indexes the queries above rely on
storage.rules     Storage security rules
firebase.json     Ties rules, indexes, hosting, and functions together for `firebase deploy`
```

## What to build next

- Push notifications: the `notifications` collection and Cloud Functions that
  populate it are ready — wiring in FCM device tokens would turn these into
  real push notifications when the app is closed
- Light mode currently mirrors the dark palette's contrast relationships;
  feel free to hand-tune `html.light` in `src/index.css` further to taste
