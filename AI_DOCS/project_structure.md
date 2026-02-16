# Project Structure

The project follows a **Monorepo-style** structure with the Frontend and Backend as distinct but co-located packages, orchestrated via Docker Compose for deployment.

```text
/
├── client/                     # Frontend: React + Vite + TypeScript
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ErrorBoundary.tsx      # Top-level React error boundary
│   │   │   ├── ProtectedRoute.tsx     # Auth guard for protected pages
│   │   │   ├── UpgradeModal.tsx       # Premium upsell modal
│   │   │   ├── editor/                # Interactive Form Components
│   │   │   │   ├── AnalysisPanel.tsx  # AI feedback display
│   │   │   │   ├── CompletenessScore.tsx # Profile strength circular indicator
│   │   │   │   ├── ResumeEditor.tsx   # Main split-screen editor
│   │   │   │   ├── ReviewPanel.tsx    # Owner: review comments sidebar
│   │   │   │   ├── SortableSection.tsx # dnd-kit wrapper
│   │   │   │   ├── TemplatePicker.tsx  # Visual template selection panel
│   │   │   │   └── forms/             # React-Hook-Form inputs
│   │   │   ├── jobs/                  # Job Tracker components
│   │   │   │   ├── JobKanban.tsx      # @dnd-kit Kanban board
│   │   │   │   └── JobTable.tsx       # Table view
│   │   │   ├── layout/
│   │   │   │   └── AuthenticatedLayout.tsx # Sidebar nav + outlet
│   │   │   ├── pdf/                   # @react-pdf/renderer Components
│   │   │   │   ├── DynamicTemplateRenderer.tsx # JSON-based template engine
│   │   │   │   ├── ResumeDocument.tsx # Root PDF Document
│   │   │   │   └── templates/         # Static Templates
│   │   │   │       ├── ModernTemplate.tsx
│   │   │   │       ├── MinimalistTemplate.tsx
│   │   │   │       └── StandardTemplate.tsx
│   │   │   ├── preview/               # PDF Viewer / Split Screen
│   │   │   ├── settings/
│   │   │   │   ├── NotificationSettings.tsx # Email pref toggles
│   │   │   │   └── TwoFactorSetup.tsx        # QR code + enable/disable 2FA
│   │   │   └── ui/                    # Shared UI (Buttons, Modals)
│   │   ├── hooks/
│   │   │   └── useDebounce.ts         # Performance optimization for Preview
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios instance + typed API helpers
│   │   │   ├── completeness.ts        # 12-rule profile completeness scorer
│   │   │   └── export.ts              # JSON + Plain Text export helpers
│   │   ├── pages/
│   │   │   ├── AccountSettingsPage.tsx # 2FA, notifications, extension token
│   │   │   ├── AdminDashboard.tsx     # Admin Stats & Template Management
│   │   │   ├── AuthPage.tsx           # Login/Register forms
│   │   │   ├── DashboardPage.tsx      # User's Resume List
│   │   │   ├── ForgotPasswordPage.tsx # Forgot-password email form
│   │   │   ├── JobTrackerPage.tsx     # Kanban + table job application tracker
│   │   │   ├── LandingPage.tsx        # Marketing homepage
│   │   │   ├── PaymentPage.tsx        # Paymob checkout flow
│   │   │   ├── PaymentSuccessPage.tsx # Post-payment confirmation
│   │   │   ├── PublicResume.tsx       # Shareable resume view
│   │   │   ├── RecruiterDashboard.tsx # Recruiter Search Portal
│   │   │   ├── ResetPasswordPage.tsx  # Reset-password form (reads ?token=)
│   │   │   ├── ReviewPage.tsx         # Public reviewer UI (no auth required)
│   │   │   ├── TwoFactorPage.tsx      # 6-digit OTP entry at login
│   │   │   └── VerifyEmailPage.tsx    # Email verification handler
│   │   ├── store/
│   │   │   ├── auth.ts                # Auth state (token + user) persisted
│   │   │   ├── job.ts                 # Job applications (Zustand + immer)
│   │   │   └── resume.ts              # Resume state (Zustand + Immer)
│   │   ├── types/
│   │   │   ├── job.ts                 # JobApplication, JobStatus, CreateJobInput
│   │   │   └── resume.ts              # Shared Resume Interfaces (ResumeSchema)
│   │   ├── App.tsx                    # Router configuration
│   │   └── main.tsx
│   ├── Dockerfile                     # Production build with nginx
│   ├── nginx.conf                     # Nginx config for SPA routing
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── server/                     # Backend: Node.js + Express + TypeScript
│   ├── prisma/
│   │   ├── migrations/         # Database migrations
│   │   ├── seed.ts             # Seeder: admin user + 7 templates
│   │   └── schema.prisma       # Database Schema (JSONB + all models)
│   ├── src/
│   │   ├── config/
│   │   │   └── config.ts       # Env variables (OpenRouter, Paymob, JWT, etc.)
│   │   ├── controllers/
│   │   │   ├── admin.controller.ts    # Admin stats & validation
│   │   │   ├── ai.controller.ts       # AI resume analysis endpoint
│   │   │   ├── auth.controller.ts     # Login, Register, Google OAuth, 2FA, getMe
│   │   │   ├── import.controller.ts   # LinkedIn PDF + extension + GitHub import
│   │   │   ├── job.controller.ts      # Job application CRUD
│   │   │   ├── notification.controller.ts # Notification preferences CRUD
│   │   │   ├── payment.controller.ts  # Paymob + Stripe integration
│   │   │   ├── recruiter.controller.ts # Resume search logic
│   │   │   ├── resume.controller.ts   # CRUD for resumes
│   │   │   ├── review.controller.ts   # Review sessions + public comments
│   │   │   ├── template.controller.ts # Dynamic template management
│   │   │   └── twofa.controller.ts    # 2FA setup / verify / disable / validate
│   │   ├── jobs/
│   │   │   └── scheduler.ts    # node-cron: weekly digest + subscription reminders
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts     # JWT verification + RBAC + requirePremium
│   │   │   ├── rateLimiter.ts         # aiLimiter / authLimiter / generalLimiter
│   │   │   ├── requestLogger.ts       # Request timing + logging
│   │   │   └── validate.ts            # Generic Zod validation middleware
│   │   ├── routes/
│   │   │   ├── ai.routes.ts
│   │   │   ├── auth.routes.ts         # Includes GET /me
│   │   │   ├── import.routes.ts       # Includes POST /linkedin-extension
│   │   │   ├── job.routes.ts
│   │   │   ├── notification.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   ├── resume.routes.ts
│   │   │   ├── recruiter.routes.ts
│   │   │   ├── review.routes.ts
│   │   │   ├── template.routes.ts
│   │   │   ├── twofa.routes.ts
│   │   │   └── admin.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts          # OpenRouter/OpenAI integration
│   │   │   ├── email.service.ts       # Resend transactional emails
│   │   │   ├── github.service.ts      # GitHub repo import
│   │   │   ├── job.service.ts         # Job application business logic
│   │   │   ├── notification.service.ts # View notifications + digest + reminders
│   │   │   ├── pdf-parser.service.ts  # LinkedIn PDF extraction
│   │   │   ├── resume.service.ts      # Resume business logic + pruning
│   │   │   ├── stripe.service.ts      # Stripe payment gateway
│   │   │   └── totp.service.ts        # TOTP generate / verify / QR code
│   │   ├── utils/
│   │   │   └── logger.ts              # Winston logger helpers
│   │   ├── validation/
│   │   │   ├── ai.schemas.ts
│   │   │   ├── job.schemas.ts
│   │   │   └── resume.schemas.ts
│   │   └── app.ts                     # Express App Entry + route mounting
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── extension/                  # Chrome / Firefox Browser Extension (MV3 + Vite)
│   ├── manifest.json           # MV3 manifest; host_permissions: linkedin.com
│   ├── package.json            # React 19 + Vite + @types/chrome
│   ├── vite.config.ts          # Multi-entry build (popup + SW + 2 content scripts)
│   ├── tsconfig.json
│   ├── background/
│   │   └── service-worker.ts   # Cache scraped data; relay API calls; badge
│   ├── content/
│   │   ├── selectors.ts        # ← ALL LinkedIn DOM selectors isolated here
│   │   ├── linkedin-profile.ts # Content script for /in/* pages
│   │   └── linkedin-job.ts     # Content script for /jobs/view/* pages
│   ├── popup/
│   │   ├── popup.html          # Shell HTML
│   │   ├── index.tsx           # React mount point
│   │   └── App.tsx             # Context-aware UI (auth/profile/job/guide)
│   ├── shared/
│   │   ├── auth.ts             # chrome.storage JWT helpers
│   │   └── types.ts            # LinkedInScrapedProfile, LinkedInJobPayload, etc.
│   └── README.md               # Install + connect + usage instructions
│
├── AI_DOCS/                    # Project Documentation
│   ├── architecture.md         # Technical architecture + API surface
│   ├── backend_features.md     # All backend endpoints
│   ├── browser_extension_plan.md # Extension implementation plan (Sprint 4)
│   ├── database_schema.md      # Database design
│   ├── idea.md                 # Project vision and roadmap
│   ├── mobile_responsiveness_plan.md
│   ├── preview_performance.md  # PDF preview optimization
│   ├── project_structure.md    # This file
│   └── template_authoring.md
│
├── CHANGES.md                  # Sprint-by-sprint change log
├── ROADMAP.md                  # Feature roadmap with completion status
├── docker-compose.yml          # Orchestration: PostgreSQL + Server + Client
└── DEPLOY.md                   # Deployment instructions
```

