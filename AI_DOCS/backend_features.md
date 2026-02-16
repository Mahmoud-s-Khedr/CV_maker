# Backend Server Features (Current)

This document summarizes what the backend server **currently provides** in this repository.

- Runtime: Node.js + Express
- DB: PostgreSQL via Prisma
- Base API prefix: `/api`
- Health check: `GET /health`

## 1) Core Platform

### 1.1 Health & Observability
- `GET /health`
  - Returns: `{ status: "ok", timestamp: string }`
- Request logging middleware (`requestLogger`)
  - Logs each request with duration
- Global error handler
  - Returns `500 { error: "Internal server error" }` on unhandled exceptions

### 1.2 Security Middleware
- Helmet enabled for HTTP headers
- CORS enabled
  - Allowed origins come from `CORS_ORIGINS` env var (comma-separated)

## 2) Authentication & Accounts (`/api/auth`)

Authentication is **JWT bearer token** based.

- Client sends: `Authorization: Bearer <token>`
- Token payload includes: `userId`, `email`, `role`

### 2.0 Current User
- `GET /api/auth/me` (protected)
  - Returns: `{ id, email, role, isPremium, twoFactorEnabled, avatar? }`
  - Used by the browser extension popup to verify the stored JWT and show user info

### 2.1 Email/Password Registration + Verification
- `POST /api/auth/register`
  - Body: `{ email: string, password: string, role?: "USER" | "RECRUITER" }`
  - Behavior:
    - Role is restricted to `USER` or `RECRUITER` (cannot self-register as `ADMIN`)
    - Creates user with `isEmailVerified=false`
    - Generates `verificationToken` + expiry (24h)
    - Sends verification email via Resend (or logs link in dev if Resend not configured)
  - Response: `{ message: string, requiresVerification: true }`

- `GET /api/auth/verify-email?token=...`
  - Marks email as verified, clears verification token

- `POST /api/auth/resend-verification`
  - Body: `{ email: string }`
  - Does not reveal whether the email exists

- `POST /api/auth/login`
  - Body: `{ email: string, password: string }`
  - Returns 403 if email not verified
  - Response on success:
    - `{ token: string, user: { id, email, role, isPremium, avatar? } }`

### 2.2 Google OAuth
- `POST /api/auth/google`
  - Body: `{ credential: string }` (Google ID token)
  - Behavior:
    - Creates user if not exists
    - Links Google account if user exists without `googleId`
    - Auto-verifies email (`isEmailVerified=true`)
  - Response:
    - `{ token: string, user: { id, email, role, isPremium, avatar? } }`

## 3) Resume CRUD, Versioning, and Sharing (`/api/resumes`)

The resume is stored as JSON (`Resume.content`) to support flexible schema evolution.

### 3.1 CRUD
- `POST /api/resumes`
  - Body: `{ userId: string, title: string, content: any }`
  - Creates a resume record

- `GET /api/resumes/:id`
  - Fetch a resume by id

- `PATCH /api/resumes/:id`
  - Body: partial resume fields (commonly `{ content }`, `{ isPublic }`, etc.)
  - Behavior:
    - Auto-versioning: saves the current `content` into `ResumeVersion` before updating
    - Public sharing:
      - If `isPublic=true` and no existing `shareKey`, generates a random share key

- `DELETE /api/resumes/:id`
  - Deletes the resume

- `GET /api/resumes/user/:userId`
  - Lists resumes by user id

### 3.2 Version History
- `POST /api/resumes/:id/versions`
  - Body: `{ content: any }`
  - Creates a version snapshot

- `GET /api/resumes/:id/versions`
  - Lists versions (most recent first)

### 3.3 Important Current Limitation (Security)
- Resume routes currently **do not enforce authentication/ownership**.
  - Controllers include TODOs noting `userId` should come from auth middleware.
  - This is a known gap: anyone who knows a resume id could read/update/delete it.

## 4) AI Features (`/api/ai`)

The backend proxies AI requests to OpenRouter using the OpenAI SDK.

- `POST /api/ai/analyze`
  - Body: `{ content: any }` (client sends the full resume JSON)
  - Returns a structured analysis JSON:
    - `{ score: number, summary: string, strengths: string[], weaknesses: string[], suggestions: string[] }`

## 5) Import Features (`/api/import`)

### 5.1 LinkedIn PDF Import
- `POST /api/import/linkedin`
  - Multipart form-data: `file`
  - Behavior:
    - Extracts text via `pdf-parse`
    - Uses AI to extract structured profile fields
  - Response:
    - `{ success: true, data: { profile: any, fullText: string } }`

### 5.2 GitHub Repo Import
- `POST /api/import/github`
  - Body: `{ username: string }`
  - Behavior:
    - Fetches repos from GitHub API
    - Filters out forks
    - Sorts by stars
    - Maps to project items
  - Response:
    - `{ success: true, data: ProjectItem[] }`

### 5.3 LinkedIn Extension Import
- `POST /api/import/linkedin-extension` (protected)
  - Body: `{ profileData: LinkedInScrapedProfile }`
    - `LinkedInScrapedProfile`: `{ fullName, headline, location, summary, experience[], education[], skills[] }`
  - Behavior:
    - Maps scraped DOM data to a full `ResumeSchema` (experience, education, skills sections)
    - Parses LinkedIn date ranges (e.g. "Jan 2020 – Present") into `startDate`/`endDate`
    - Creates a `Resume` record owned by the authenticated user
  - Response: `{ resumeId: string, title: string }`
  - Used by the browser extension (service worker proxies the call)

## 6) Templates (`/api/templates`)

