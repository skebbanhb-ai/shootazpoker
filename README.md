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