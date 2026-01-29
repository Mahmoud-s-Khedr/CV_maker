# CV/Resume Maker (Drag-and-Drop Editor)

**Description:** A professional resume builder with modern templates. The core challenge here is "WYSIWYG" (What You See Is What You Get) document editing that translates perfectly to a PDF.

**Expected MVP Development Time:** 2-3 Weeks

---

## 1. Drag-and-Drop Section Editor

### Why it is important
Users want to reorder their "Experience" above "Education" instantly.
*   **UX:** Seamless reordering without page reloads.

### How to implement
*   **Library:** **dnd-kit** (modern, accessible replacement for `react-beautiful-dnd`).
*   **Structure:**
    *   `ProfileData` (State object).
    *   `LayoutConfig` (Array of section IDs: `['header', 'summary', 'experience', 'education', 'custom-1']`).
    *   **Custom Sections:** Users can add generic "Text + Title" sections (e.g., "Volunteering", "Publications") which are treated exactly like standard sections.
    *   Rendering: Map over `LayoutConfig` to render components in order.

## 2. Real-Time Preview & PDF Generation

### Why it is important
The PDF *must* look exactly like the web preview.
*   **Challenge:** Browsers and PDF engines render fonts/margins differently.

### How to implement
*   **Strategy: Client-Side Rendering (The Modern Way).**
    *   Use **React-PDF** to render the *preview itself* inside a canvas or iframe on the web page.
    *   This ensures the "Web View" and "Download" are using the exact same rendering engine.
    *   Avoids HTML-to-PDF conversion artifacts (like page breaks cutting lines of text in half).

## 3. ATS Optimization Tips (AI Analysis)

### Why it is important
Applicant Tracking Systems (ATS) reject resumes before a human sees them.
*   **Value:** Helping users beat the bot is a huge selling point.

### How to implement
*   **Heuristics:**
    *   Count keywords: "Did you mention 'Leadership'?"
    *   Format check: "Avoid using columns or graphics that confuse parsers."
*   **AI Integration:**
    *   Send the resume text to an LLM (via OpenRouter) with a prompt: "Rate this resume for a Senior Developer role and suggest improvements."
    *   Display the feedback in a sidebar.

## 4. LinkedIn Profile Import

### Why it is important
Filling out forms is boring.
*   **Friction:** Import saves the user 30 minutes of typing.

### How to implement
*   **Option A: PDF Import (Recommended MVP)**
    *   **Workflow:** User exports "Profile to PDF" from LinkedIn -> Uploads to App -> PDF Parsed -> LLM structured data.
    *   *Pros:* 100% safe, no risk of IP bans, extremely easy to implement (`pdf-parse`).
    *   *Cons:* Added friction (download/upload).
*   **Option B: Chrome Extension (High Effort / Best UX)**
    *   **Workflow:** User installs extension -> Extension reads DOM on LinkedIn profile -> Sends JSON to App.
    *   *Pros:* Magical "One Click" experience.
    *   *Cons:* Requires maintaining a separate codebase; DOM selectors break when LinkedIn updates UI.
*   **Why NOT Server-Side Scraping?**
    *   LinkedIn aggressively bans IPs (Puppeteer/Selenium).
    *   Strict Auth-Walls (Cat and Mouse game).
    *   Legal risks (Cease & Desist letters are common).

## 5. Multiple Templates & Custom Branding

### Why it is important
Different industries need different looks (Creative validation vs Corporate standard).

### How to implement
*   **Theming Engine:**
    *   CSS Variables for everything: `var(--font-heading)`, `var(--primary-color)`, `var(--spacing-unit)`.
    *   Templates are just different CSS files applied to the same HTML structure (if using HTML-to-PDF) or different render functions (if using React-PDF).

## 6. Version History

### Why it is important
Users tailor resumes for specific jobs (e.g., "Google Resume" vs "Startup Resume").

### How to implement
*   **Delta Storage:**
    *   Don't store the full JSON every autosave.
    *   Use a tool like **immer** patches to store changes.
*   **Forking:** Allow users to "Duplicate" a resume to branch off a new version.

---

## 7. Pros, Cons & Market Strategy

### Pros
*   **High Demand:** Everyone needs a resume; constant market churn of job seekers creates a perpetual user base.
*   **Viral Potential:** Users share good-looking resumes, acting as organic marketing.
*   **Recurring Revenue:** Premium features (AI analysis, custom domains, hosting) fit a subscription model well.

### Cons
*   **Market Saturation:** Highly competitive space with established giants (Canva, Resume.io, Novoresume).
*   **High Churn:** Users tend to cancel subscriptions immediately after securing a job.
*   **Technical Complexity:** PDF rendering inconsistencies across devices/browsers are a major headache.