Templates support a hybrid approach:
- Built-in templates exist in the client
- Dynamic templates are stored in DB with JSON `config`

- `GET /api/templates`
  - Returns list view fields: `{ id, name, thumbnailUrl, isPremium }[]`

- `GET /api/templates/:id`
  - Returns full template record including `config`

## 7) Recruiter Features (`/api/recruiter`)

### 7.1 Public Resume Viewing
- `GET /api/recruiter/public/:shareKey`
  - Returns full resume record where:
    - `shareKey` matches
    - `isPublic=true`

### 7.2 Recruiter Search (Protected)
- `GET /api/recruiter/search?q=...&page=1&limit=10`
  - Protected by JWT + role:
    - Allowed roles: `RECRUITER`, `ADMIN`
  - Current search implementation:
    - Basic `title contains` search
    - Returns a transformed “preview” object derived from `Resume.content.profile`

## 8) Admin Features (Protected) (`/api/admin`)

All admin endpoints require:
- `authenticate` (JWT)
- `authorize(['ADMIN'])`

### 8.1 User Management
- `GET /api/admin/users?page=1&limit=20`
- `DELETE /api/admin/users/:id`
  - Prevents deleting your own account

### 8.2 Audit Logs
- `GET /api/admin/logs?page=1&limit=50`

### 8.3 Template Creation
- `POST /api/admin/templates`
  - Body: `{ name: string, config: any, isPremium?: boolean, thumbnailUrl?: string }`
  - Writes a Template record
  - Writes an AuditLog entry

## 9) Payments (Paymob) (`/api/payment`)

### 9.1 Initiate Payment (Protected)
- `POST /api/payment/initiate`
  - Requires JWT (`authenticate`)
  - Body: `{ firstName, lastName, email, phone }`
  - Behavior:
    - Gets Paymob auth token
    - Registers order
    - Stores Paymob order id on user (`User.paymobOrderId`)
    - Generates payment key
  - Response: `{ paymentKey, frameId }`

### 9.2 Paymob Webhook
- `POST /api/payment/webhook?hmac=...`
  - Validates HMAC using `PAYMOB_HMAC_SECRET`
  - On successful transaction:
    - Finds user by stored `paymobOrderId`
    - Sets `isPremium=true`

## 10) Environment Variables (Server)

Commonly required env vars:
- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `GOOGLE_CLIENT_ID`
- `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`)
- `RESEND_API_KEY` (optional; logs emails to console when absent)
- `FROM_EMAIL`
- `APP_URL`
- `PAYMOB_API_KEY`, `PAYMOB_INTEGRATION_ID`, `PAYMOB_FRAME_ID`, `PAYMOB_HMAC_SECRET`

## 11) Two-Factor Authentication (`/api/auth/2fa`)

All endpoints protected by `authenticate`.

- `POST /api/auth/2fa/setup` — generates a TOTP secret + QR code URI for the user
- `POST /api/auth/2fa/verify` — confirms the setup by validating a 6-digit code; sets `twoFactorEnabled=true`
- `POST /api/auth/2fa/disable` — disables 2FA after verifying a current code
- `POST /api/auth/2fa/validate` — used during login: accepts a temp JWT (`purpose:'2fa'`) + a 6-digit code; returns a full session JWT on success

**Login flow with 2FA:**
1. `POST /api/auth/login` — if `twoFactorEnabled`, returns `{ requiresTwoFactor: true, tempToken }` instead of a full JWT
2. Client redirects to `/2fa-verify`, which calls `POST /api/auth/2fa/validate`
3. On success, full `{ token, user }` returned

## 12) Notification Preferences (`/api/notifications`)

Protected by `authenticate`.

- `GET /api/notifications/preferences` — returns `{ resumeViewed, weeklyDigest, subscriptionReminder, accountActivity }`
- `PATCH /api/notifications/preferences` — updates one or more boolean preference flags

**Background jobs** (`server/src/jobs/scheduler.ts`):
- Weekly digest: every Sunday at 09:00 — sends a summary of resume views from the past 7 days
- Subscription reminders: daily check — emails users whose `premiumExpiresAt` is within 3 days

## 13) Review Sessions (`/api`)

### Owner endpoints (protected)
- `POST /api/resumes/:id/review-sessions` — creates a `ReviewSession` with token + expiry date
- `GET /api/resumes/:id/review-sessions` — lists active sessions for a resume
- `DELETE /api/review-sessions/:sessionId` — deletes a session

### Public endpoints (no auth required)
- `GET /api/review/:token` — fetch session + resume (read-only); validates expiry
- `POST /api/review/:token/comments` — add a comment (stored in JSON array)
- `PATCH /api/review/:token/comments/:commentId` — resolve a comment

## 14) Job Applications (`/api/jobs`)

All endpoints protected by `authenticate`. Ownership enforced on all operations.

- `POST /api/jobs` — create a job application; validates with `createJobSchema`
  - Body: `{ jobTitle, company, url?, status?, notes?, salary?, appliedAt?, resumeId? }`
- `GET /api/jobs` — list applications; optional `?status=` filter
- `GET /api/jobs/stats` — aggregated counts by status
- `GET /api/jobs/:id` — fetch single application
- `PATCH /api/jobs/:id` — update fields; validates with `updateJobSchema`
- `DELETE /api/jobs/:id` — delete application

## 15) Known Gaps / Hardening TODOs

- Payment initiation requires Paymob env vars; without them it will fail at runtime.
- Recruiter search is currently basic title matching; JSONB deep search is not implemented.
- No Stripe webhook handler yet (Stripe service exists but checkout flow is not wired).
