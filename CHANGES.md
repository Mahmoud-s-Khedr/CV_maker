# HandisCV — Changes Summary & Deployment Guide

This document covers all changes made during four improvement sprints (February 2026).

- **Sprint 1**: Security, Input Validation & Rate Limiting, Mobile Responsiveness, and UX/Polish.
- **Sprint 2**: Premium Feature Gating, Template System, Sharing Analytics, Version History, and Export Options.
- **Sprint 3**: Collaborative Review, Profile Completeness Score, Job Board, Email Notifications, Two-Factor Authentication.
- **Sprint 4**: LinkedIn Browser Extension (profile import + job tracker), `GET /api/auth/me`, `POST /api/import/linkedin-extension`.

---

## 1. Security Fixes

### Problem
All resume, AI, and import routes were completely unauthenticated. Any anonymous caller could read, modify, or delete any user's resume. Controllers also accepted `userId` from the request body instead of deriving it from the verified JWT.

### Changes Made

**`server/src/middleware/auth.middleware.ts`**
- Exported the `AuthRequest` interface so controllers can use it with proper typing.

**`server/src/controllers/resume.controller.ts`**
- `userId` is now always derived from `req.user.userId` (the verified JWT payload) — never from the request body.
- Added ownership checks to `getResume`, `updateResume`, and `deleteResume`: fetches the resume first, compares `resume.userId` to the authenticated user's ID, returns `403 Forbidden` on mismatch.
- Replaced `console.error()` calls with the structured `logError()` logger.

**`server/src/routes/resume.routes.ts`**
- Added `router.use(authenticate)` so every resume endpoint requires a valid JWT.
- Renamed `GET /user/:userId` → `GET /user/me` (user identity from token, not URL).

**`server/src/routes/ai.routes.ts`**
- Added `authenticate` middleware to both `/analyze` and `/job-fit` endpoints.

**`server/src/routes/import.routes.ts`**
- Added `authenticate` middleware to both `/linkedin` and `/github` endpoints.

**`client/src/lib/api.ts`**
- Removed `userId` parameter from `saveResume()`.
- Changed `getUserResumes()` to call `GET /resumes/user/me` (no userId in path).
- Added `forgotPassword()` and `resetPassword()` functions.

**`client/src/store/resume.ts`**
- Removed `localStorage` userId extraction from `saveToBackend()`.

**`client/src/pages/DashboardPage.tsx`**
- Removed `userId` from all API calls; now relies on the authenticated session.

---

## 2. Input Validation & Rate Limiting

### New Files
- **`server/src/middleware/rateLimiter.ts`** — Three rate limiters using `express-rate-limit`:
  - `aiLimiter`: 20 requests/hour (AI calls are expensive)
  - `authLimiter`: 10 requests/15 minutes (brute-force protection)
  - `generalLimiter`: 100 requests/minute (global API protection)
- **`server/src/middleware/validate.ts`** — Generic Zod validation middleware. Returns `400` with field-level error details on failure.
- **`server/src/validation/resume.schemas.ts`** — Zod schemas for `createResume` and `updateResume`.
- **`server/src/validation/ai.schemas.ts`** — Zod schemas for `analyzeResume` and `analyzeJobFit`.

### Modified Files
- **`server/src/app.ts`** — `generalLimiter` applied to all `/api` routes.
- **`server/src/routes/auth.routes.ts`** — `authLimiter` on `/login` and `/register`.
- **`server/src/routes/ai.routes.ts`** — `aiLimiter` + validation on both AI endpoints.
- **`server/src/routes/resume.routes.ts`** — Validation on `POST /` and `PATCH /:id`.

### New Dependency
```
express-rate-limit  (server)
```

---

## 3. Password Reset Flow

### Problem
`sendPasswordResetEmail()` existed in the email service but was never connected to any route. Users with forgotten passwords had no recovery path.

### Changes Made

**`server/prisma/schema.prisma`**
- Added two new fields to the `User` model:
  ```prisma
  resetToken  String?   @unique
  resetExpiry DateTime?
  ```

**`server/src/controllers/auth.controller.ts`**
- Added `forgotPassword`: generates a crypto random token, stores its SHA-256 hash + 1-hour expiry in DB, sends the reset email. Always responds with the same message to prevent email enumeration.
- Added `resetPassword`: verifies the token hash against DB, checks expiry, bcrypt-hashes the new password, clears the reset fields.