### How to Compete in the Market
*   **Niche Focus:** Don't build a generic builder. Target specific industries (e.g., "Resume Builder for Developers" with GitHub/LeetCode integration).
*   **AI Superiority:** Go beyond basic grammar checks. Offer "roast my resume" or role-specific tailoring (e.g., "rewrite this for a Senior React dev role").
*   **Freemium Model:** Offer a generous free tier (watermarked or limited downloads) to capture the top of the funnel.
*   **Alternative Pricing:** Counter subscription fatigue by offering "Pay per download" or "Lifetime access" for a higher fee.

---

## 8. Market Comparison

### vs. Canva
*   **Canva:** Great for design, but terrible for ATS. Resumes are often exported as images or messy PDFs that robots can't read.
*   **This Project:** Uses **React-PDF** to generate semantic, selectable, text-based PDFs that pass every ATS check while still looking good.

### vs. Resume.io / Zety
*   **Competitors:** "Free" to build, but you hit a paywall the moment you try to download. Subscription traps are common.
*   **This Project:** Transparent model. "Dev-First" approach means you can potentially host it yourself or pay a simple fee for premium templates without hidden subscriptions.

### vs. Novoresume
*   **Novoresume:** Excellent quality but very restrictive free tier (one page only).
*   **This Project:** Optimized for multi-page technical resumes (essential for senior roles).

### Competitive Advantage
*   **Open Source Core:** Trust factor for developers who don't want their data held hostage.
*   **Developer-Centric:** Markdown support, GitHub import, and a focus on clean, technical layouts rather than overly decorative fluff.

---

## Recommended Tech Stack

*   **Frontend:** React, dnd-kit (Drag & Drop), React-Hook-Form.
*   **PDF Engine:** React-PDF (rendering), @react-pdf/renderer.
*   **Backend:** Node.js (Express) - mostly for CRUD and AI proxying.
*   **Database:** PostgreSQL (JSONB column highly recommended for flexible resume structures).
*   **AI:** OpenRouter (OpenAI-compatible API) - optimizing for cost.
*   **Payments:** Paymob (Egypt/MENA region support) with Stripe as fallback.
*   **Email:** Resend (for transactional emails like verification).

---

## 9. Project Roadmap

### Phase 1: The Editor (MVP Core) - Weeks 1-2 ✅ COMPLETED
*   **Goal:** A working drag-and-drop editor that modifies local state.
*   **Tasks:**
    *   [x] Initialize Repo (React + Vite + Tailwind).
    *   [x] Build `ResumeState` (Zustand + Immer) to hold profile data.
    *   [x] Create `SortableSection` components using **dnd-kit**.
    *   [x] Build basic forms for Personal Info, Experience, and Education.

### Phase 2: PDF Perfection - Week 3 ✅ COMPLETED
*   **Goal:** What you see is actually what you get.
*   **Tasks:**
    *   [x] Integrate **@react-pdf/renderer**.
    *   [x] Create a reusable `PDFDocument` component.
    *   [x] Implement `PDFViewer` for the real-time split-screen preview.
    *   [x] **Crucial:** Match the HTML preview CSS exactly to the PDF styles.

### Phase 3: Smart Features - Week 4 ✅ COMPLETED
*   **Goal:** Differentiation and "Wow" factor.
*   **Tasks:**
    *   [x] Implement **LinkedIn Import** (Upload PDF -> Parse -> Fill State).
    *   [x] Add **AI Analysis** button (Send state to AI -> specific critiques).
    *   [x] Create 3 distinct templates (Modern, Minimalist, Standard).

### Phase 4: Launch & Polish - Week 5 ✅ COMPLETED
*   **Goal:** Ready for users.
*   **Tasks:**
    *   [x] Landing Page (Hero section, Features, Pricing CTA).
    *   [x] Custom Authentication (Email/Password + Google OAuth).
    *   [x] Email verification system using Resend.
    *   [x] Paymob Checkout integration (for Egyptian/MENA market).
    *   [x] Docker Compose setup for deployment.
    *   [x] Protected routes and user session management.

### Phase 5: Post-Launch (Future)
*   **Goal:** Scale and enhance.
*   **Tasks:**
    *   [ ] Stripe integration for international payments.
    *   [ ] Resume version history with undo/redo.
    *   [ ] Public resume sharing with custom URLs.
    *   [ ] Additional templates and theming options.
    *   [ ] Deploy to Vercel/Netlify (frontend) + Railway/Render (backend).
