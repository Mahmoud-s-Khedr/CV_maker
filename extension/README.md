# HandisCV Browser Extension

A Manifest V3 extension for Chrome and Firefox that integrates LinkedIn with HandisCV:

- **Profile → CV**: Scrape your LinkedIn profile and create a HandisCV resume with one click.
- **Job → Tracker**: Save any LinkedIn job posting to your Job Tracker without leaving LinkedIn.

---

## Setup

### 1. Build the extension

```bash
cd extension
npm install
npm run build
```

This produces a `dist/` directory ready to load in Chrome or Firefox.

### 2. Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked** → select the `extension/dist/` folder

### 2. Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Navigate to `extension/dist/` and select `manifest.json`

> **Note:** Temporary add-ons are removed when Firefox closes. For a persistent install, sign and distribute through [AMO](https://addons.mozilla.org/).

### 3. Connect your HandisCV account

1. Log in to HandisCV in your browser
2. Go to **Settings → Browser Extension**
3. Click **Copy** next to your token
4. Click the HandisCV extension icon in the toolbar
5. Paste the token and click **Connect Account**

The popup will show your email when connected successfully.

---

## Usage

### Import a LinkedIn profile

1. Navigate to your LinkedIn profile page (`linkedin.com/in/your-username`)
2. Scroll down to load all sections (Experience, Education, Skills)
3. Click the HandisCV extension icon
4. Review the preview (name, headline, experience count)
5. Click **Import to HandisCV**
6. Click **Open in HandisCV Editor** to edit and download your resume

### Save a job to your tracker

1. Navigate to any LinkedIn job listing (`linkedin.com/jobs/view/…`)
2. Click the HandisCV extension icon
3. Choose a status (Save for later / Already applied / etc.)
4. Optionally add notes (salary, referral contact, etc.)
5. Click **Save to Job Tracker**
6. Click **View Job Tracker** to see all your applications

---

## Development

```bash
# Watch mode — rebuilds on file save
npm run dev

# Type checking
npm run typecheck
```

- **Chrome:** Reload the unpacked extension in `chrome://extensions` after each build (click ↺).
- **Firefox:** Click **Reload** on the add-on in `about:debugging` after each build.

---

## Architecture

```
extension/
├── manifest.json              MV3 manifest (Chrome + Firefox)
├── background/
│   └── service-worker.ts      Central hub: caches scraped data, relays API calls
├── content/
│   ├── selectors.ts           All LinkedIn DOM selectors (update here when LinkedIn changes UI)
│   ├── linkedin-profile.ts    Content script for /in/* pages
│   └── linkedin-job.ts        Content script for /jobs/view/* pages
├── popup/
│   ├── popup.html             Extension popup shell
│   ├── index.tsx              React mount point
│   └── App.tsx                Context-aware UI (auth / profile / job / guide)
└── shared/
    ├── browser.ts             webextension-polyfill re-export (cross-browser chrome/browser API)
    ├── types.ts               Shared TypeScript interfaces
    └── auth.ts                browser.storage token helpers
```

**Cross-browser API layer:** All code imports `browser` from `shared/browser.ts` which re-exports
[webextension-polyfill](https://github.com/mozilla/webextension-polyfill). This provides a unified
Promise-based `browser.*` API that works identically in Chrome (MV3) and Firefox (MV3, Gecko 109+).

**Key design decision — no CORS issues:** The popup sends all API calls as messages to the service
worker (`{ type: 'API_FETCH', ... }`). MV3 service workers are not subject to CORS, so requests
to the HandisCV API work without any CORS configuration changes on the server.

---

## Selector Maintenance

When LinkedIn updates their UI, DOM selectors may break. All selectors live in a single file:

```
extension/content/selectors.ts
```

Update the relevant selector, rebuild, and reload the extension. No other files need changing.

---

## Distributing

### Chrome Web Store
1. Run `npm run build`
2. Zip the `dist/` directory
3. Submit to the [Chrome Web Store](https://chrome.google.com/webstore/devconsole/)

### Firefox Add-ons (AMO)
1. Run `npm run build`
2. Zip the `dist/` directory
3. Submit to [addons.mozilla.org](https://addons.mozilla.org/developers/)
   - The `browser_specific_settings.gecko.id` in `manifest.json` is required for AMO submission
   - Minimum supported version: Firefox 109 (MV3 + `chrome` namespace alias)
