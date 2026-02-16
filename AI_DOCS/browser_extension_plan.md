# HandisCV Browser Extension — Implementation Plan

## Overview

A Manifest V3 Chrome extension (with Firefox compatibility) that integrates LinkedIn with HandisCV for two workflows:

1. **Profile → CV**: Scrape the user's own LinkedIn profile and create/update a resume in HandisCV with one click.
2. **Job → Tracker**: Save a LinkedIn job posting directly to the HandisCV Job Tracker without leaving LinkedIn.

This replaces the existing "upload your LinkedIn PDF" workflow with a seamless, zero-friction experience.

---

## Why an Extension (not server-side scraping)

| Approach | Pros | Cons |
|---|---|---|
| PDF upload (current) | Safe, zero maintenance | 2–3 extra steps for user |
| Server scraping | No user install | LinkedIn bans IPs; legal risks |
| **Browser Extension** | One-click; reads authenticated DOM; no IP risk | Requires install; DOM selectors can break on LinkedIn UI updates |

---

## Repository Layout

The extension lives as a **separate Vite build target** inside the monorepo:

```
CV_maker/
├── client/          (existing React web app)
├── server/          (existing Express API)
└── extension/       (NEW)
    ├── manifest.json
    ├── vite.config.ts
    ├── package.json
    ├── tsconfig.json
    ├── background/
    │   └── service-worker.ts
    ├── content/
    │   ├── selectors.ts          ← all LinkedIn DOM selectors isolated here
    │   ├── linkedin-profile.ts   ← scraper for /in/* pages
    │   └── linkedin-job.ts       ← scraper for /jobs/view/* pages
    ├── popup/
    │   ├── popup.html
    │   ├── App.tsx               ← React UI for the popup
    │   └── index.tsx
    └── shared/
        ├── api.ts                ← typed fetch wrapper → HandisCV API
        ├── auth.ts               ← chrome.storage JWT helpers
        └── types.ts              ← shared types (LinkedInProfile, JobPayload, ResumeSchema)
```

---

## manifest.json (MV3)

```json
{
  "manifest_version": 3,
  "name": "HandisCV for LinkedIn",
  "version": "1.0.0",
  "description": "Import your LinkedIn profile to HandisCV or save jobs to your tracker.",
  "permissions": ["storage", "identity"],
  "host_permissions": ["https://www.linkedin.com/*"],
  "background": { "service_worker": "background/service-worker.js" },
  "content_scripts": [
    {
      "matches": ["https://www.linkedin.com/in/*"],
      "js": ["content/linkedin-profile.js"],
      "run_at": "document_idle"
    },
    {
      "matches": ["https://www.linkedin.com/jobs/view/*"],
      "js": ["content/linkedin-job.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": { "16": "icons/16.png", "48": "icons/48.png" }
  }
}
```

---

## Phase 1 — Auth & Extension Shell (Week 1)

### Goal
Extension can authenticate against the HandisCV API and display the user's name in the popup.

### Tasks

**Server — new route: `GET /api/auth/extension-token`**
- Protected by `authenticate` middleware.
- Returns `{ token: req.user.token }` — the same JWT the browser app already holds.
- This allows the web app Settings page to "hand off" the token to the extension.

**Client — Account Settings page**
- Add a "Browser Extension" section to `AccountSettingsPage.tsx`.
- "Connect extension" button calls `GET /api/auth/extension-token` and writes the result to `chrome.storage.local` via a custom URI scheme or a shared `postMessage` to the extension.
- Simpler MVP: display the token in a copy-to-clipboard field; user pastes it into the extension popup.

**Extension popup — Auth screen**
- If no token in `chrome.storage.local`: show "Paste your HandisCV token" input + Save button.
- If token present: show user name + avatar (fetched from `GET /api/auth/me`) + Disconnect button.

**`shared/auth.ts`**
```ts
export const getToken = () => chrome.storage.local.get('hcv_token').then(r => r.hcv_token ?? null);
export const setToken = (t: string) => chrome.storage.local.set({ hcv_token: t });
export const clearToken = () => chrome.storage.local.remove('hcv_token');
```

