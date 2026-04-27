# Better Birder — Product Spec v1.0

## 1. Product Overview

**What it is:** A web app that helps birdwatchers retain and deepen their identification skills through a personalized, Duolingo-style learning system built around their own life list.

**Core insight:** Merlin (Cornell Lab) is the gold standard for bird ID in the field. Better Birder is what you use *after* Merlin — to actually internalize what you saw. It does not compete on identification accuracy. It competes on learning, retention, and engagement.

**Positioning:** "You've seen 200 birds. Can you identify half of them by sight and sound? Better Birder helps you actually learn the birds you've found."

**Target user:** Intermediate birdwatcher, 50-500 birds on their life list, uses Merlin regularly, frustrated that they keep forgetting birds they've already seen.

---

## 2. Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (Postgres + Auth)
- **AI layer:** Anthropic Claude API (`claude-sonnet-4-20250514`) for dynamic quiz generation and bird fact summaries
- **Bird data:** eBird API (taxonomy, range, observation data) + Macaulay Library (Cornell) for photos and audio
- **Audio playback:** Howler.js
- **Deployment:** Vercel
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **PWA:** `next-pwa` (Workbox-based service worker) + Web App Manifest

---

## 3. Data Models

```typescript
// User profile
type User = {
  id: string;
  email: string;
  display_name: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string; // ISO date
  created_at: string;
}

// A bird on the user's life list
type LifeListEntry = {
  id: string;
  user_id: string;
  species_code: string;        // eBird species code e.g. "blujay"
  common_name: string;         // "Blue Jay"
  scientific_name: string;     // "Cyanocitta cristata"
  date_first_seen: string;     // ISO date
  location: string;            // Free text e.g. "Mount Auburn Cemetery, MA"
  notes: string;               // User notes
  photo_url?: string;          // Optional user-uploaded photo
  mastery_score: number;       // 0-100, calculated from quiz performance
  added_at: string;
}

// A quiz session
type QuizSession = {
  id: string;
  user_id: string;
  started_at: string;
  completed_at?: string;
  score: number;               // correct / total
  xp_earned: number;
  questions: QuizQuestion[];
}

// An individual quiz question
type QuizQuestion = {
  id: string;
  session_id: string;
  question_type: QuizQuestionType;
  species_code: string;        // The bird being tested
  prompt: string;              // AI-generated question text
  answer_options: string[];    // 4 options (common names)
  correct_answer: string;
  user_answer?: string;
  is_correct?: boolean;
  time_spent_ms?: number;
  media_url?: string;          // Audio or image URL used in question
}

type QuizQuestionType =
  | "identify_by_image"        // Show photo, pick species
  | "identify_by_sound"        // Play call/song, pick species
  | "match_description"        // AI-written description, pick species
  | "odd_one_out"              // 3 birds from same family + 1 intruder, pick intruder
  | "range_question"           // "Which of these birds winters in New England?"
  | "fact_check"               // "True or false: The [bird] is a cavity nester"

// Mastery tracking per species
type SpeciesMastery = {
  user_id: string;
  species_code: string;
  times_seen_in_quiz: number;
  times_correct: number;
  last_seen_in_quiz: string;
  mastery_score: number;       // 0-100
  next_review_date: string;    // Spaced repetition scheduling
}
```

---

## 4. Feature Specs

### 4.1 Onboarding Flow

**Goal:** Get a user to their first quiz in under 3 minutes.

**Steps:**
1. **Sign up** — email/password or Google OAuth
2. **Life list seeding** — user is presented with two options:
   - "Import from eBird" — paste eBird profile URL, system fetches their life list via eBird API
   - "Start from scratch" — search and add birds manually
3. **Quick-start minimum** — user must add at least 10 birds before unlocking quizzes. If they import from eBird, skip this gate entirely.
4. **First quiz prompt** — immediately after seeding, prompt: "Ready for your first quiz? We'll test you on 5 birds from your list." CTA: "Start Learning →"

**Design note:** Onboarding should feel fast and rewarding. Show a progress bar. Celebrate when the life list is seeded ("You've seen 47 birds! Let's see how many you can identify.").

---

### 4.2 Life List

**View:** Card grid of all birds on the user's life list. Each card shows:
- Bird photo (from Macaulay Library)
- Common name + scientific name
- Date and location first seen
- Mastery score badge (color-coded: red 0-40, amber 40-70, green 70-100)
- Play button for primary song/call

**Interactions:**
- Tap card → Bird detail page
- "Add Bird" button → search by common name or species code, pulls data from eBird API
- Filter/sort: by mastery score (lowest first is default), by date added, by taxonomic order, by family

