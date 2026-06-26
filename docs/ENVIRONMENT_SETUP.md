# Environment Setup: GitHub Pages + Render + Stripe

This project uses a split deployment model:

- **GitHub Pages** or **Render Static Site** hosts the frontend Vite build output only.
- **Render Web Service (`shootazpoker-api`)** hosts the backend API (Express + Socket.IO + Stripe).
- Stripe Checkout Sessions are created on the backend only.

> ⚠️ Do **not** use the static frontend URL (`https://shootazpoker.onrender.com`) as `VITE_API_BASE_URL`.
> The frontend URL is a static site — it has no API. The backend is a separate Render Web Service.

## 1) GitHub Actions Repository Variables (frontend-safe, GitHub Pages build)

Set these in GitHub repository **Variables** (not Secrets) for the Pages build workflow:

- `VITE_BASE_PATH=/shootazpoker/`
- `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com`
- `VITE_APP_NAME=ShootazPokerHouse`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME`
- `VITE_ENABLE_DEMO_PURCHASES=false`

These are baked into the frontend bundle and must be safe to publish.

## 2) Render Static Site Environment Variables

Set these in the Render Static Site (`shootazpoker`) environment settings:

- `VITE_BASE_PATH=/`
- `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com`
- `VITE_APP_NAME=ShootazPokerHouse`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME`
- `VITE_ENABLE_DEMO_PURCHASES=false`

## 3) Render Backend Web Service Environment Variables (private where applicable)

Set these in the Render Web Service (`shootazpoker-api`) environment settings:

- `NODE_ENV=production`
- `PORT=10000`
- `CLIENT_ORIGIN=https://skebbanhb-ai.github.io/shootazpoker,https://shootazpoker.onrender.com`
- `PUBLIC_BASE_URL=https://skebbanhb-ai.github.io/shootazpoker`
- `DATABASE_URL=Neon/Postgres URL`
- `JWT_SECRET=long random private secret`
- `ADMIN_EMAIL=owner/admin email`
- `ADMIN_PASSWORD=strong admin password`
- `STRIPE_SECRET_KEY=sk_test_REPLACE_ME`
- `STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME`
- `REAL_MONEY_ENABLED=false`
- `PLAYER_FUNDED_PRIZES_ENABLED=false`
- `PAID_TOURNAMENT_ENTRY_ENABLED=false`
- `CHIP_CASHOUT_ENABLED=false`
- `ALLOW_DEMO_PURCHASES=false`

### Optional Square / Cash App Pay (backend only)

- `SQUARE_ACCESS_TOKEN=replace_me`
- `SQUARE_LOCATION_ID=replace_me`
- `SQUARE_WEBHOOK_SIGNATURE_KEY=replace_me`

### Optional Crypto Checkout Provider (backend only)

- `CRYPTO_PROVIDER=replace_me`
- `CRYPTO_API_KEY=replace_me`
- `CRYPTO_WEBHOOK_SECRET=replace_me`

## 4) Security Warnings

- Never place `STRIPE_SECRET_KEY` in GitHub Pages, `VITE_*` variables, client code, `dist` files, or frontend workflows.
- Never commit `sk_live_`, `sk_test_`, `rk_live_`, `rk_test_`, or `whsec_` with real values.
- Only `pk_test_` or `pk_live_` may be exposed to the frontend if needed.
- Never commit Square access tokens, crypto API keys, database URLs, JWT secrets, or admin passwords.

## 5) Compliance and Gameplay Safety

- Cosmetic purchases only.
- No paid poker entry.
- No money rebuys.
- No chip cashout.
- No player-funded prize pools.
- No purchase may alter gameplay odds, rankings, tournament outcomes, or prize eligibility.
- Free chips have no cash value.