## Key Organization Principles

1.  **Separation of Concerns:** `client/components/editor` is for *input*, `client/components/pdf` is for *output*. They never import each other directly; they only communicate via the `Zustand Store`.

2.  **Template System (Hybrid):**
  * Built-in templates are shipped as React-PDF components (`standard`, `modern`, `minimalist`, `professional`, `executive`, `creative`).
  * Dynamic templates are stored in the DB (`Template.config`) and rendered by `DynamicTemplateRenderer` when the client has loaded a `dynamicTemplateConfig`.

3.  **Service Layer Pattern:** The backend uses a Service layer (e.g., `ai.service.ts`, `paymob.service.ts`) so we can easily swap providers if needed without rewriting controllers.

4.  **Authentication Flow:**
    *   `auth.controller.ts` handles registration, login, email verification, and Google OAuth.
    *   `auth.middleware.ts` validates JWT tokens for protected routes.
    *   `ProtectedRoute.tsx` guards client-side routes.

5.  **PDF Preview Stack:**
  * `@react-pdf/renderer` generates PDFs via `usePDF()` (Blob URL)
  * `react-pdf` renders the Blob URL for preview (pdf.js)

5.  **Payment Integration:**
    *   `paymob.service.ts` handles token generation and payment initiation.
    *   `payment.controller.ts` manages checkout and webhook callbacks.

## Docker Compose Services

```yaml
services:
  postgres:     # PostgreSQL 15 database
  server:       # Express backend (port 4000)

Note: in this repo, `docker-compose.yml` currently orchestrates `postgres` and `server`. The frontend is typically built to static assets and served via system Nginx (see `DEPLOY.md` and `nginx/cvmaker.conf`).
```

## Environment Variables

### Server (`server/.env`)
```env
DATABASE_URL=postgresql://...
PORT=4000
JWT_SECRET=...
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=...
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_FRAME_ID=...
PAYMOB_HMAC_SECRET=...
RESEND_API_KEY=...
FROM_EMAIL=noreply@...
APP_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
LOG_LEVEL=info
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:4000/api
VITE_GOOGLE_CLIENT_ID=...
```
