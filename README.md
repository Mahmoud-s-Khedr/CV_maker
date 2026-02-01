# HandisCV - Professional Resume Builder

A powerful, developer-friendly resume builder featuring a WYSIWYG drag-and-drop editor, real-time PDF preview, AI-powered analysis, and professional templates. Designed to solve the "what you see is what you get" problem in resume creation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

## 🚀 Key Features

-   **Drag-and-Drop Editor**: Seamlessly reorder sections (Experience, Education, Skills) using `dnd-kit`.
-   **Real-Time PDF Preview**: Instant split-screen preview using `@react-pdf/renderer` ensuring the download looks exactly like the preview.
-   **AI Resume Analysis**: Integrated AI (via OpenRouter) to score resumes and suggest improvements for ATS optimization.
-   **Smart Imports**:
    -   **LinkedIn**: Parse PDF profiles to auto-fill resume data.
    -   **GitHub**: Import public repositories directly into the Projects section.
-   **Dynamic Templates**: Choose from standard, modern, and minimalist templates, or create custom ones via the Admin Dashboard.
-   **Resume Versioning**: Automatically saves history, allowing users to revert to previous versions.
-   **Role-Based Access**:
    -   **User**: Create, edit, and download resumes.
    -   **Recruiter**: Search for public candidates and view profiles.
    -   **Admin**: Manage users, templates, and view system analytics.
-   **Public Sharing**: Generate unique shareable links for resumes.
-   **Payments**: Integrated Paymob for premium features.

## 🛠️ Technology Stack

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
-   **Email**: Resend
-   **Payments**: Paymob

## 📂 Project Structure

```
.
├── AI_DOCS/             # Project documentation & architecture notes
├── client/              # React frontend application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route pages (Editor, Dashboard, etc.)
│   │   ├── store/       # Zustand state management
│   │   └── types/       # TypeScript definitions
├── server/              # Node.js Express backend
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API route definitions
│   │   └── services/    # Business logic (AI, Payment, etc.)
│   └── prisma/          # Database schema and migrations
├── docker-compose.yml   # Container orchestration
└── nginx/               # Nginx configuration for deployment
```

## ⚡ Getting Started

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
    -   `OPENROUTER_API_KEY`
    -   `PAYMOB_API_KEY`

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
    npm run dev
    ```

    *Client:*
    ```bash
    cd client
    npm install
    npm run dev
    ```

## 📖 Documentation
Detailed documentation on architecture, database schema, and future features can be found in the `AI_DOCS` directory.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