**`shared/api.ts`**
```ts
const BASE = 'https://api.handiscv.com'; // configurable via extension options

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const res = await fetch(BASE + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

---

## Phase 2 — LinkedIn Profile Scraper (Week 2)

### Goal
One click on the extension popup (when on a LinkedIn profile page) creates a HandisCV resume.

### LinkedIn DOM Selectors (`content/selectors.ts`)

All selectors are versioned here. When LinkedIn updates its markup, only this file needs changing.

```ts
export const PROFILE = {
  name:       'h1.text-heading-xlarge',
  headline:   'div.text-body-medium.break-words',
  location:   'span.text-body-small[data-field="location_name"]',
  about:      '#about ~ div div span[aria-hidden="true"]',
  // Experience entries — each is a <li> under #experience
  expItems:   '#experience ~ div ul > li',
  expTitle:   'div[data-field="experience_component_title"]',
  expCompany: 'span[data-field="experience_component_subtitle"]',
  expDates:   'span[data-field="experience_component_date_range"]',
  expDesc:    'div[data-field="experience_component_description"]',
  // Education
  eduItems:   '#education ~ div ul > li',
  eduSchool:  'div[data-field="education_component_school_name"]',
  eduDegree:  'div[data-field="education_component_degree_name"]',
  eduDates:   'span[data-field="education_component_date_range"]',
  // Skills
  skillItems: '#skills ~ div ul > li span[aria-hidden="true"]',
} as const;
```

### Scraper (`content/linkedin-profile.ts`)

The content script runs on page load and posts a `PROFILE_READY` message to the service worker with the scraped JSON. It does NOT make API calls directly (avoids CORS complications in content scripts).

```ts
import { PROFILE } from './selectors';
import type { LinkedInScrapedProfile } from '../shared/types';

function scrapeProfile(): LinkedInScrapedProfile {
  const qs = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? '';
  const qsa = (sel: string) => Array.from(document.querySelectorAll(sel));

  const experience = qsa(PROFILE.expItems).map(li => ({
    title:       li.querySelector(PROFILE.expTitle)?.textContent?.trim() ?? '',
    company:     li.querySelector(PROFILE.expCompany)?.textContent?.trim() ?? '',
    dateRange:   li.querySelector(PROFILE.expDates)?.textContent?.trim() ?? '',
    description: li.querySelector(PROFILE.expDesc)?.textContent?.trim() ?? '',
  }));

  // ... education, skills similarly

  return {
    fullName:  qs(PROFILE.name),
    headline:  qs(PROFILE.headline),
    location:  qs(PROFILE.location),
    summary:   qs(PROFILE.about),
    experience,
    education: [],  // same pattern
    skills:    qsa(PROFILE.skillItems).map(el => el.textContent?.trim() ?? ''),
  };
}

