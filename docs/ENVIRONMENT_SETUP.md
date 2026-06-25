# Environment Setup: GitHub Pages + Render + Stripe

This project uses a split deployment model:

- GitHub Pages hosts the frontend static app (Vite build output only).
- Render hosts the backend API (Express + Socket.IO).
- Stripe Checkout Sessions are created on the backend only.

## 1) GitHub Actions Repository Variables (frontend-safe)

Set these in GitHub repository Variables (not Secrets) for the Pages build workflow:

- `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com`
- `VITE_APP_NAME=SH0 0TA Poker`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_pk_live_here`

These are exposed to the frontend bundle and must be safe to publish.

## 2) Render Backend Environment Variables (private where applicable)

Set these in Render service environment settings:

- `NODE_ENV=production`
- `PORT=10000`
- `CLIENT_ORIGIN=https://skebbanhb-ai.github.io/shootazpoker`
- `PUBLIC_BASE_URL=https://skebbanhb-ai.github.io/shootazpoker`
- `DATABASE_URL=Neon/Postgres URL`
- `JWT_SECRET=long random private secret`
- `ADMIN_EMAIL=owner/admin email`
- `ADMIN_PASSWORD=strong admin password`
- `STRIPE_SECRET_KEY=sk_test_or_sk_live_here`
- `STRIPE_WEBHOOK_SECRET=whsec_here`
- `REAL_MONEY_ENABLED=false`
- `PLAYER_FUNDED_PRIZES_ENABLED=false`
- `PAID_TOURNAMENT_ENTRY_ENABLED=false`
- `CHIP_CASHOUT_ENABLED=false`

## 3) Security Warnings

- Never place `STRIPE_SECRET_KEY` in GitHub Pages, `VITE_*` variables, client code, `dist` files, or frontend workflows.
- Never commit `sk_live_`, `sk_test_`, `rk_live_`, `rk_test_`, or `whsec_`.
- Only `pk_test_` or `pk_live_` may be exposed to the frontend if needed.

## 4) Compliance and Gameplay Safety

- Cosmetic purchases only.
- No paid poker entry.
- No money rebuys.
- No chip cashout.
- No player-funded prize pools.
- No purchase may alter gameplay odds, rankings, tournament outcomes, or prize eligibility.
