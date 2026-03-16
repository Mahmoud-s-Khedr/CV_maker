# Client

## Commands

```bash
npm run dev
npm run build
npm run preview
```

## Local preview recovery

`vite preview` can fail with a blank page on `localhost` if the browser is still holding a stale service worker or old cached assets from an older build on the same origin.

The client now performs a localhost-only cleanup in `index.html` before loading the app bundle:

- unregisters existing service workers for the current localhost origin
- deletes Cache Storage entries for that origin
- reloads the page once after cleanup

If preview is still blank, do the browser-side cleanup as well:

1. Open the browser devtools for `http://localhost:4173`.
2. Remove any service worker in Application/Storage.
3. Clear site data for the origin.
4. Retry in a private window or with extensions disabled for localhost.

The `content-script.js` and `XrayWrapper` console errors are browser-extension noise unless they also reproduce in a clean profile.

## Local auth setup

When running the frontend locally, the backend must allow the exact frontend origin through `CORS_ORIGINS`.

- Vite dev default: `http://localhost:5173`
- Vite preview default: `http://localhost:4173`

Google Sign-In also requires the same origin to be added to the OAuth client's Authorized JavaScript origins in Google Cloud Console. For local work, add both:

- `http://localhost:5173`
- `http://localhost:4173`

Keep `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` set to the same OAuth client.
