# Mobile Responsiveness Plan (Client)

## Goal
Make the client usable on small screens (320–480px) and tablets (768px) with no horizontal scrolling, reachable navigation, and readable editor/preview.

## Baseline
- Breakpoints (Tailwind): `sm` (640), `md` (768), `lg` (1024)
- Primary focus: Editor UX, then Admin tables, then dashboards.

Policy: **mobile + tablet share the same UI**. Desktop-only enhancements start at `lg`.

## Step 1 — Verify global layout & navigation
- Confirm the authenticated navbar renders for all protected routes.
- Verify mobile menu opens/closes, links navigate, and Logout works.
- Check that page content is not hidden under the sticky header.

Success criteria:
- No page needs manual `pt-20/pt-24` offsets.
- Mobile menu usable with one hand and doesn’t overflow the viewport.

## Step 2 — Resume editor (highest priority)
### Current target behavior
- On `< lg` (mobile + tablet): single-column with a toggle between **Edit** and **Preview**.
- On `>= lg` (desktop): split screen (Edit left, Preview right).

Checklist
- [ ] Editor page fills available height without `h-screen` clashes.
- [ ] No horizontal scroll in forms or section editors.
- [ ] Header actions wrap on small screens (share/history/import/save).
- [ ] Preview renders and scrolls properly on mobile.
- [ ] Back navigation returns to role home (USER: `/dashboard`, RECRUITER: `/recruiter`, ADMIN: `/admin`).

## Step 3 — Dashboard / Recruiter / Payment
- Use consistent padding: `px-4 py-6 sm:px-6 sm:py-8 lg:px-8`.
- Ensure primary CTAs remain visible and don’t wrap awkwardly.
- Cards: verify grid collapses to 1 column with readable spacing.

## Step 4 — Admin dashboard tables (common mobile pain)
Problems to address:
- Wide tables overflow on mobile.

Approach options:
1. Wrap tables in horizontal scroll container:
   - Container: `overflow-x-auto` + `-mx-4 px-4` to allow full-width scrolling.
2. Convert to stacked “cards” on small screens:
   - `hidden md:table` + `md:hidden` cards.

Success criteria:
- Users can read fields and use Actions on 360px width.

## Step 5 — Public resume / portfolio pages
- Verify typography scale and spacing.
- Confirm PDF/public resume render doesn’t overflow.

## Step 6 — Cross-browser smoke
- Chrome Android + Safari iOS (if possible).
- Validate that PDF preview (pdf.js) works and doesn’t crash on mobile.

## Quick dev workflow
- Run: `npm run dev` in `client/`
- Use Chrome DevTools device emulation:
  - iPhone SE (small)
  - iPhone 14 Pro
  - iPad Mini

## Definition of done
- No horizontal scroll on major screens.
- Navigation always available.
- Editor usable on mobile with a clear Edit/Preview workflow.
