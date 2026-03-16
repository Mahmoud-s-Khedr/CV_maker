# Project Architecture & Technical Stack

## 1. High-Level Architecture (Current Implementation)
The HandisCV is a **client-side first** app.

- The browser owns the **single source of truth** resume state (Zustand + Immer).
- The backend is primarily:
    - persistence for resume JSON (`Resume.content` JSONB)
    - authentication + RBAC
    - AI proxy (OpenRouter)
    - payments (Paymob)
    - template config storage (dynamic templates)

```mermaid
graph TD
        subgraph Browser[Client (React + Vite)]
                User[User Input] --> Store[Zustand + Immer Resume Store]
                Store --> Editor[Editor UI + dnd-kit]
                Store -->|debounce ~500ms| PDFDoc[@react-pdf/renderer Document]
                PDFDoc -->|usePDF -> Blob URL| Blob[(blob:...)]
                Blob --> Viewer[react-pdf Viewer (pdf.js)]

                Store -->|POST /api/ai/analyze| AIEndpoint
                Store -->|POST /api/resumes| Save
                Store -->|PATCH /api/resumes/:id| Update
                Editor -->|Upload PDF| ImportLinkedIn[POST /api/import/linkedin]
                Editor -->|Import repos| ImportGitHub[POST /api/import/github]

                AuthUI[Auth Pages] -->|POST /api/auth/*| AuthAPI
                RecruiterUI[Recruiter Dashboard] -->|GET /api/recruiter/search| RecruiterAPI
                PublicUI[Public Resume View] -->|GET /api/recruiter/public/:shareKey| PublicAPI
                AdminUI[Admin Dashboard] -->|/api/admin/*| AdminAPI
                TemplatesUI[Template Picker] -->|GET /api/templates| TemplatesAPI
        end

        subgraph Server[Server (Express)]
                AuthAPI[/Auth Controller/]
                AIEndpoint[/AI Controller/]
                ImportAPI[/Import Controller/]
                RecruiterAPI[/Recruiter Controller/]
                AdminAPI[/Admin Controller/]
                PaymentAPI[/Payment Controller/]
                TemplatesAPI[/Template Controller/]
                DB[(PostgreSQL + Prisma)]
                Email[Resend Email]
                Paymob[Paymob APIs + Webhook]
                OpenRouter[OpenRouter via OpenAI SDK]
        end

        AuthAPI --> DB
        AuthAPI --> Email
        Save --> DB
        Update --> DB
        RecruiterAPI --> DB
        AdminAPI --> DB
        TemplatesAPI --> DB
        ImportLinkedIn --> ImportAPI --> OpenRouter
        AIEndpoint --> OpenRouter
        PaymentAPI --> Paymob
        PaymentAPI --> DB
```

## 2. Implemented API Surface (Server)
Mounted in `server/src/app.ts`.

### Authentication (`/api/auth`)
- `POST /register` (email/password; role limited to `USER` or `RECRUITER`)
- `POST /login` (blocked if `isEmailVerified=false`; returns `requiresTwoFactor` if 2FA enabled)
- `GET /verify-email?token=...`
- `POST /resend-verification`
- `POST /google` (Google ID token; auto-verifies email)
- `POST /forgot-password`, `POST /reset-password`
- `GET /me` (protected) — returns current user profile; used by browser extension popup

### Two-Factor Authentication (`/api/auth/2fa`) (protected)
- `POST /setup` — generate TOTP secret + QR code URI
- `POST /verify-setup` — confirm setup with first code → enables 2FA
- `POST /disable` — disable with current code
- `POST /validate` — exchange temp JWT + OTP for a full session JWT (called from `/2fa-verify` page)

### Resumes (`/api/resumes`) (protected, ownership enforced)
- `POST /` create resume
- `GET /:id` fetch one
- `PATCH /:id` update resume (auto-versions, generates share key on first public)
- `GET /user/me` list current user's resumes
- `DELETE /:id` delete resume
- `POST /:id/versions`, `GET /:id/versions` — version history
- `POST /:id/review-sessions` — create a collaborative review session
- `GET /:id/review-sessions` — list review sessions

### Review Sessions (`/api/review`) (public — no auth for reviewer)
- `GET /review/:token` — fetch session + resume (validates expiry)
- `POST /review/:token/comments` — add comment
- `PATCH /review/:token/comments/:commentId` — resolve comment

### Import (`/api/import`) (protected)
- `POST /linkedin` (multipart `file`; parses PDF via `pdf-parse` + AI extraction)
- `POST /github` (`{ username }` -> returns public repo data)
- `POST /linkedin-extension` (`{ profileData }` -> maps DOM-scraped data → `ResumeSchema` → creates Resume; used by browser extension)

### AI (`/api/ai`) (protected + requirePremium)
- `POST /analyze` (`{ content }` -> returns `{ score, summary, strengths, weaknesses, suggestions }`)
- `POST /job-fit` (`{ content, jobDescription }` -> tailored fit analysis)

### Templates (`/api/templates`)
- `GET /` list templates (id/name/thumbnail/isPremium)
- `GET /:id` fetch template (includes `config` JSON)

