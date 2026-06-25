# Live Site QA Guide

## Deployment Overview

| Service | URL | Type |
|---|---|---|
| GitHub Pages | `https://skebbanhb-ai.github.io/shootazpoker/` | Frontend only |
| Render Static Site | `https://shootazpoker.onrender.com` | Frontend only |
| Render Web Service | `https://shootazpoker-api.onrender.com` | Backend API + Socket.IO |

The frontend and backend are **separate deployments**. The static sites (GitHub Pages, Render Static Site) serve only the compiled Vite bundle. The Render Web Service runs the Express + Socket.IO + Stripe backend.

> ⚠️ Do **not** use `https://shootazpoker.onrender.com` as `VITE_API_BASE_URL`. That is the static frontend. The API is `https://shootazpoker-api.onrender.com`.

---

## White Screen Troubleshooting

### Symptom
The page at `https://shootazpoker.onrender.com` or GitHub Pages shows only a white/blank screen.

### Root Cause
Vite sets `base` to determine where assets are loaded from. If `base` is `/shootazpoker/` but the site is served at `/`, all JS/CSS asset URLs will be wrong (e.g. `/shootazpoker/assets/main.js` instead of `/assets/main.js`), causing a blank page.

### Fix
`client/vite.config.js` uses a configurable base path:

```js
base: process.env.VITE_BASE_PATH || '/shootazpoker/',
```

| Deployment | `VITE_BASE_PATH` |
|---|---|
| GitHub Pages | `/shootazpoker/` |
| Render Static Site | `/` |

### GitHub Pages
The deploy workflow at `.github/workflows/deploy-pages.yml` sets `VITE_BASE_PATH=/shootazpoker/` at build time automatically.

### Render Static Site
Set the environment variable in the Render dashboard:

```
VITE_BASE_PATH=/
```

---

## Backend Health Check

Verify the backend is running:

```sh
curl -i https://shootazpoker-api.onrender.com/health
```

Expected: HTTP 200 with `{"ok":true,"app":"SH0 0TA Poker Creator League API"}`

If this fails, check:
1. The Render Web Service `shootazpoker-api` is deployed and running
2. `PORT=10000` is set in Render environment
3. The start command is `npm start` and root directory is `server`

---

## Common Issues

| Symptom | Likely Cause | Fix |
|---|---|---|
| White screen on Render Static Site | `VITE_BASE_PATH` is `/shootazpoker/` instead of `/` | Set `VITE_BASE_PATH=/` in Render Static Site env |
| White screen on GitHub Pages | Missing `VITE_BASE_PATH` or wrong publish path | Ensure workflow sets `VITE_BASE_PATH=/shootazpoker/` and publish dir is `client/dist` |
| Shop "Buy" does nothing / no checkout | Stripe not configured | Set `STRIPE_SECRET_KEY` on backend Render service |
| CORS errors in browser console | Backend `CLIENT_ORIGIN` missing your frontend URL | Add frontend URL to `CLIENT_ORIGIN` (comma-separated) |
| API calls fail (network error) | `VITE_API_BASE_URL` not set or points to wrong URL | Set `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com` |
| Socket.IO not connecting | Backend sleeping (Render free tier) | Wait for backend to wake; consider upgrading to paid plan |
