# Deploy SH0 0TA Poker for $0 upfront

## 1. GitHub

Create a GitHub repository and push your project.

## 2. Neon Postgres

Create a free Neon project, then copy the pooled or direct PostgreSQL connection string into Render as `DATABASE_URL`.

## 3. Render backend

Create a new Render Web Service:

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Plan: Free

Add env vars from `render-env.example`.

## 4. Render frontend

Create a new Render Static Site:

- Root directory: `client`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Plan: Free

Set `VITE_API_BASE_URL` to your backend Render URL.

## 5. Database migration

Run these locally against Neon or in Render shell:

```bash
npm run db:migrate -w server
npm run db:seed-admin -w server
```

## 6. Stripe cosmetic payments only

Create a Stripe account, use test mode first, and paste keys into Render:

```txt
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Use Stripe only for cosmetics/VIP in this app. Do not process paid poker entries, chip cash-out, player-funded prizes, or rebuys.

## 7. SSL

Render provides HTTPS for Render URLs. If you later buy a custom domain, point DNS to Render and enable managed TLS.

## 8. Go-live test

- Register/login works
- Admin dashboard requires bearer token
- Database records persist
- Cosmetic checkout opens Stripe
- Prize fulfillment creates sponsor-funded prize records
- Paid entry/chip cashout/player-funded prizes remain disabled
