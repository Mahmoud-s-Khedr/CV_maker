# HandisCV — Feature Roadmap

This document outlines new features that can be added to the platform, organized by priority and estimated complexity.

---

## High Priority

### ~~1. Premium Feature Gating~~ ✅ Done (Sprint 2)
~~**What:** The `isPremium` flag already exists on the `User` model and Paymob payment integration is live, but no business logic actually checks this flag. Premium features need to be enforced.~~

**Implemented:** `requirePremium` middleware gates AI endpoints and premium templates. Client-side `UpgradeModal` shown to free users. See [CHANGES.md §6](CHANGES.md).

---

### ~~2. Resume Templates System~~ ✅ Done (Sprint 2)
~~**What:** A `Template` model and admin UI for creating templates exist but templates aren't actually rendered in the editor. Users can't apply a template to their resume.~~

**Implemented:** 7 templates seeded (5 free + 2 premium) via `prisma db seed`. Visual `TemplatePicker` side panel with accent colors and lock icons for premium. See [CHANGES.md §7](CHANGES.md).

---

### ~~3. Resume Sharing & Analytics~~ ✅ Done (Sprint 2)
~~**What:** `shareKey` and `isPublic` fields already exist. Add a sharing UI and basic view analytics.~~

**Implemented:** `viewCount` and `lastViewedAt` fields on Resume model. View count incremented on public access, displayed on dashboard cards and in editor share menu. Cryptographic share keys via `crypto.randomBytes()`. See [CHANGES.md §8](CHANGES.md).

---

### ~~4. Resume Version History UI~~ ✅ Done (Sprint 2)
~~**What:** The backend already saves versions on every update (`ResumeVersion` model), but there is no UI to browse or restore them.~~

**Implemented:** `HistoryPanel.tsx` with timeline, save, and restore was already complete. Added version pruning (capped at 20 per resume). See [CHANGES.md §9](CHANGES.md).

---

### ~~5. Export Options~~ ✅ Done (Sprint 2)
~~**What:** Currently only PDF export via `@react-pdf/renderer`. Add more formats.~~

**Implemented:** JSON and Plain Text export (client-side) added alongside existing PDF. Export dropdown in editor preview header. DOCX export remains a future option. See [CHANGES.md §10](CHANGES.md).

---

## Medium Priority

### ~~6. Collaborative Editing / Shareable Edit Links~~ ✅ Done (Sprint 3)
~~**What:** Allow a user to generate a link that lets a reviewer add comments or suggestions to a resume without editing the original.~~

**Implemented:** `ReviewSession` model with unique token + `expiresAt` + JSON `comments` array. Token-based public access (no auth required for reviewers). Owner sees comments in a sidebar panel. See `server/src/controllers/review.controller.ts`, `client/src/pages/ReviewPage.tsx`.

---

### ~~7. LinkedIn-Style Profile Completeness Score~~ ✅ Done (Sprint 3)
~~**What:** Show users a "profile strength" percentage that increases as they fill in more resume sections, encouraging completion.~~

**Implemented:** 12-rule client-side scoring engine in `client/src/lib/completeness.ts`. Circular progress indicator with red/yellow/green colour bands and contextual hints rendered in `client/src/components/editor/CompletenessScore.tsx`.

---

### ~~8. Job Board Integration~~ ✅ Done (Sprint 3)
~~**What:** Let users save job listings they're applying to and track which resume version they sent.~~

**Implemented:** `JobApplication` model with SAVED/APPLIED/INTERVIEW/OFFER/REJECTED status enum. Full CRUD in `server/src/controllers/job.controller.ts`. Kanban and table views in `client/src/pages/JobTrackerPage.tsx` with `@dnd-kit` for column drag-and-drop. State managed in `client/src/store/job.ts`.

---

### ~~9. Email Notifications~~ ✅ Done (Sprint 3)
~~**What:** Proactive emails for key events (currently only verification and password reset emails are sent).~~

**Implemented:** `NotificationPreference` and `NotificationLog` Prisma models. Resume-viewed notifications throttled at view-count milestones (1, 5, 10, 25 …). Weekly digest and subscription-expiry reminders via `node-cron` scheduler in `server/src/jobs/scheduler.ts`. Per-user opt-in/opt-out via `server/src/controllers/notification.controller.ts`.

---

### ~~10. Two-Factor Authentication (2FA)~~ ✅ Done (Sprint 3)
~~**What:** Optional TOTP-based 2FA using an authenticator app.~~

**Implemented:** `totpSecret` and `twoFactorEnabled` fields on `User`. TOTP generation + QR code via `server/src/services/totp.service.ts`. Temp JWT with `purpose:'2fa'` claim gates the verification step. 6-digit code input with auto-advance/paste in `client/src/pages/TwoFactorPage.tsx`. Full setup/verify/disable flow in `server/src/controllers/twofa.controller.ts`.

---

## Lower Priority / Future Ideas

### 11. AI Cover Letter Generator
**What:** Given a job description and the user's resume, generate a tailored cover letter.

**Implementation:**
- New endpoint `POST /api/ai/cover-letter` accepting `resume` (JSON) + `jobDescription` (string) + optional `tone` (formal/casual).
- Returns a cover letter as markdown text.
- Display in an editable text area on the client; allow download as PDF or copy to clipboard.

---

### 12. Multi-Language Resume Support
**What:** Allow users to create multiple language versions of the same resume (e.g., English + Arabic).

**Implementation:**
- Add a `language` field to the `Resume` model (ISO 639-1 code).
- Group resumes by "base resume" with a `parentId` foreign key for translations.
- Language switcher in the dashboard.
- RTL layout support in the PDF renderer for Arabic/Hebrew.

---

