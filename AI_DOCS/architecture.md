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
- `POST /login` (blocked if `isEmailVerified=false`)
- `GET /verify-email?token=...`
- `POST /resend-verification`
- `POST /google` (Google ID token; auto-verifies email)

### Resumes (`/api/resumes`)
- `POST /` create resume (currently expects `userId` in body)
- `GET /:id` fetch one
- `PATCH /:id` update resume
    - auto-creates a `ResumeVersion` snapshot before updating
    - if `isPublic=true` and no `shareKey`, generates a share key
- `GET /user/:userId` list resumes by user (currently via URL param)
- `DELETE /:id` delete resume
- `POST /:id/versions` create version (expects `{ content }`)
- `GET /:id/versions` list versions

> Note: resume routes are not currently protected by `authenticate` middleware (there are TODOs in the controllers). This is the current state, not the intended final security posture.

### Import (`/api/import`)
- `POST /linkedin` (multipart `file`; parses PDF text via `pdf-parse`, then uses AI to extract profile fields)
- `POST /github` (`{ username }` -> returns public repo data)

### AI (`/api/ai`)
- `POST /analyze` (`{ content }` -> returns analysis JSON)

### Templates (`/api/templates`)
- `GET /` list templates (id/name/thumbnail/isPremium)
- `GET /:id` fetch template (includes `config` JSON)

### Recruiter (`/api/recruiter`)
- `GET /public/:shareKey` public resume fetch (requires `isPublic=true`)
- `GET /search?q=...` protected search (`RECRUITER` or `ADMIN`)
    - current implementation is a basic `title contains` search
    - response is a “preview” object derived from `Resume.content.profile`

### Admin (`/api/admin`) (protected)
All routes require `authenticate` + `authorize(['ADMIN'])`.

- `GET /users` list users
- `DELETE /users/:id` delete a user
- `GET /logs` audit log list
- `POST /templates` create a template (writes to `Template`)

### Payment (`/api/payment`)
- `POST /initiate` protected (JWT required)
    - returns `{ paymentKey, frameId }` for Paymob iframe
- `POST /webhook?hmac=...` validates Paymob HMAC, upgrades user to `isPremium=true` on success

## 3. Technology Stack (as in `package.json`)

### Frontend
- React 19 + Vite
- TypeScript
- Tailwind CSS
- State: Zustand + Immer
- Drag & drop: dnd-kit
- PDF generation: `@react-pdf/renderer` (PDF creation) + `react-pdf` (viewer via pdf.js)
- Auth UI: `@react-oauth/google`

### Backend
- Node.js + Express 5
- PostgreSQL 15 + Prisma
- Auth: JWT bearer tokens (`Authorization: Bearer <token>`)
- Email: Resend
- AI: OpenAI SDK targeting OpenRouter
- Payments: Paymob
- Uploads: Multer (memory storage) + `pdf-parse`
- Observability: request logging middleware + Winston logger

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
- CORS: configured via `CORS_ORIGINS` env var
- Request logging: `requestLogger` logs each request + duration
- Global error handler: logs error context and returns `500`
