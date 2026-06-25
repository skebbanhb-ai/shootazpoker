# shootazpoker

## Local development

```bash
npm ci
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3000

## Validation

```bash
npm test
npm run build
```

## GitHub Pages deployment

This repository deploys the Vite client (`client/dist`) via GitHub Actions workflow:

- Workflow: `.github/workflows/deploy-pages.yml`
- Pages must be enabled in repository settings
- Pages source must be set to **GitHub Actions**

## Live deployment targets

- GitHub Pages frontend: https://skebbanhb-ai.github.io/shootazpoker/
- Render Static frontend: https://shootazpoker.onrender.com
- Render Backend API: https://shootazpoker-api.onrender.com

> `https://shootazpoker.onrender.com` is a frontend static site, not the backend API.

## Required production environment values

### GitHub Actions Variables

- `VITE_BASE_PATH=/shootazpoker/`
- `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com`
- `VITE_APP_NAME=ShootazPokerHouse`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME`
- `VITE_ENABLE_DEMO_PURCHASES=false`

### Render Static Site variables

- `VITE_BASE_PATH=/`
- `VITE_API_BASE_URL=https://shootazpoker-api.onrender.com`
- `VITE_APP_NAME=ShootazPokerHouse`
- `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_REPLACE_ME`
- `VITE_ENABLE_DEMO_PURCHASES=false`

### Render Backend variables

- `NODE_ENV=production`
- `PORT=10000`
- `CLIENT_ORIGIN=https://skebbanhb-ai.github.io/shootazpoker,https://shootazpoker.onrender.com`
- `PUBLIC_BASE_URL=https://skebbanhb-ai.github.io/shootazpoker`
- `DATABASE_URL=YOUR_NEON_POSTGRES_URL`
- `JWT_SECRET=LONG_RANDOM_PRIVATE_SECRET`
- `ADMIN_EMAIL=YOUR_EMAIL`
- `ADMIN_PASSWORD=STRONG_PASSWORD`
- `STRIPE_SECRET_KEY=sk_test_REPLACE_ME`
- `STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME`
- `ALLOW_DEMO_PURCHASES=false`
- `REAL_MONEY_ENABLED=false`
- `PLAYER_FUNDED_PRIZES_ENABLED=false`
- `PAID_TOURNAMENT_ENTRY_ENABLED=false`
- `CHIP_CASHOUT_ENABLED=false`
