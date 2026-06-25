# SH0 0TA Poker — Free Deploy Pack

Recommended $0 starter stack:

- **Render Free Web Service** for the Node/Socket.IO backend
- **Render Free Static Site** for the React frontend
- **Neon Free Postgres** for persistent PostgreSQL
- **Stripe Checkout** for cosmetic/VIP purchases only
- **Render-managed HTTPS** on the free Render subdomains

This is for MVP/testing. Free hosting can sleep, pause, or have limits. Use paid hosting before serious production traffic.

## Quick deploy checklist

1. Push the project to GitHub.
2. Create a free Neon Postgres database.
3. Copy Neon `DATABASE_URL`.
4. Create Render Web Service for `/server`.
5. Create Render Static Site for `/client`.
6. Add environment variables from `render-env.example`.
7. Add Stripe test keys.
8. Run DB migration and seed admin from Render Shell or locally.
9. Test login, admin dashboard, cosmetic checkout, and prize fulfillment.

## Why this stack

Render gives a free web-service path for Node backends and supports managed TLS/custom domains on free web services. Neon gives a free Postgres plan with no monthly cost and no credit card requirement. Stripe lets a supported business accept customer payments globally, but your business must be in a Stripe-supported country/region.
