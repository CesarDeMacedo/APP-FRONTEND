# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server (hot reload)
npm run build    # tsc + Vite production build
npm run preview  # serve the production build locally
```

No test runner or linter is configured.

## Environment

The webhook URL is read from `VITE_WEBHOOK_URL` in `.env` (git-ignored). Copy `.env.example` and fill it in. The app throws at startup if the variable is missing.

For production builds on GitHub Actions, `VITE_WEBHOOK_URL` must be added as a repository secret — the workflow injects it via `env:` on the build step.

## Architecture

Single-file React app — all state and logic live in `src/App.tsx`. There are no routes, no context providers, and no state management library.

**Data flow:**
1. User selects files via `ImageDropZone` (click or drag-and-drop)
2. `App` holds `image1` and `image2` as `File | null` state
3. On Generate, `App` builds a `FormData` and POSTs to `VITE_WEBHOOK_URL`
4. The response is consumed as a `Blob` and turned into an object URL via `URL.createObjectURL`; the previous URL is revoked before setting a new one

**`ImageDropZone` contract:**
- Accepts `.jpg`, `.jpeg`, `.webp`, `.png` — validated against both MIME type and file extension
- Rejects files over 10 MB with an inline error
- Shows a thumbnail preview (`object-contain`) with an × button to remove the file
- Calls `onFile(file)` only for valid files; calls `onClear()` when the × is clicked

**Webhook:**
- Method: `POST`, `multipart/form-data`
- Fields: `image1`, `image2`
- Response: binary image blob (not JSON)
- Must use the `/webhook/` path (production). The `/webhook-test/` path only responds while the n8n editor is open in test mode.
- The n8n workflow must be **Activated** for the production URL to respond.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Node 24 and deploys to GitHub Pages. The `base` in `vite.config.ts` is set to `/APP-FRONTEND/` to match the Pages URL.
