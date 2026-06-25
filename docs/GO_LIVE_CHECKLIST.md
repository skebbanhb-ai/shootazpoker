# Go-Live Checklist

Use this checklist before launching SH0 0TA Poker to production.

---

## GitHub Pages (Frontend)

**Build settings (Actions workflow):**

| Variable | Value |
|---|---|
| `VITE_BASE_PATH` | `/shootazpoker/` |
| `VITE_API_BASE_URL` | `https://shootazpoker-api.onrender.com` |
| `VITE_APP_NAME` | `SH0 0TA Poker` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_REPLACE_ME` |
| `VITE_ENABLE_DEMO_PURCHASES` | `false` |

Set these under **GitHub → Settings → Secrets and variables → Actions → Variables**.

---

## Render Static Site (`shootazpoker`)

**Render Static Site settings:**

- **Name:** `shootazpoker`
- **Branch:** `main`
- **Root Directory:** *(blank)*
- **Build Command:** `npm install && npm run build --workspace=client`
- **Publish Directory:** `client/dist`

**Environment variables:**

| Variable | Value |
|---|---|
| `VITE_BASE_PATH` | `/` |
| `VITE_API_BASE_URL` | `https://shootazpoker-api.onrender.com` |
| `VITE_APP_NAME` | `SH0 0TA Poker` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_test_REPLACE_ME` |
| `VITE_ENABLE_DEMO_PURCHASES` | `false` |

---

## Render Backend Web Service (`shootazpoker-api`)

**Render Web Service settings:**

- **Name:** `shootazpoker-api`
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Expected URL:** `https://shootazpoker-api.onrender.com`

**Environment variables:**

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `CLIENT_ORIGIN` | `https://skebbanhb-ai.github.io/shootazpoker,https://shootazpoker.onrender.com` |
| `PUBLIC_BASE_URL` | `https://skebbanhb-ai.github.io/shootazpoker` |
| `DATABASE_URL` | `YOUR_NEON_POSTGRES_URL` |
| `JWT_SECRET` | `LONG_RANDOM_PRIVATE_SECRET` |
| `ADMIN_EMAIL` | `YOUR_EMAIL` |
| `ADMIN_PASSWORD` | `STRONG_PASSWORD` |
| `STRIPE_SECRET_KEY` | `sk_test_REPLACE_ME` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_REPLACE_ME` |
| `ALLOW_DEMO_PURCHASES` | `false` |
| `REAL_MONEY_ENABLED` | `false` |
| `PLAYER_FUNDED_PRIZES_ENABLED` | `false` |
| `PAID_TOURNAMENT_ENTRY_ENABLED` | `false` |
| `CHIP_CASHOUT_ENABLED` | `false` |

**Optional Square / Cash App Pay (add when ready):**

| Variable | Value |
|---|---|
| `SQUARE_ACCESS_TOKEN` | `replace_me` |
| `SQUARE_LOCATION_ID` | `replace_me` |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | `replace_me` |

**Optional crypto checkout provider (add when ready):**

| Variable | Value |
|---|---|
| `CRYPTO_PROVIDER` | `replace_me` |
| `CRYPTO_API_KEY` | `replace_me` |
| `CRYPTO_WEBHOOK_SECRET` | `replace_me` |

---

## Verification checklist

- [ ] `GET https://shootazpoker-api.onrender.com/health` returns HTTP 200 with `{"ok":true,...}`
- [ ] Frontend at GitHub Pages loads without white screen
- [ ] Frontend at Render Static Site loads without white screen
- [ ] Shop "Buy" button shows "Checkout is not configured yet" when Stripe keys are not set
- [ ] Shop "Buy" button redirects to Stripe when `STRIPE_SECRET_KEY` is properly set
- [ ] No real Stripe/Square/crypto keys committed to the repo
- [ ] `npm run security:scan` reports no live secrets in repo

---

## Product safety rules (never change these)

- ❌ No real-money poker tables
- ❌ No paid poker entries
- ❌ No chip cashout
- ❌ No money rebuys
- ❌ No player-funded prize pools
- ✅ Cosmetic/VIP/status purchases only
- ✅ Purchases must not affect poker odds, hand outcomes, rankings, prize eligibility, tournaments, matchmaking, or gameplay
- ✅ Free chips have no cash value
