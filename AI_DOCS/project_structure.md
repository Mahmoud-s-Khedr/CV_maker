# Project Structure

The project follows a **Monorepo-style** structure with the Frontend and Backend as distinct but co-located packages, orchestrated via Docker Compose for deployment.

```text
/
├── client/                     # Frontend: React + Vite + TypeScript
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx     # Auth guard for protected pages
│   │   │   ├── editor/                # Interactive Form Components
│   │   │   │   ├── AnalysisPanel.tsx  # AI feedback display
│   │   │   │   ├── ResumeEditor.tsx   # Main split-screen editor
│   │   │   │   ├── SortableSection.tsx # dnd-kit wrapper
│   │   │   │   └── forms/             # React-Hook-Form inputs
│   │   │   ├── pdf/                   # @react-pdf/renderer Components
│   │   │   │   ├── ResumeDocument.tsx # Root PDF Document
│   │   │   │   └── templates/         # Resume Templates
│   │   │   │       ├── ModernTemplate.tsx
│   │   │   │       ├── MinimalistTemplate.tsx
│   │   │   │       └── StandardTemplate.tsx
│   │   │   ├── preview/               # PDF Viewer / Split Screen
│   │   │   └── ui/                    # Shared UI (Buttons, Modals)
│   │   ├── hooks/
│   │   │   └── useDebounce.ts         # Performance optimization for Preview
│   │   ├── lib/
│   │   │   └── api.ts                 # Axios/Fetch integration
│   │   ├── pages/
│   │   │   ├── AuthPage.tsx           # Login/Register forms
│   │   │   ├── LandingPage.tsx        # Marketing homepage
│   │   │   ├── PaymentPage.tsx        # Paymob checkout flow
│   │   │   └── VerifyEmailPage.tsx    # Email verification handler
│   │   ├── store/
│   │   │   └── resume.ts              # Zustand + Immer (Single Source of Truth)
│   │   ├── types/
│   │   │   └── resume.ts              # Shared Resume Interfaces
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
│   │   └── schema.prisma       # Database Schema (JSONB definition)
│   ├── src/
│   │   ├── config/
│   │   │   └── config.ts       # Env variables (OpenRouter, Paymob, JWT, etc.)
│   │   ├── controllers/
│   │   │   ├── ai.controller.ts       # AI resume analysis endpoint
│   │   │   ├── auth.controller.ts     # Login, Register, Google OAuth, Verify
│   │   │   ├── import.controller.ts   # LinkedIn PDF import
│   │   │   ├── payment.controller.ts  # Paymob integration
│   │   │   └── resume.controller.ts   # CRUD for resumes
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts     # JWT verification
│   │   ├── routes/
│   │   │   ├── ai.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── import.routes.ts
│   │   │   ├── payment.routes.ts
│   │   │   └── resume.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts          # OpenRouter/OpenAI integration
│   │   │   ├── email.service.ts       # Resend transactional emails
│   │   │   ├── paymob.service.ts      # Paymob payment gateway
│   │   │   ├── pdf-parser.service.ts  # LinkedIn PDF extraction
│   │   │   └── resume.service.ts      # Resume business logic
│   │   └── app.ts                     # Express App Entry
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── AI_DOCS/                    # Project Documentation
│   ├── idea.md                 # Project vision and roadmap
│   ├── architecture.md         # Technical architecture
│   ├── database_schema.md      # Database design
│   ├── preview_performance.md  # PDF preview optimization
│   └── project_structure.md    # This file
│
├── docker-compose.yml          # Orchestration: PostgreSQL + Server + Client
└── DEPLOY.md                   # Deployment instructions
```

## Key Organization Principles

1.  **Separation of Concerns:** `client/components/editor` is for *input*, `client/components/pdf` is for *output*. They never import each other directly; they only communicate via the `Zustand Store`.

2.  **Template System:** Each PDF template (`ModernTemplate`, `MinimalistTemplate`, `StandardTemplate`) is a self-contained component that receives the `ResumeSchema` and renders it using React-PDF primitives.

3.  **Service Layer Pattern:** The backend uses a Service layer (e.g., `ai.service.ts`, `paymob.service.ts`) so we can easily swap providers if needed without rewriting controllers.

4.  **Authentication Flow:**
    *   `auth.controller.ts` handles registration, login, email verification, and Google OAuth.
    *   `auth.middleware.ts` validates JWT tokens for protected routes.
    *   `ProtectedRoute.tsx` guards client-side routes.

5.  **Payment Integration:**
    *   `paymob.service.ts` handles token generation and payment initiation.
    *   `payment.controller.ts` manages checkout and webhook callbacks.

## Docker Compose Services

```yaml
services:
  postgres:     # PostgreSQL 15 database
  server:       # Express backend (port 4000)
  client:       # Nginx serving React build (port 80)
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
PAYMOB_API_KEY=...
PAYMOB_INTEGRATION_ID=...
PAYMOB_FRAME_ID=...
RESEND_API_KEY=...
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```env
VITE_API_URL=http://localhost:4000
VITE_GOOGLE_CLIENT_ID=...
```
