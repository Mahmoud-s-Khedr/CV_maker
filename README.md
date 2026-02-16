# HandisCV - Professional Resume Builder

A powerful, developer-friendly resume builder featuring a WYSIWYG drag-and-drop editor, real-time PDF preview, AI-powered analysis, and professional templates. Designed to solve the "what you see is what you get" problem in resume creation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## Key Features

-   **Drag-and-Drop Editor**: Seamlessly reorder sections (Experience, Education, Skills) using `dnd-kit`.
-   **Real-Time PDF Preview**: Instant split-screen preview using `@react-pdf/renderer` ensuring the download looks exactly like the preview.
-   **AI Resume Analysis** (Premium): Integrated AI (via OpenRouter) to score resumes, suggest improvements, and analyze job fit.
-   **Smart Imports**:
    -   **LinkedIn**: Parse PDF profiles to auto-fill resume data.
    -   **GitHub**: Import public repositories directly into the Projects section.
-   **Template System**: 6 built-in templates + 7 seeded dynamic templates (including premium). Visual template picker panel with lock icons for premium-only templates.
-   **Multi-Format Export**: Download resumes as PDF, JSON (data portability), or Plain Text (ATS-friendly).
-   **Resume Versioning**: Automatically saves history on every update (capped at 20 versions), with a History panel to browse and restore previous versions.
-   **Public Sharing & Analytics**: Generate unique shareable links with cryptographically secure keys. Track view count and last viewed time per resume.
-   **Role-Based Access**:
    -   **User**: Create, edit, export, and share resumes.
    -   **Recruiter**: Search for public candidates and view profiles.
    -   **Admin**: Manage users, templates, and view system analytics.
-   **Premium Feature Gating**: Paymob payment integration with `requirePremium` middleware. AI analysis and premium templates are gated behind subscription.
-   **Security**: JWT authentication on all API routes, ownership checks, Zod input validation, rate limiting (`express-rate-limit`), and cryptographic share keys.
-   **Password Reset**: Full forgot-password / reset-password flow with email via Resend.
-   **Mobile Responsive**: Edit/Preview toggle on mobile, responsive dashboard and landing page.
-   **Error Handling**: Global error boundary, auto-save indicator (Saving/Saved), and loading skeletons.

## Technology Stack

### Frontend
-   **Framework**: React 19 + Vite
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **State Management**: Zustand + Immer
-   **PDF Engine**: `@react-pdf/renderer` & `react-pdf`
-   **Drag & Drop**: `dnd-kit`

### Backend
-   **Runtime**: Node.js + Express 5
-   **Database**: PostgreSQL 15 + Prisma ORM
-   **Authentication**: JWT-based (Custom + Google OAuth)
-   **AI Integration**: OpenAI SDK (targeting OpenRouter)
-   **Validation**: Zod
-   **Rate Limiting**: express-rate-limit
-   **Email**: Resend
-   **Payments**: Paymob

## Project Structure

```
.
├── AI_DOCS/             # Project documentation & architecture notes
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components (editor, pdf, forms)
│   │   ├── pages/       # Route pages (Editor, Dashboard, Auth, etc.)
│   │   ├── store/       # Zustand state management (auth, resume)
│   │   ├── lib/         # API client, export utilities
│   │   └── types/       # TypeScript definitions (resume, template)
├── server/              # Node.js Express backend
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic (AI, Payment, etc.)
│   │   ├── middleware/   # Auth, rate limiting, validation
│   │   └── validation/  # Zod schemas
│   └── prisma/          # Database schema, migrations, and seed
├── docker-compose.yml   # Container orchestration
└── nginx/               # Nginx configuration for deployment
```

## Getting Started

### Prerequisites
-   Node.js 18+
-   Docker & Docker Compose (for database/local dev simplicity)
-   PostgreSQL (if running locally without Docker)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/cv-maker.git
    cd cv-maker
    ```

2.  **Environment Setup**
    Create a `.env` file in both `client/` and `server/` directories based on the provided examples or architecture docs. Key variables include:
    -   `DATABASE_URL`
    -   `JWT_SECRET`
    -   `OPENROUTER_API_KEY` (for AI features)
    -   `PAYMOB_API_KEY` (for payments)
    -   `RESEND_API_KEY` (for emails)

3.  **Run with Docker (Recommended for complete stack)**
    ```bash
    docker-compose up --build
    ```
    This will start the Postgres database, Backend API, and Frontend.

4.  **Run Locally (Manual)**

    *Server:*
    ```bash
    cd server
    npm install
    npx prisma migrate dev
    npx prisma db seed
    npm run dev
    ```

    *Client:*
    ```bash
    cd client
    npm install
    npm run dev
    ```

## API Overview

| Endpoint Group | Base Path | Auth Required | Description |
|---|---|---|---|
| Auth | `/api/auth` | No | Register, login, Google OAuth, password reset |
| Resumes | `/api/resumes` | Yes | CRUD operations, versioning |
| AI | `/api/ai` | Yes + Premium | Resume analysis, job fit scoring |
| Import | `/api/import` | Yes | LinkedIn PDF, GitHub repos |
| Templates | `/api/templates` | No | List and view templates |
| Admin | `/api/admin` | Yes (Admin) | User management, template CRUD, audit logs |
| Recruiter | `/api/recruiter` | Mixed | Public resume view (no auth), search (auth) |
| Payment | `/api/payment` | Yes | Initiate Paymob payment, webhook |

## Documentation

-   `AI_DOCS/` — Architecture notes and project documentation
-   `CHANGES.md` — Detailed changelog with deployment guide
-   `ROADMAP.md` — Future feature ideas organized by priority

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