**Bird detail page shows:**
- Hero photo (Macaulay Library, best available)
- Photo gallery (swipeable, 3-5 images showing male/female/juvenile/seasonal variation)
- Primary song + alternate calls (playable inline)
- AI-generated "field notes" paragraph: 2-3 sentences on the most useful identification cues for this specific bird (generated by Claude, cached after first generation)
- Mastery score + quiz history for this species
- "Quiz me on this bird" button → launches a targeted 5-question mini-quiz

**eBird API integration:**
- Fetch species data: `GET /v2/ref/taxonomy/ebird?species={code}`
- Fetch observation data for import: `GET /v2/product/lists/{username}`

---

### 4.3 Daily Quiz (Core Loop)

**Structure:** 10 questions per daily quiz, drawn from the user's life list. Session takes ~5-7 minutes.

**Question selection algorithm:**
1. **Priority 1 — Due for review:** Species where `next_review_date <= today` (spaced repetition)
2. **Priority 2 — Low mastery:** Species with `mastery_score < 40`, not recently shown
3. **Priority 3 — Random from list:** Any species, weighted toward ones not seen recently
4. **Constraint:** No species appears more than once per quiz session
5. **Constraint:** Mix question types — no more than 3 of the same type per session

**Question generation:**
- `identify_by_image` and `identify_by_sound`: Pull from Macaulay Library API. Distractor options selected from taxonomically similar species (same family or order) for appropriate difficulty.
- `match_description`, `odd_one_out`, `fact_check`, `range_question`: Generated dynamically by Claude API at session start. Prompt Claude with the target species + 3 distractor species + user's location/region. Cache generated questions in Supabase for reuse.

**Claude prompt template for question generation:**
```
You are a birding quiz generator. Generate {n} quiz questions for an intermediate birdwatcher.

Target species: {common_name} ({scientific_name})
Distractor species: {distractor_1}, {distractor_2}, {distractor_3}
User's region: {region}
Question type requested: {question_type}

Rules:
- Questions should test genuine field identification skills, not trivia
- Focus on features a birder would actually observe: plumage, behavior, habitat, song, range
- Distractors should be plausible (similar-looking or related species)
- Difficulty: intermediate (user has seen this bird but may not know it well)

Return JSON only:
{
  "prompt": "question text",
  "answer_options": ["correct answer", "wrong 1", "wrong 2", "wrong 3"],
  "correct_answer": "correct answer",
  "explanation": "1-2 sentence explanation shown after answering"
}
```

**Quiz UI flow:**
1. Question card animates in
2. For sound questions: audio autoplays, replay button visible
3. For image questions: photo fills top half of card
4. 4 answer buttons below
5. On tap: immediate feedback — correct (green flash + points animation) or incorrect (red flash + correct answer revealed)
6. "Explanation" text fades in below (1-2 sentences from Claude)
7. "Next →" button to advance
8. After question 10: Results screen

**Results screen shows:**
- Score (e.g. "8/10")
- XP earned
- Streak status (maintained or broken)
- 2-3 "Birds to review" — lowest-scoring from this session with quick-study tips
- CTA: "Review missed birds" or "Done for today"

---

### 4.4 Streak & Gamification System

**Streak mechanics:**
- Streak increments by 1 each day the user completes at least one full 10-question quiz
- Streak resets to 0 if a day is missed (no grace period in v1)
- Streak displayed prominently in nav bar with flame icon

**XP system:**
- +10 XP per correct answer
- +20 XP bonus for completing a full session
- +50 XP for achieving a new personal best score
- +100 XP for reaching a streak milestone (7, 30, 100 days)

**Mastery score updates after each quiz:**
- Correct answer: `mastery_score = min(100, mastery_score + 8)`
- Incorrect answer: `mastery_score = max(0, mastery_score - 5)`
- `next_review_date` uses simple spaced repetition:
  - mastery 0-40: review tomorrow
  - mastery 40-70: review in 3 days
  - mastery 70-100: review in 7 days

**Achievement badges (v1 — keep it simple):**
- "First Flight" — complete first quiz
- "Flock of 50" — 50 birds on life list
- "7-Day Streak" — 7 consecutive days
- "Sharp-Shinned" — score 10/10 on a quiz
- "Century Club" — 100 birds on life list

Badges displayed on profile page. No push to share in v1.

---

### 4.5 Progress Dashboard

**URL:** `/dashboard`

