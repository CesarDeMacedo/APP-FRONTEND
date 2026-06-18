# AI Image Generator

A single-page web app that uploads two images to an n8n webhook and displays the generated result. Built with React, TypeScript, Vite, and TailwindCSS.

**Live:** https://cesardemacedo.github.io/APP-FRONTEND/

## Getting started

```bash
cp .env.example .env   # then fill in VITE_WEBHOOK_URL
npm install
npm run dev
```

## Environment variables

| Variable | Description |
|---|---|
| `VITE_WEBHOOK_URL` | n8n production webhook endpoint (`/webhook/` path, not `/webhook-test/`) |

The `.env` file is git-ignored. For the production build on GitHub Actions, add `VITE_WEBHOOK_URL` as a repository secret at **Settings → Secrets and variables → Actions**.

## How it works

1. User uploads two images (JPG, JPEG, WEBP, or PNG — max 10 MB each)
2. Both files are sent as `multipart/form-data` to the webhook (`image1`, `image2`)
3. The webhook returns a binary image, which is rendered via `URL.createObjectURL`

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds and deploys to GitHub Pages automatically.