**`server/src/routes/auth.routes.ts`**
- Added `POST /forgot-password` (rate-limited).
- Added `POST /reset-password`.

**`client/src/pages/ForgotPasswordPage.tsx`** — New page: email input form with success confirmation state.

**`client/src/pages/ResetPasswordPage.tsx`** — New page: reads `?token=` from URL query params, new password + confirm fields, redirects to `/login` with a success message.

**`client/src/App.tsx`** — Added public routes `/forgot-password` and `/reset-password`.

**`client/src/pages/AuthPage.tsx`** — Added "Forgot password?" link next to the Password label on the login form.

---

## 4. Mobile Responsiveness

**`client/src/pages/DashboardPage.tsx`**
- Dashboard header changed to `flex-col sm:flex-row` so it stacks vertically on mobile.
- "New Resume" button is full-width on mobile (`w-full sm:w-auto`).

> The resume editor mobile toggle (Edit/Preview) was already implemented in `ResumeEditor.tsx` with a `mobileView` state — no changes required there.

---

## 5. UX & Polish

### Auto-save Indicator (`client/src/components/editor/ResumeEditor.tsx`)
- Added a `justSaved` state and a `prevIsSaving` ref to detect when `isSaving` transitions from `true → false`.
- Save button now shows:
  - `Saving…` + spinner while saving
  - `Saved ✓` for 3 seconds after save completes
  - `Save` at rest