### Job Applications (`/api/jobs`) (protected, ownership enforced)
- `POST /` create application (Zod validated)
- `GET /` list (optional `?status=` filter)
- `GET /stats` aggregated counts by status
- `GET /:id`, `PATCH /:id`, `DELETE /:id`

### Notifications (`/api/notifications`) (protected)
- `GET /preferences` — user notification settings
- `PATCH /preferences` — update boolean preference flags

### Recruiter (`/api/recruiter`)
- `GET /public/:shareKey` public resume fetch (requires `isPublic=true`; increments view count)
- `GET /search?q=...` protected search (`RECRUITER` or `ADMIN`)

### Admin (`/api/admin`) (protected, ADMIN role)
- `GET /users`, `DELETE /users/:id`
- `GET /logs`
- `POST /templates`

### Payment (`/api/payment`)
- `POST /initiate` (protected) — returns `{ paymentKey, frameId }` for Paymob iframe
- `POST /webhook?hmac=...` — validates Paymob HMAC, sets `isPremium=true` on success

## 3. Technology Stack

### Frontend (client/)
- React 19 + Vite + TypeScript
- Tailwind CSS v4
- State: Zustand + Immer
- Drag & drop: `@dnd-kit` (sections in editor + Kanban columns in job tracker)
- PDF generation: `@react-pdf/renderer` (PDF creation) + `react-pdf` (viewer via pdf.js)
- Forms: `react-hook-form`
- Auth UI: `@react-oauth/google`
- Icons: `lucide-react`

### Backend (server/)
- Node.js + Express 5 + TypeScript
- PostgreSQL 15 + Prisma ORM
- Auth: JWT bearer tokens, bcrypt, `otplib` (TOTP), `qrcode`
- Email: Resend (`email.service.ts`)
- AI: OpenAI SDK targeting OpenRouter
- Payments: Paymob (primary), Stripe (service wired, checkout pending)
- Uploads: Multer (memory storage) + `pdf-parse`
- Scheduler: `node-cron` (weekly digest + subscription reminders)
- Validation: Zod + custom `validate` middleware
- Rate limiting: `express-rate-limit`
- Observability: Winston logger + `requestLogger` middleware

### Browser Extension (extension/)
- Manifest V3
- React 19 + Vite + TypeScript (multi-entry build)
- `@types/chrome` for browser extension APIs
- No external UI library — inline styles to keep bundle small
- All API calls proxied through the MV3 service worker (CORS-free)

## 4. Data Model & State Strategy

### Resume Schema (Frontend)
The frontend `ResumeSchema` includes a profile with `jobTitle` and multiple section types.

```ts
type SectionType =
    | 'experience'
    | 'education'
    | 'skills'
    | 'projects'
    | 'certifications'
    | 'languages'
    | 'custom';

type ResumeSchema = {
    meta: {
        templateId: string;
        themeConfig: {
            primaryColor: string;
            fontFamily: string;
            spacing: 'compact' | 'standard' | 'relaxed';
        };
    };
    profile: {
        fullName: string;
        jobTitle: string;
        email: string;
        phone: string;
        location: string;
        url: string;
        summary: string;
    };
    sections: {
        id: string;
        type: SectionType;
        title: string;
        isVisible: boolean;
        columns: number;
        items: any[];
    }[];
};
```

### Rendering Strategy
- The editor writes to the store immediately.
- The PDF pipeline uses a debounced snapshot (currently ~500ms) to avoid heavy re-renders.
- PDF generation uses `usePDF()` to create a Blob URL; preview renders that Blob URL with `react-pdf`.

### Template Strategy (Hybrid)
- “Standard templates” are shipped as React components (standard/modern/minimalist/professional/executive/creative).
- “Dynamic templates” are stored in the DB as JSON (`Template.config`) and rendered by `DynamicTemplateRenderer`.

## 5. Security & Operational Notes
- HTTP headers: Helmet
- CORS: configured via `CORS_ORIGINS` env var (comma-separated list)
- Request logging: `requestLogger` logs each request + duration
- Global error handler: logs error context and returns `500`
- Rate limiting: `authLimiter` (10 req/15 min on auth routes), `aiLimiter` (20 req/hr on AI routes), `generalLimiter` (100 req/min global)
- Input validation: Zod schemas on all mutation endpoints via `validate` middleware
- Ownership enforcement: all resume + job + review endpoints verify `resource.userId === req.user.userId`
- 2FA: TOTP via `otplib`; login issues a short-lived `purpose:'2fa'` JWT before issuing a full session token
- Cryptographic share keys: `crypto.randomBytes(8).toString('base64url')` (11 chars)

## 6. Browser Extension Security Notes
- The extension stores the user's JWT in `chrome.storage.local` (sandboxed to the extension, not accessible to web pages).
- All HTTP requests originate from the MV3 service worker — they never touch LinkedIn's API.
- The extension only reads the visible DOM; no LinkedIn credentials or cookies are read.
- The JWT expires at the same time as a normal web session; the extension prompts the user to refresh it from the Settings page.