chrome.runtime.sendMessage({ type: 'PROFILE_READY', payload: scrapeProfile() });
```

### New Server Endpoint: `POST /api/import/linkedin-extension`

**File:** `server/src/controllers/import.controller.ts` — add `importFromExtension` handler.

```ts
export const importFromExtension = async (req: AuthRequest, res: Response) => {
  try {
    const { profileData } = req.body; // LinkedInScrapedProfile
    const resumeContent = mapLinkedInToResumeSchema(profileData); // mapping function
    const resume = await prisma.resume.create({
      data: {
        title: `${profileData.fullName} — LinkedIn Import`,
        content: resumeContent as any,
        userId: req.user!.id,
      },
    });
    res.json({ resumeId: resume.id });
  } catch (err) {
    logger.error('LinkedIn extension import failed', err);
    res.status(500).json({ error: 'Import failed' });
  }
};
```

**Mapping function** (`mapLinkedInToResumeSchema`): converts `LinkedInScrapedProfile` → `ResumeSchema`. Reuses the same shape as the existing AI-based import but with known structure:

- `profile.fullName`, `profile.jobTitle` (← headline), `profile.location`, `profile.summary`
- One `experience` section with items mapped from `experience[]`
- One `education` section
- One `skills` section (`items: [{ name }]`)

**Route addition** in `server/src/routes/import.routes.ts`:
```ts
router.post('/linkedin-extension', authenticate, importFromExtension);
```

### Popup UI (Profile page)

When the popup opens on a `/in/*` URL:
1. Extension sends `chrome.tabs.sendMessage(tabId, { type: 'GET_PROFILE' })` to the content script.
2. Content script responds with the scraped JSON.
3. Popup shows a preview card: name, headline, experience count, education count.
4. "Import to HandisCV" button → calls `POST /api/import/linkedin-extension`.
5. On success: "Open in editor" button deep-links to `https://app.handiscv.com/editor/{resumeId}`.

---

## Phase 3 — LinkedIn Job Scraper (Week 3)

### Goal
One click on a LinkedIn job page saves the posting to the HandisCV Job Tracker.

### LinkedIn Job Selectors (`content/selectors.ts` addition)

```ts
export const JOB = {
  title:       'h1.t-24.job-details-jobs-unified-top-card__job-title',
  company:     'a.app-aware-link[data-tracking-control-name="public_jobs_topcard-org-name"]',
  location:    'span.tvm__text[data-test-id="job-location"]',
  description: '#job-details > span',
  url:         () => window.location.href,
} as const;
```

### Job Content Script (`content/linkedin-job.ts`)

```ts
import { JOB } from './selectors';
import type { LinkedInJobPayload } from '../shared/types';

function scrapeJob(): LinkedInJobPayload {
  const qs = (sel: string) => document.querySelector(sel)?.textContent?.trim() ?? '';
  return {
    jobTitle:    qs(JOB.title),
    company:     qs(JOB.company),
    location:    qs(JOB.location),
    description: qs(JOB.description),
    url:         window.location.href,
  };
}

chrome.runtime.sendMessage({ type: 'JOB_READY', payload: scrapeJob() });
```

### Popup UI (Job page)

When the popup opens on a `/jobs/view/*` URL:
1. Retrieves scraped job from content script.
2. Shows: job title, company, status selector (SAVED / APPLIED / INTERVIEW / OFFER / REJECTED), optional notes textarea.
3. "Save to Job Tracker" button → calls existing `POST /api/jobs` with `{ jobTitle, company, url, status, notes }`.
4. On success: badge counter on extension icon updates; popup shows "Saved ✓" with "View tracker" deep-link.

**No new server endpoint needed** — `POST /api/jobs` already accepts all required fields.

---

## Phase 4 — Polish & Distribution (Week 4)

### Context Detection in Popup
The popup `App.tsx` checks the current tab URL to decide which UI to show:

| URL pattern | Popup content |
|---|---|
| `linkedin.com/in/*` | Profile import card |
| `linkedin.com/jobs/view/*` | Job save card |
| Anything else | "Navigate to a LinkedIn profile or job to get started" |

### Error Handling
- Selector returns empty string → show "Could not read this page. Try scrolling down to load all sections first."
- API 401 → show "Session expired. Reconnect in HandisCV settings."
- API 5xx → show error message + retry button.

### Build Setup (`extension/vite.config.ts`)

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup:          resolve(__dirname, 'popup/popup.html'),
        'service-worker': resolve(__dirname, 'background/service-worker.ts'),
        'content-profile': resolve(__dirname, 'content/linkedin-profile.ts'),
        'content-job':     resolve(__dirname, 'content/linkedin-job.ts'),
      },
      output: { entryFileNames: '[name].js' },
    },
  },
});
```

### Distribution
1. **Chrome Web Store** — submit `extension/dist/` as a zip.
2. **Firefox Add-ons (AMO)** — MV3 is supported with minor adjustments (`browser.storage` vs `chrome.storage` via webextension-polyfill).
3. **Self-hosted (developer mode)** — users load unpacked from the repo for testing.

---

## Server Changes Summary

| File | Change |
|---|---|
| `server/src/routes/import.routes.ts` | Add `POST /linkedin-extension` route (authenticated) |
| `server/src/controllers/import.controller.ts` | Add `importFromExtension` handler + `mapLinkedInToResumeSchema` function |
| `server/src/routes/auth.routes.ts` | Add `GET /extension-token` route (returns current user JWT) |
| `server/src/controllers/auth.controller.ts` | Add `getExtensionToken` handler |
| `client/src/pages/AccountSettingsPage.tsx` | Add "Browser Extension" section with token copy UI |

No Prisma schema changes needed — the extension reuses `Resume` and `JobApplication` models as-is.

---

## Client Changes Summary

| File | Change |
|---|---|
| `client/src/pages/AccountSettingsPage.tsx` | "Browser Extension" section: shows token, instructions, extension store link |

---

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| LinkedIn DOM changes break selectors | All selectors in one file (`selectors.ts`); semantic field names make updates obvious |
| LinkedIn blocks extension requests | Extension reads the DOM locally; no requests to LinkedIn's API |
| JWT stored in `chrome.storage.local` | Token is sandboxed to the extension; expires with normal JWT TTL |
| User on wrong page | Context-aware popup tells them exactly what to do |
| LinkedIn loads content lazily | Scraper waits for `document_idle`; popup shows "Scroll down to load all sections" hint |

---

## Sprint 4 Checklist

- [ ] `extension/` scaffold: `manifest.json`, `vite.config.ts`, `package.json`
- [ ] `shared/types.ts`: `LinkedInScrapedProfile`, `LinkedInJobPayload`
- [ ] `shared/auth.ts` + `shared/api.ts`
- [ ] `content/selectors.ts` — profile selectors
- [ ] `content/linkedin-profile.ts` — scraper
- [ ] `content/linkedin-job.ts` — scraper + job selectors
- [ ] `background/service-worker.ts` — message relay + badge counter
- [ ] `popup/App.tsx` — context-aware UI (profile / job / other)
- [ ] Server: `POST /api/import/linkedin-extension` endpoint
- [ ] Server: `GET /api/auth/extension-token` endpoint
- [ ] Server: `mapLinkedInToResumeSchema` mapping function
- [ ] Client: "Browser Extension" settings section with token copy
- [ ] End-to-end test: profile import on `linkedin.com/in/williamhgates`
- [ ] End-to-end test: job save on any `linkedin.com/jobs/view/*` page
- [ ] Build pipeline: `npm run build:extension` produces a loadable `dist/`
- [ ] README in `extension/` with install + token setup instructions