### Error Boundary (`client/src/components/ErrorBoundary.tsx`)
- New React class component implementing `componentDidCatch`.
- Renders a friendly "Something went wrong" UI with a "Try Again" button.
- Wraps `<App />` in `main.tsx` (catches top-level crashes).
- Wraps the PDF preview pane in `ResumeEditor.tsx` (PDF rendering crashes don't take down the whole editor).

### Dashboard Loading Skeletons (`client/src/pages/DashboardPage.tsx`)
- Added `ResumeCardSkeleton` component using Tailwind `animate-pulse`.
- Shows 3 skeleton cards while resume data is loading instead of a blank screen.

---

## Applying Changes to the Live System

### Step 1 — Pull & Install

```bash
git pull origin main
cd server && npm install
cd ../client && npm install
```

### Step 2 — Run the Prisma Migration (REQUIRED)

The `User` table needs two new columns. Run this once against the production database:

```bash
cd server
npx prisma migrate deploy
```

> Use `migrate deploy` (not `migrate dev`) in production — it applies pending migrations without interactive prompts.

If you prefer to inspect the SQL first:
```bash
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script
```

### Step 3 — Environment Variables

Ensure the following are set in your production `.env`:

```env
# Already required
DATABASE_URL=
JWT_SECRET=
RESEND_API_KEY=       # Required for forgot-password emails to send

# Optional (AI features)
OPENROUTER_API_KEY=
```

### Step 4 — Build & Restart

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build
# Deploy the dist/ folder to your static host (Nginx, Vercel, etc.)

# Restart server process (adjust for your setup)
pm2 restart handiscv-server
# or
systemctl restart handiscv
```

---

## Verification Checklist

| Test | Expected Result |
|------|----------------|
| `GET /api/resumes/user/me` without a Bearer token | `401 Unauthorized` |
| `PATCH /api/resumes/:id` with a valid token for a *different* user's resume | `403 Forbidden` |
| `POST /api/ai/analyze` with an empty body `{}` | `400` with field-level error details |
| `POST /api/auth/login` 11 times in 15 minutes from same IP | `429 Too Many Requests` on the 11th request |
| `POST /api/auth/forgot-password` with a valid email | Reset email received; response is the same regardless of whether email exists |
| Follow reset link → set new password → login | Login succeeds with new password |
| Open the resume editor at 375px viewport width | Edit/Preview toggle tabs visible; only one pane shown at a time |
| Edit a field in the resume editor | "Saving…" indicator appears, transitions to "Saved ✓" after save completes |
| Dashboard while loading resumes | 3 animated skeleton cards shown |

---
---

# Sprint 2 — High-Priority Features

---

## 6. Premium Feature Gating

### Problem
The `isPremium` field existed on both the `User` and `Template` models, and Paymob sets it to `true` on payment — but no server-side or client-side logic actually checked it. All features (AI analysis, premium templates) were available to every user.

### Changes Made

**`server/src/middleware/auth.middleware.ts`**
- Added `requirePremium` middleware: fetches the user from DB, checks `isPremium`, returns `403` if false.

**`server/src/routes/ai.routes.ts`**
- Added `requirePremium` after `authenticate` on both `/analyze` and `/job-fit` routes.

**`server/src/controllers/resume.controller.ts`**
- In `updateResume`: when a template is being applied, looks up the template's `isPremium` flag. If the template is premium and the user is not, returns `403`.

**`server/src/services/resume.service.ts`**
- Added `getTemplateById(id)` helper to check a template's premium status.

**`client/src/components/UpgradeModal.tsx`** _(new)_
- Reusable modal with Crown icon, feature description, "Upgrade Now" (navigates to `/payment`), and "Maybe Later" buttons.

**`client/src/components/editor/AnalysisPanel.tsx`**
- Before calling AI endpoints, checks `user.isPremium` from auth store. If false, shows `UpgradeModal` instead of making the API call.

---

## 7. Template System — Seeding & Visual Picker

### Problem
The `Template` model and dynamic renderer existed, but the database had zero templates. The editor used a basic `<select>` dropdown with no visual preview.

### Changes Made

**`server/prisma/seed.ts`**
- Added 7 template seeds using `prisma.template.upsert()` (idempotent re-seeding):
  - **Free (5):** Classic, Elegant, Tech, Simple, Two-Column
  - **Premium (2):** Executive Pro, Designer
- Each template has a full `TemplateConfig`-compatible JSON config (layout, colors, typography, section styles).

**`client/src/components/editor/TemplatePicker.tsx`** _(new)_
- Slide-in side panel (matches `HistoryPanel` pattern): fixed left, w-80, z-50.
- Two sections: "Built-in" (6 hardcoded templates) and "Custom" (fetched from DB via API).
- Each card shows: accent color bar, template name, lock/crown icon for premium, checkmark for active.
- Clicking a premium template when not premium opens `UpgradeModal`.

**`client/src/components/editor/ResumeEditor.tsx`**
- Replaced the `<select>` dropdown with a "Templates" button (Palette icon) that opens `TemplatePicker`.

---

## 8. Resume Sharing Analytics

### Problem
Sharing worked (shareKey, isPublic toggle, public resume pages), but there was no tracking of how many times a shared resume was viewed.

### Changes Made

**`server/prisma/schema.prisma`**
- Added two fields to the `Resume` model:
  ```prisma
  viewCount    Int       @default(0)
  lastViewedAt DateTime?
  ```

**`server/src/controllers/recruiter.controller.ts`**
- In `getPublicResume`: after fetching the resume, fires an async (non-blocking) update to increment `viewCount` and set `lastViewedAt`.

**`server/src/controllers/resume.controller.ts`**
- Replaced insecure `Math.random().toString(36).substring(2, 12)` share key generation with:
  ```typescript
  crypto.randomBytes(8).toString('base64url')
  ```
  Produces an 11-char URL-safe cryptographically secure string.

**`client/src/types/resume.ts`**
- Added `viewCount?: number` to the `Resume` interface.

**`client/src/store/resume.ts`**
- Added `viewCount` to store state, populated from backend on `loadFromBackend`, reset on `resetResume`.

**`client/src/components/ResumeCard.tsx`**
- Shows Eye icon + view count badge on public resumes with views > 0.

**`client/src/components/editor/ResumeEditor.tsx`**
- Displays view count in the share menu dropdown when resume is public.

---

## 9. Version History — Pruning

### Already Complete
The version history UI (`HistoryPanel.tsx`) with save, restore, and timeline was already fully implemented. No UI changes needed.

### Changes Made

**`server/src/services/resume.service.ts`**
- Added `pruneOldVersions(resumeId, maxVersions = 20)`: counts versions, deletes the oldest ones exceeding the cap.

**`server/src/controllers/resume.controller.ts`**
- After `createVersion()` in `updateResume`, calls `pruneOldVersions()` fire-and-forget to keep version count at 20.

---

## 10. Export Options (JSON & Plain Text)

### Problem
Only client-side PDF export existed. Users needed JSON export for data portability and plain-text export for ATS-friendly submissions.

### Changes Made

**`client/src/lib/export.ts`** _(new)_
- `exportAsJSON(resume, filename)` — Serializes the full `ResumeSchema` as pretty-printed JSON, triggers browser download.
- `exportAsPlainText(resume, filename)` — Formats the resume as structured plain text (headings, bullet points, date ranges), triggers browser download.
  - Handles all section types: experience, education, skills, projects, certifications, languages, and custom sections.

**`client/src/components/editor/ResumeEditor.tsx`**
- Added an "Export" dropdown button (Download icon) in the preview header bar.
- Options: "PDF" (existing), "JSON", and "Plain Text".

---

## Applying Sprint 2 Changes to the Live System

### Step 1 — Pull & Install

```bash
git pull origin main
cd server && npm install
cd ../client && npm install
```

### Step 2 — Run Prisma Migrations (REQUIRED)

Two migrations need to be applied (Sprint 1 + Sprint 2):

```bash
cd server
npx prisma migrate deploy
```

This applies:
1. `add_password_reset_fields` — Adds `resetToken` and `resetExpiry` to `User` table (Sprint 1).
2. `add_resume_view_tracking` — Adds `viewCount` (Int, default 0) and `lastViewedAt` (DateTime?) to `Resume` table (Sprint 2).

### Step 3 — Seed Templates (REQUIRED for template picker)

```bash
cd server
npx prisma db seed
```

This creates:
- Admin user (if not exists)
- 7 resume templates (5 free + 2 premium)

### Step 4 — Build & Restart

```bash
# Server
cd server && npm run build

# Client
cd client && npm run build

# Restart
pm2 restart handiscv-server
```

---

## Sprint 2 — Verification Checklist

| Test | Expected Result |
|------|----------------|
| Free user clicks "Analyze Resume" | UpgradeModal appears with "Upgrade Now" option |
| Premium user clicks "Analyze Resume" | AI analysis runs normally |
| Free user selects a premium template in the picker | UpgradeModal appears; template is not applied |
| Premium user selects a premium template | Template applies successfully |
| Click "Templates" button in editor toolbar | TemplatePicker panel slides in from the left |
| `GET /api/templates` after seeding | Returns 7 templates (5 with `isPremium: false`, 2 with `isPremium: true`) |
| Make a resume public → visit `/cv/:shareKey` 3 times | Dashboard card shows "3 views" with Eye icon |
| Check share key format on a newly-public resume | 11-char base64url string (e.g. `aB3_xY7-kLm`) |
| Create 25 versions of a resume | Only 20 versions remain in the database |
| Click Export → JSON | Browser downloads a `.json` file containing the full resume schema |
| Click Export → Plain Text | Browser downloads a `.txt` file with formatted resume content |
| `npx tsc --noEmit` in both server/ and client/ | Zero TypeScript errors |

---
---

# Sprint 3 — Medium-Priority Features

---

## 11. Collaborative Review / Shareable Edit Links

### What was built
A token-based review system: the resume owner generates a link with an expiry date; a reviewer opens it in read-only mode and adds inline comments anchored to sections; the owner sees those comments in an editor sidebar.

### New Prisma Models
```prisma
model ReviewSession {
  id        String   @id @default(cuid())
  resumeId  String
  token     String   @unique @default(cuid())
  expiresAt DateTime
  name      String?
  comments  Json     @default("[]")
}
```

### New Files
- **`server/src/controllers/review.controller.ts`** — `createSession`, `getSession`, `addComment`, `resolveComment`, `deleteSession` (219 lines). Public comment endpoints require no auth; owner endpoints require JWT + ownership check.
- **`server/src/routes/review.routes.ts`** — Mounted at `/api` (e.g. `POST /api/resumes/:id/review-sessions`, `GET /api/review/:token`).
- **`client/src/pages/ReviewPage.tsx`** — Full reviewer UI: read-only resume render, comment thread, add/resolve comments.

### Modified Files
- **`server/prisma/schema.prisma`** — Added `ReviewSession` model + `reviewSessions` relation on `Resume`.
- **`client/src/components/editor/ReviewPanel.tsx`** — Owner sidebar in the editor showing pending comments.

---

## 12. LinkedIn-Style Profile Completeness Score

### What was built
A client-side "profile strength" percentage shown in the editor sidebar as a circular progress indicator with colour-coded feedback and contextual improvement hints.

### New Files
- **`client/src/lib/completeness.ts`** — 12-rule scoring engine: checks profile fields, section presence, item counts, and content quality. Returns `{ score: number, hints: string[] }`.
- **`client/src/components/editor/CompletenessScore.tsx`** — SVG circular progress indicator with red (<40%) / yellow (40–79%) / green (≥80%) colour bands. Rendered in the editor sidebar.

---

## 13. Job Board Integration

### What was built
A full job application tracker: create, read, update, delete job applications with a Kanban board (drag-and-drop columns) and table view. Linked to resumes via optional `resumeId`.

### New Prisma Models
```prisma
enum ApplicationStatus { SAVED APPLIED INTERVIEW OFFER REJECTED }

model JobApplication {
  id        String            @id @default(cuid())
  userId    String
  resumeId  String?
  jobTitle  String
  company   String
  url       String?
  status    ApplicationStatus @default(SAVED)
  notes     String?
  salary    String?
  appliedAt DateTime?
}
```

### New Files
- **`server/src/controllers/job.controller.ts`** — Full CRUD with ownership checks; `stats` aggregation endpoint.
- **`server/src/services/job.service.ts`** — `createJobApplication`, `getJobApplications`, `getJobStats`, `updateJobApplication`, `deleteJobApplication`.
- **`server/src/routes/job.routes.ts`** — `router.use(authenticate)` + Zod validation on POST/PATCH. Mounted at `/api/jobs`.
- **`server/src/validation/job.schemas.ts`** — `createJobSchema`, `updateJobSchema`.
- **`client/src/pages/JobTrackerPage.tsx`** — Kanban board (drag columns via `@dnd-kit`) + table view. Status tabs for filtering. Full CRUD UI.
- **`client/src/store/job.ts`** — Zustand + immer store for job applications.
- **`client/src/types/job.ts`** — `JobApplication`, `JobStatus`, `CreateJobInput`, `UpdateJobInput`.

### Modified Files
- **`client/src/App.tsx`** — Added `/jobs` route.
- **`client/src/components/layout/AuthenticatedLayout.tsx`** — Added "Job Tracker" nav item.

---

## 14. Email Notifications

### What was built
Proactive email notifications for key events, with per-user opt-in/opt-out preferences and throttling to prevent spam.

### New Prisma Models
```prisma
model NotificationPreference {
  userId               String  @unique
  resumeViewed         Boolean @default(true)
  weeklyDigest         Boolean @default(true)
  subscriptionReminder Boolean @default(true)
  accountActivity      Boolean @default(true)
}

model NotificationLog {
  userId String
  type   String
  sentAt DateTime @default(now())
  @@index([userId, type, sentAt])
}
```

### New Files
- **`server/src/services/notification.service.ts`** — Sends resume-viewed emails (throttled at view milestones: 1, 5, 10, 25, 50…), weekly digest, subscription expiry reminders, account activity alerts.
- **`server/src/controllers/notification.controller.ts`** — `GET /api/notifications/preferences`, `PATCH /api/notifications/preferences`.
- **`server/src/routes/notification.routes.ts`** — Protected by `authenticate`. Mounted at `/api/notifications`.
- **`server/src/jobs/scheduler.ts`** — `node-cron` scheduler: weekly digest at Sunday 09:00, subscription reminders checked daily.

### Modified Files
- **`server/src/controllers/recruiter.controller.ts`** — After incrementing `viewCount`, calls `notification.service.checkAndSendViewNotification()` asynchronously (fire-and-forget).
- **`server/package.json`** — Added `node-cron` dependency.

### New Dependency
```
node-cron  (server)
```

---

## 15. Two-Factor Authentication (TOTP)

### What was built
Optional TOTP-based 2FA: QR code setup flow, 6-digit verification at login, enable/disable from account settings.

### Prisma Changes
```prisma
// Added to User model:
totpSecret       String?
twoFactorEnabled Boolean @default(false)
```

### New Files
- **`server/src/services/totp.service.ts`** — `generateTotpSecret()`, `generateQrCode()`, `verifyTotpToken()` using `otplib` + `qrcode`.
- **`server/src/controllers/twofa.controller.ts`** — `setup` (generate secret + QR), `verify` (confirm setup), `disable`, `validate` (used in login flow). 182 lines.
- **`server/src/routes/twofa.routes.ts`** — Mounted at `/api/auth/2fa`.
- **`client/src/pages/TwoFactorPage.tsx`** — 6-digit OTP input with auto-advance and paste support.
- **`client/src/components/settings/TwoFactorSetup.tsx`** — QR code display, code entry, enable/disable toggle in account settings.

### Modified Files
- **`server/src/controllers/auth.controller.ts`** — `login` now checks `twoFactorEnabled`; if true, issues a short-lived JWT with `purpose:'2fa'` instead of a full session token. The TwoFactorPage exchanges this for a full JWT.
- **`client/src/pages/AuthPage.tsx`** — On login response with `requiresTwoFactor: true`, redirects to `/2fa-verify` with the temp token.
- **`client/src/App.tsx`** — Added `/2fa-verify` route.

### New Dependencies
```
otplib   (server)
qrcode   (server)
```

---

## Applying Sprint 3 Changes to the Live System

### Step 1 — Pull & Install

```bash
git pull origin main
cd server && npm install   # picks up node-cron, otplib, qrcode
cd ../client && npm install
```

### Step 2 — Run Prisma Migration (REQUIRED)

New models: `ReviewSession`, `JobApplication`, `NotificationPreference`, `NotificationLog`.
New fields on `User`: `totpSecret`, `twoFactorEnabled`.

```bash
cd server
npx prisma migrate deploy
```

### Step 3 — Build & Restart

```bash
cd server && npm run build
cd ../client && npm run build
pm2 restart handiscv-server
```

---

## Sprint 3 — Verification Checklist

| Test | Expected Result |
|------|----------------|
| Owner creates review session → shares link | Reviewer can open `/review/:token` without logging in |
| Reviewer adds comment | Comment appears in owner's ReviewPanel in the editor |
| Editor sidebar shows completeness score | Circular % indicator visible; hints shown for missing sections |
| Fill all resume sections | Score reaches ≥80% (green) |
| `POST /api/jobs` with valid body | 201 + job record created |
| Drag a job card to "Interview" column | Status updates to `INTERVIEW` in DB |
| View a public resume 5 times | View-notification email sent to owner (if `resumeViewed` pref is true) |
| `GET /api/notifications/preferences` | Returns user's current notification settings |
| Enable 2FA in Settings → scan QR → enter code | `twoFactorEnabled=true` on user; subsequent login prompts for OTP |
| Log in with 2FA enabled → enter wrong code | `401 Invalid OTP code` |

---
---

# Sprint 4 — LinkedIn Browser Extension

---

## 16. Browser Extension (Profile Import + Job Tracker)

### What was built
A Manifest V3 Chrome extension that gives users two one-click LinkedIn workflows:

1. **Profile → CV**: Reads the authenticated LinkedIn profile DOM and creates a HandisCV resume.
2. **Job → Tracker**: Reads a LinkedIn job listing and saves it to the Job Tracker.

### Architecture
All API calls are proxied through the MV3 service worker (exempt from CORS). Content scripts scrape the DOM and cache results in the service worker; the popup retrieves them on demand. No requests are made to LinkedIn's API — only the visible DOM is read.

```
Content Script  ──PROFILE_READY/JOB_READY──▶  Service Worker (in-memory cache)
Popup           ──GET_CACHED_PROFILE/JOB──▶   Service Worker  ──▶  returns cache
Popup           ──API_FETCH──▶                Service Worker  ──▶  fetch(HandisCV API)
```

### New Top-Level Directory: `extension/`

| File | Purpose |
|---|---|
| `manifest.json` | MV3 manifest; `host_permissions: linkedin.com` |
| `package.json` | React 19 + Vite + `@types/chrome` |
| `vite.config.ts` | Multi-entry build: popup + service-worker + 2 content scripts |
| `tsconfig.json` | TypeScript config with `chrome` types |
| `shared/types.ts` | `LinkedInScrapedProfile`, `LinkedInJobPayload`, `ExtensionMessage`, `ExtensionUser` |
| `shared/auth.ts` | `getToken/setToken/clearToken/getApiBase` — `chrome.storage.local` wrappers |
| `content/selectors.ts` | **All** LinkedIn DOM selectors isolated here — update this file when LinkedIn changes markup |
| `content/linkedin-profile.ts` | Content script for `/in/*` — scrapes name, headline, experience, education, skills |
| `content/linkedin-job.ts` | Content script for `/jobs/view/*` — scrapes title, company, location, description |
| `background/service-worker.ts` | Caches scraped data; relays API calls; badge counter; SPA navigation re-injection |
| `popup/popup.html` | Shell HTML |
| `popup/index.tsx` | React mount point |
| `popup/App.tsx` | Context-aware UI: Auth screen / Profile import card / Job save card / Guide screen |
| `README.md` | Install, connect, usage, and architecture documentation |

### New Server Endpoints

**`server/src/controllers/auth.controller.ts`** — Added `getMe`:
- `GET /api/auth/me` (protected) — returns `{ id, email, role, isPremium, twoFactorEnabled, avatar }`. Used by the extension popup to verify the stored token and display the user's name.

**`server/src/controllers/import.controller.ts`** — Added `importFromExtension` + `mapLinkedInToResumeSchema`:
- `POST /api/import/linkedin-extension` (protected) — accepts `{ profileData: LinkedInScrapedProfile }`, maps it to a full `ResumeSchema` (experience, education, skills sections with parsed date ranges), creates a `Resume` record, returns `{ resumeId, title }`.

### Modified Server Files
- **`server/src/routes/auth.routes.ts`** — Added `GET /me` route.
- **`server/src/routes/import.routes.ts`** — Added `POST /linkedin-extension` route.

### Modified Client Files
- **`client/src/pages/AccountSettingsPage.tsx`** — Added "Browser Extension" section: shows the JWT in a show/hide password-style field with a Copy button. Users paste this token into the extension popup to connect their account.

### Auth Token Flow (MVP)
1. User logs into HandisCV web app.
2. Goes to **Settings → Browser Extension**, copies the token.
3. Pastes into the extension popup → extension calls `GET /api/auth/me` to verify.
4. On 401: popup shows "Token expired — get a new one from HandisCV Settings."

### Build & Install
```bash
cd extension
npm install
npm run build          # produces extension/dist/
```
Then in Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist/`.

---

## Applying Sprint 4 Changes to the Live System

### Step 1 — Pull & Install

```bash
git pull origin main
cd server && npm install   # no new dependencies for server
cd ../client && npm install
```

### Step 2 — No Prisma Migrations Required

Sprint 4 reuses existing `Resume` and `JobApplication` models.

### Step 3 — Build Web App & Server

```bash
cd server && npm run build
cd ../client && npm run build
pm2 restart handiscv-server
```

### Step 4 — Build & Load Extension

```bash
cd extension
npm install
npm run build
```

Load `extension/dist/` as an unpacked extension in Chrome (developer mode).

---

## Sprint 4 — Verification Checklist

| Test | Expected Result |
|------|----------------|
| `GET /api/auth/me` with valid JWT | Returns `{ id, email, role, isPremium, twoFactorEnabled }` |
| `GET /api/auth/me` without token | `401 Unauthorized` |
| `POST /api/import/linkedin-extension` with sample `profileData` | 201 + `{ resumeId, title }` |
| `POST /api/import/linkedin-extension` with empty `profileData` | 400 `Invalid profile data` |
| Settings page → "Browser Extension" section | Token displayed (hidden by default); Copy button works |
| Load extension in Chrome → paste token → Connect | Popup shows user email |
| Navigate to `linkedin.com/in/*` → click extension | Profile card with name, headline, experience count |
| Click "Import to HandisCV" | Resume created; "Open in HandisCV Editor" button appears |
| Navigate to `linkedin.com/jobs/view/*` → click extension | Job card with title, company, status dropdown |
| Click "Save to Job Tracker" | Job appears in `/jobs` page; popup shows "Saved ✓" |
| Navigate to `google.com` → click extension | Guide screen: "Navigate to a LinkedIn profile or job" |