**Sections:**
1. **Streak card** — current streak, longest streak, last 7 days activity heatmap (green/gray squares)
2. **Mastery overview** — donut chart: % of life list at each mastery tier (red/amber/green)
3. **Recently struggled** — 5 birds with lowest mastery scores, each with "Quick quiz" button
4. **Recently mastered** — 5 birds that crossed 70 mastery in the last 7 days
5. **Quiz history** — last 10 sessions, score + date

---

### 4.6 Freemium Gates (for future monetization — stub in v1)

**Free tier:**
- Life list up to 50 birds
- 1 quiz per day
- Basic mastery tracking

**Better Birder Pro ($7.99/month):**
- Unlimited life list
- Unlimited daily quizzes
- Sound ID question type (most engaging, gate behind paywall)
- Detailed quiz analytics
- eBird auto-sync (daily refresh of life list from eBird account)

**Implementation note:** In v1 (class project), make all features available to all users. Add the paywall UI stubs as commented-out code for future activation.

---

## 5. Progressive Web App (PWA) Configuration

Better Birder is built as a PWA so users can install it to their home screen and use it like a native app — no App Store required. This is critical for a birding app since users need it accessible quickly in the field.

### 5.1 Setup

Install and configure `next-pwa`:

```bash
npm install next-pwa
```

```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Cache bird photos and audio from Macaulay Library
      urlPattern: /^https:\/\/cdn\.download\.ams\.cornell\.edu\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'macaulay-media',
        expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      // Cache eBird taxonomy (rarely changes)
      urlPattern: /^https:\/\/api\.ebird\.org\/v2\/ref\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'ebird-taxonomy',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      // Cache all other API responses briefly
      urlPattern: /^https:\/\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
      },
    },
  ],
})

module.exports = withPWA({ reactStrictMode: true })
```

### 5.2 Web App Manifest

```json
// public/manifest.json
{
  "name": "Better Birder",
  "short_name": "Better Birder",
  "description": "Learn the birds you've found. Duolingo-style quizzes from your life list.",
  "start_url": "/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FAFAF8",
  "theme_color": "#2D6A4F",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/quiz.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshots/lifelist.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" }
  ]
}
```

Add to `app/layout.tsx`:
```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#2D6A4F" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Better Birder" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

### 5.3 Install Prompt

Show a native-feeling "Add to Home Screen" banner on mobile when the browser fires the `beforeinstallprompt` event:

```tsx
// components/InstallPrompt.tsx
'use client'
import { useEffect, useState } from 'react'

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!prompt) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-forest-green text-white rounded-xl p-4 flex items-center justify-between shadow-lg z-50">
      <div>
        <p className="font-medium text-sm">Add to Home Screen</p>
        <p className="text-xs opacity-80">Use Better Birder like a native app</p>
      </div>
      <button
        onClick={() => { prompt.prompt(); setPrompt(null) }}
        className="bg-white text-forest-green text-sm font-medium px-4 py-2 rounded-lg"
      >
        Install
      </button>
    </div>
  )
}
```

Show this component in the root layout, below the main content.

### 5.4 Push Notifications (Streak Reminders)

Use the Web Push API to send streak reminder notifications. This works on Android and, as of iOS 16.4+, on iPhone when the app is installed to the home screen.

```typescript
// lib/push.ts

// Request permission + store subscription in Supabase
export async function subscribeToPush(userId: string) {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  })
  // Save subscription to Supabase push_subscriptions table
  await supabase.from('push_subscriptions').upsert({
    user_id: userId,
    subscription: JSON.stringify(sub),
  })
}
```

```typescript
// app/api/push/send/route.ts (server-side cron or Supabase Edge Function)
// Trigger daily at 7pm local time for users with active streaks
// who haven't completed today's quiz yet.
// Use web-push npm package with VAPID keys.

import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:hello@betterbirder.app',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

// Payload sent to device:
const payload = JSON.stringify({
  title: '🔥 Keep your streak alive',
  body: "Your daily quiz is waiting. Don't let your streak break!",
  icon: '/icons/icon-192.png',
  badge: '/icons/badge-72.png',
  data: { url: '/quiz' }
})
```

**VAPID key generation:**
```bash
npx web-push generate-vapid-keys
```
Store public key in `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and private key in `VAPID_PRIVATE_KEY` in `.env.local`.

**Notification timing logic (Supabase Edge Function or Vercel Cron):**
- Run daily at 7:00 PM UTC
- Query users where `last_activity_date < today` AND `current_streak > 0`
- Send push to each user's stored subscription
- Skip users who have already completed today's quiz

### 5.5 Offline Behavior

