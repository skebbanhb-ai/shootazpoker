# Prelaunch Security Checklist

Run before inviting users:

```bash
npm audit
npm test
```

Manual checks:

- Admin routes reject non-admin users.
- JWT secret is strong and not committed.
- Admin password changed from default.
- Stripe keys are in Render env vars only.
- `DATABASE_URL` is private.
- Real-money gambling flags remain false.
- Stripe purchases are cosmetics/VIP only.
- Prize fulfillment requires admin review.
- HTTPS Render URL is used everywhere.
