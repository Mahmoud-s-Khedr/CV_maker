# How to Use the HandisCV Extension

A complete guide — from building the extension to daily use.

---

## Part 1 — Build & Install

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- Chrome 88+ **or** Firefox 109+

### 1. Build

```bash
cd extension
npm install
npm run build
```

This produces a `dist/` folder containing the ready-to-load extension.

### 2. Install in Chrome

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder

The HandisCV icon will appear in your toolbar. Pin it for easy access.

### 2. Install in Firefox

1. Open `about:debugging#/runtime/this-firefox` in Firefox
2. Click **Load Temporary Add-on…**
3. Navigate to `extension/dist/` and select `manifest.json`

> **Note:** Temporary add-ons are removed when Firefox closes. For a permanent install, the extension must be signed and distributed via [addons.mozilla.org](https://addons.mozilla.org/).

### Rebuilding after code changes

```bash
# One-time rebuild
npm run build

# Watch mode — auto-rebuilds on every file save
npm run dev
```

After rebuilding:
- **Chrome:** Go to `chrome://extensions` and click the **↺** reload button next to HandisCV
- **Firefox:** Go to `about:debugging`, find HandisCV, and click **Reload**

---

## Part 2 — Connect your HandisCV account

The extension needs your HandisCV JWT token to save data to your account.

1. Log in to your HandisCV account in the browser
2. Go to **Settings** (navigate to `/settings`)
3. Scroll to the **Browser Extension** section
4. Click **Copy** to copy your token
5. Click the **HandisCV** icon in your browser toolbar
6. Paste the token into the text area and click **Connect Account**

Your email address will appear in the popup header confirming the connection.

> **Token expired?** Go back to Settings → Browser Extension and copy a fresh token.

---

## Part 3 — Import a LinkedIn profile as a resume

Use this on your own LinkedIn profile page.

1. Go to `linkedin.com/in/your-username`
2. **Scroll down** the page to ensure LinkedIn has loaded all sections
   (Experience, Education, and Skills must be visible on screen)
3. Click the **HandisCV** extension icon
4. The popup shows a card with your detected name, headline, and section counts
5. Click **Import to HandisCV**
6. When it says *"Resume imported successfully!"*, click **Open in HandisCV Editor**

You can now edit, customise, and download your resume as a PDF.

---

## Part 4 — Save a LinkedIn job to your Job Tracker

1. Open any LinkedIn job listing (`linkedin.com/jobs/view/…`)
2. Click the **HandisCV** extension icon
3. The popup shows the job title and company
4. Choose a **Status** from the dropdown:

   | Status | When to use |
   |---|---|
   | Save for later | Bookmarking a job to apply to later |
   | Already applied | You submitted an application |
   | Interview scheduled | You have an interview lined up |
   | Received offer | You got an offer |
   | Rejected | Application was declined |

5. Optionally add **Notes** (salary range, referral contact, etc.)
6. Click **Save to Job Tracker**
7. Click **View Job Tracker** to see all your applications in HandisCV

---

## Popup screens at a glance

| Page you're on | What the popup shows |
|---|---|
| `linkedin.com/in/…` | Profile import card |
| `linkedin.com/jobs/view/…` | Job save card |
| Any other page | Guide: "Navigate to a LinkedIn profile or job" |
| Not connected | Token input + Connect button |

---

## Troubleshooting

**"Could not read this LinkedIn profile"**
- Scroll down the profile page to load all sections, then close and re-open the popup.
- LinkedIn is a SPA — if you navigated via a link (not a full page load), try pressing F5 to reload, then re-open the popup.

**"Invalid or expired token"**
- Go to HandisCV Settings → Browser Extension → copy a new token, then paste it into the popup.

**The popup shows "Loading…" indefinitely**
- Reload the LinkedIn page (F5) and try again.
- If it persists, reload the extension itself:
  - **Chrome:** `chrome://extensions` → HandisCV → ↺ reload
  - **Firefox:** `about:debugging` → HandisCV → Reload

**Job or profile data is wrong / missing fields**
- LinkedIn occasionally updates its page structure. If data is missing, report the issue — the fix usually requires updating a single file (`content/selectors.ts`) and rebuilding.

---

## Disconnecting

Click the **×** button next to your email in the popup header to disconnect.
Your HandisCV data is not affected — only the locally stored token is removed.