The service worker (via `next-pwa`) handles offline gracefully:

- **Life list:** Cached after first load. Users can browse their birds offline.
- **Quiz:** Requires network for Claude-generated questions and fresh Macaulay media. Show a friendly banner: "You're offline — connect to start today's quiz." Pre-cache the last 3 quiz sessions so recently-generated questions are available.
- **Dashboard:** Served from cache. Shows last-known data with a "Last updated X mins ago" indicator.
- **Offline fallback page:** Create `public/offline.html` — a simple page saying "You're offline. Connect to continue your streak."

---

## 6. Navigation & Page Structure

```
/                        → Landing page (logged out) or redirect to /dashboard
/auth/signin             → Sign in
/auth/signup             → Sign up + onboarding flow
/dashboard               → Progress dashboard (authenticated)
/life-list               → Full life list grid view
/life-list/[speciesCode] → Bird detail page
/quiz                    → Launch daily quiz
/quiz/[sessionId]        → Active quiz session
/quiz/[sessionId]/results → Quiz results
/profile                 → User profile + badges + settings
```

---

## 6. UI Design Principles

- **Mobile-first.** Most birding happens on phones. Design for 390px width, enhance for desktop.
- **Fast and fluid.** Quiz interactions must feel snappy. Use optimistic UI — don't wait for API response to show correct/incorrect feedback.
- **Nature-inspired but not kitschy.** Soft greens and warm neutrals. No cartoon birds. Photography-first.
- **Celebrate progress.** Streaks, XP gains, and mastery improvements should feel rewarding without being annoying. Take cues from Duolingo's micro-animations — subtle, purposeful.
- **Accessibility.** All audio content has visual alternatives. Color-coded mastery levels always have text labels too (don't rely on color alone).

**Color palette:**
- Primary: `#2D6A4F` (deep forest green)
- Secondary: `#74C69D` (soft sage)
- Accent: `#F4A261` (warm amber — for streaks/XP)
- Background: `#FAFAF8` (warm white)
- Text: `#1B1B1B`
- Danger/incorrect: `#E63946`
- Success/correct: `#2D6A4F`

---

## 7. External API Reference

**eBird API (free, requires key from Cornell):**
- Base URL: `https://api.ebird.org/v2`
- Auth: `X-eBirdApiToken` header
- Key endpoints:
  - `GET /ref/taxonomy/ebird` — full species taxonomy
  - `GET /product/lists/{username}` — user's life list (requires eBird username, not OAuth)

**Macaulay Library (Cornell — no API key required for basic embed):**
- Photo search: `https://search.macaulaylibrary.org/api/v1/search?taxonCode={code}&mediaType=photo&count=5`
- Audio search: `https://search.macaulaylibrary.org/api/v1/search?taxonCode={code}&mediaType=audio&count=3`
- Returns array of media assets with direct URLs

**Anthropic Claude API:**
- Used for: quiz question generation, bird field notes, explanation text
- Model: `claude-sonnet-4-20250514`
- All Claude calls should be made server-side (Next.js API routes) — never expose API key client-side
- Cache generated questions in Supabase to minimize API costs

---

## 8. Build Sequence (Suggested for 12-Hour Sprint)

**Hours 1-2:** Project setup, auth, Supabase schema, basic routing, PWA manifest + `next-pwa` config

**Hours 3-4:** Life list — add birds manually, display grid, bird detail page with Macaulay Library photos/audio

**Hours 5-7:** Quiz engine — question selection algorithm, UI flow, answer feedback, results screen

**Hours 8-9:** Claude integration — AI question generation for description/fact-check types, field notes on bird detail page

**Hours 10-11:** Streak system, mastery scores, dashboard

**Hour 12:** eBird import, install prompt UI, deploy to Vercel — then install to your phone and demo natively

**Cut if short on time (in priority order):**
1. Push notifications (nice to have, not essential for demo)
2. eBird import (manual entry is fine for demo)
3. Sound-based question type (image + description questions are sufficient)
4. Achievement badges
5. Dashboard analytics charts

---

## 9. Demo Script (for class presentation)

1. Open app, show life list of ~30 birds with mastery scores visible
2. Tap a bird (e.g. Black-capped Chickadee) — show detail page, play song, show AI field notes
3. Launch daily quiz — walk through 3-4 questions showing different types
4. Show correct/incorrect feedback + explanation
5. Complete quiz, show results screen + streak update
6. Show dashboard — mastery donut chart, streak heatmap
7. Close with the business case slide: "45M US birdwatchers, Merlin has 10M+ downloads, we are the learning layer they're missing"