### 13. ATS Simulator
**What:** Simulate how an ATS (Applicant Tracking System) would parse and score the resume for a specific job description.

**Implementation:**
- Extend the existing job-fit analysis endpoint.
- Keyword density analysis, section detection, formatting warnings (tables, graphics that ATS systems can't parse).
- Show a side-by-side comparison: "What the ATS sees" vs. the styled resume.

---

### 14. Recruiter Public API
**What:** Allow recruiters to programmatically search and retrieve public resumes via a REST API with an API key.

**Implementation:**
- Add an `ApiKey` model linked to RECRUITER users.
- API key management UI in the recruiter dashboard.
- Rate-limited, key-authenticated endpoints for searching and fetching public resumes.
- OpenAPI/Swagger documentation auto-generated from routes.

---

### 15. Mobile App (React Native)
**What:** Native iOS/Android app sharing business logic with the web client.

**Implementation:**
- Expo-based React Native app.
- Shared Zustand store logic and API client.
- Mobile-optimized editor (section-by-section form instead of live split-screen preview).
- Push notifications for resume views and job application status updates.

---

### 16. LinkedIn Browser Extension
**What:** A Chrome/Firefox extension that gives users a "one-click" LinkedIn experience: scrape their own LinkedIn profile into a ready-to-edit HandisCV resume, and save any job posting to the Job Tracker without leaving LinkedIn.

**Two core capabilities:**

**A) Profile → CV Import**
- On any `linkedin.com/in/*` page the extension detects it is the *own* profile (avatar badge / "You" indicator).
- Reads the DOM for: name, headline, location, about/summary, experience entries (title, company, date range, description), education, skills, certifications, projects, and languages.
- Transforms the scraped data into the `ResumeSchema` JSON format (`profile`, `sections[]`).
- Sends it to `POST /api/import/linkedin-extension` (new endpoint) with the user's JWT stored in `chrome.storage.local`.
- The server creates (or updates) a resume and returns the `resumeId`.
- Extension popup shows "Open in HandisCV editor" deep-link button.

**B) Job Posting → Job Tracker**
- On any `linkedin.com/jobs/view/*` page the extension detects job details: title, company, location, description, URL.
- Extension popup shows "Save to Job Tracker" button with a status dropdown (SAVED / APPLIED / etc.).
- Calls `POST /api/jobs` with the scraped fields and the user's JWT.
- Confirms with "Saved!" toast; badge counter on the extension icon increments.

**Architecture:**

```
extension/
├── manifest.json          (MV3, host_permissions: linkedin.com)
├── background/
│   └── service-worker.ts  (auth token storage, API calls via fetch)
├── content/
│   ├── linkedin-profile.ts  (DOM scraper for /in/* pages)
│   └── linkedin-job.ts      (DOM scraper for /jobs/view/* pages)
├── popup/
│   ├── popup.html
│   ├── popup.tsx            (React + Vite build)
│   └── popup.css
└── shared/
    ├── api.ts               (fetch wrapper → HandisCV API)
    ├── types.ts             (ResumeSchema, JobPayload)
    └── auth.ts              (chrome.storage JWT helpers)
```

**New server endpoint:**
- `POST /api/import/linkedin-extension` — accepts `{ profileData: LinkedInScrapedProfile }`, maps it to `ResumeSchema`, creates a Resume record, returns `{ resumeId }`. Protected by `authenticate` middleware.

**Auth flow:**
- Extension popup shows a "Connect HandisCV" button if no token is stored.
- On click, opens `chrome.identity.launchWebAuthFlow` → `GET /api/auth/extension-callback?token=JWT` (new route) which echoes the JWT back to the extension; stored in `chrome.storage.local`.
- Alternatively: user copies their JWT from the web app settings page (simpler MVP).

**Selector maintenance strategy:**
- All LinkedIn DOM selectors are isolated in `content/selectors.ts` (one object per page type) so they can be updated without touching business logic.
- CI check pings a known LinkedIn page monthly and alerts if any selector returns `null`.

**Files to add/change:**
- `extension/` — new top-level directory (separate Vite build, `vite.config.extension.ts`)
- `server/src/routes/import.routes.ts` — add `POST /linkedin-extension` route
- `server/src/controllers/import.controller.ts` — add `importFromExtension` handler
- `server/src/routes/auth.routes.ts` — add `GET /extension-callback` route
- `client/src/pages/AccountSettingsPage.tsx` — "Copy extension token" button

**See full detail:** [AI_DOCS/browser_extension_plan.md](AI_DOCS/browser_extension_plan.md)

---

## Technical Improvements

These aren't user-facing features but significantly improve reliability and developer experience:

| Item | Description |
|------|-------------|
| **Test suite** | Add Vitest unit tests for services, integration tests for API routes with a test database |
| **OpenAPI docs** | Auto-generate Swagger UI from route + schema definitions using `zod-to-openapi` |
| **Full-text search index** | Add PostgreSQL `tsvector` GIN index on resume content for fast recruiter search |
| ~~**Cryptographic share keys**~~ ✅ | ~~Replace `Math.random()` in share key generation with `crypto.randomBytes()`~~ — Done in Sprint 2 |
| **Premium price config** | Move hardcoded Paymob amount (10,000 cents) to environment variable |
| **Resume content type** | Define a TypeScript interface for the resume JSON structure and enforce it end-to-end |
| **Stripe integration** | `stripeCustomerId` already in schema — wire up Stripe as a second payment provider |
| **Audit trail** | Extend `AuditLog` to cover user actions (resume saves, shares, AI calls), not just admin actions |
| **Docker Compose for dev** | Add a `docker-compose.dev.yml` with hot-reload volumes for a one-command dev setup |
