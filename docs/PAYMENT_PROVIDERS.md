# Payment Providers

SH0 0TA Poker supports cosmetic/VIP purchases only. Purchases must never affect poker odds, hand outcomes, rankings, prize eligibility, tournaments, matchmaking, or gameplay.

---

## Supported Providers

### Stripe (Active when configured)

Stripe is the primary payment provider. It is active when `STRIPE_SECRET_KEY` is set on the backend.

**Backend (secret — never expose to frontend):**
- `STRIPE_SECRET_KEY=sk_test_...` or `sk_live_...`
- `STRIPE_WEBHOOK_SECRET=whsec_...`

**Frontend (safe to expose):**
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...` or `pk_live_...`

**Flow:**
1. Frontend calls `POST /payments/checkout/cosmetic` with `{ userId, itemId }`.
2. Backend creates a Stripe Checkout Session server-side and returns `{ url }`.
3. Frontend redirects to `url` (Stripe-hosted checkout page).
4. On success, Stripe redirects to `?payment=success` — frontend shows: *"Purchase successful. Your cosmetic is ready."*
5. On cancel, Stripe redirects to `?payment=cancelled` — frontend shows: *"Checkout cancelled. No purchase was made."*

**Guardrails enforced on every request:**
- Only `cardBacks`, `tableSkins`, `avatarFrames`, `profileBadges`, `emotes`, `vipMembership`, `avatars` categories allowed.
- Chips, entry fees, rebuys, cashout, and player-funded prizes are explicitly rejected.
- Checkout session metadata records `affectsGameplay: false`, `affectsOdds: false`, `affectsRankings: false`.

---

### Square / Cash App Pay (Config-ready, not yet active)

Square and Cash App Pay can be added as an alternative cosmetic checkout provider.

**When to enable:** Set `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` on the backend.

**Backend environment variables (secret — never expose to frontend):**
- `SQUARE_ACCESS_TOKEN=your_square_access_token`
- `SQUARE_LOCATION_ID=your_square_location_id`
- `SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_signature_key`

**Implementation guidance:**
- Use the Square Checkout API to create a payment link for cosmetic items.
- Backend creates the payment link server-side and returns the URL.
- Frontend redirects to the Square-hosted checkout URL (same flow as Stripe).
- Webhooks verify payment completion before granting cosmetics.
- Cosmetic-only restriction applies identically to Stripe.
- No gambling, no wagers, no chip cashout, no player-funded prizes.

---

### Crypto Checkout Provider (Config-ready, not yet active)

Crypto payments for cosmetics can be added via a compliant third-party provider (e.g. Coinbase Commerce, NOWPayments, Transak, or similar).

**When to enable:** Set `CRYPTO_PROVIDER`, `CRYPTO_API_KEY`, and `CRYPTO_WEBHOOK_SECRET` on the backend.

**Backend environment variables (secret — never expose to frontend):**
- `CRYPTO_PROVIDER=provider_name`
- `CRYPTO_API_KEY=your_provider_api_key`
- `CRYPTO_WEBHOOK_SECRET=your_provider_webhook_secret`

**Implementation rules:**
- All crypto payment logic must live **backend-only**. No wallet addresses, private keys, or API keys in frontend code or `VITE_*` variables.
- Use the provider's hosted checkout page — same redirect flow as Stripe/Square.
- Never implement direct on-chain payment collection in the frontend.
- Never store seed phrases or private keys anywhere in the repo.
- Cosmetic-only restriction applies identically to Stripe.
- No processing of wagering or player-funded prize pools.

---

## Security Rules (All Providers)

- ❌ Never commit real API keys, secret keys, webhook secrets, access tokens, or private keys.
- ❌ Never put backend-only secrets in `VITE_*` environment variables.
- ❌ Never put backend-only secrets in GitHub Actions secrets accessible to the frontend build.
- ✅ Only `pk_test_` or `pk_live_` Stripe publishable keys may appear in the frontend bundle.
- ✅ `.env.example` may contain placeholder values only (e.g. `sk_test_replace_me`).
- ✅ Run `npm run security:scan` before every release to verify no secrets are committed.
