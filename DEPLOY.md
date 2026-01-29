# Deployment Guide

## 1. Prerequisites
- **GitHub Repository**: Push your code to a GitHub repository.
- **Accounts**:
  - [Vercel](https://vercel.com) (Frontend)
  - [Render](https://render.com) or [Railway](https://railway.app) (Backend & Database)
  - [Google Cloud Console](https://console.cloud.google.com) (Auth)
  - [Paymob](https://paymob.com) (Payments)

## 2. Backend Deployment (Render.com)

1.  **Create a PostgreSQL Database** on Render.
    - Copy the `Internal Database URL`.
2.  **Create a Web Service** on Render.
    - **Repo**: Connect your GitHub repo.
    - **Root Directory**: `server`
    - **Build Command**: `npm install && npx prisma generate && npm run build`
    - **Start Command**: `npm start`
    - **Environment Variables**:
        - `DATABASE_URL`: (Paste your Render Connection String)
        - `PORT`: `4000`
        - `JWT_SECRET`: (Generate a strong random string)
        - `GOOGLE_CLIENT_ID`: (From Google Cloud)
        - `RESEND_API_KEY`: (From Resend Dashboard)
        - `FROM_EMAIL`: (Your verified sender email, e.g., `noreply@yourdomain.com`)
        - `APP_URL`: (Your frontend URL, e.g., `https://cvmaker.vercel.app`)
        - `PAYMOB_API_KEY`: (From Paymob)
        - `PAYMOB_INTEGRATION_ID`: (From Paymob)
        - `PAYMOB_FRAME_ID`: (From Paymob)
        - `OPENROUTER_API_KEY`: (From OpenRouter)

## 3. Frontend Deployment (Vercel)

1.  **Import Project** on Vercel.
2.  **Root Directory**: `client`
    - Vercel automatically detects Vite.
3.  **Environment Variables**:
    - `VITE_GOOGLE_CLIENT_ID`: (Same as backend)
4.  **Deploy**.

## 4. Post-Deployment Configuration

1.  **Update Client URL in Backend**:
    - If you add CORS, whitelist your Vercel domain in `server/src/app.ts`.
2.  **Update API URL in Frontend**:
    - In `client/src/lib/api.ts`, change `API_URL` to your Render backend URL (e.g., `https://cv-maker-api.onrender.com/api`).
    - *Pro Tip*: Use `import.meta.env.VITE_API_URL` in checking production.

## 5. Paymob Callbacks
- In Paymob Dashboard > Integration Settings, set the **Transaction Processed Callback** to:
  `https://your-backend-url.onrender.com/api/payment/webhook`

## 6. Google Auth Redirects
- In Google Cloud Console, add your Vercel URL to **Authorized JavaScript origins**.

## 7. Local Docker Deployment (Testing)

You can run the entire stack locally using Docker Compose, simulating a production environment.

1.  **Create `.env` file** in the root directory (or use `.env` in `docker-compose.yml` directly if you prefer).
    - Ensure variables like `GOOGLE_CLIENT_ID`, `PAYMOB_API_KEY` etc. are set in your shell or `.env`.

2.  **Run Docker Compose**:
    ```bash
    docker-compose up --build
    ```

3.  **Access Application**:
    - Frontend: `http://localhost`
    - Backend: `http://localhost:4000`
    - Database: `postgres://user:password@localhost:5432/cvmaker`

4.  **Important Note for Client**:
    - Since the Client is built into static files, environment variables like `VITE_GOOGLE_CLIENT_ID` are **baked in at build time**.
    - If you change these variables, you must rebuild the image: `docker-compose up --build client`.
    - Also, for `API_URL` within the Docker network, the browser still accesses the API from the **host** perspective (localhost:4000), so the default `localhost:4000` config in `api.ts` works fine for this local setup.

