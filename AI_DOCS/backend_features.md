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

## 11) Known Gaps / Hardening TODOs

These are not hypothetical—they reflect current code behavior:
- Resume CRUD routes are not yet protected by auth/ownership checks.
- Payment initiation requires Paymob env vars; without them it will fail at runtime.
- Recruiter search is currently basic title matching; JSONB deep search is not implemented.
