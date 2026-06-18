# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # start Vite dev server (hot reload)
npm run build    # tsc + Vite production build
npm run preview  # serve the production build locally
```

No test runner or linter is configured.

## Architecture

Single-file React app — all state and logic live in `src/App.tsx`. There are no routes, no context providers, and no state management library.

**Data flow:**
1. User selects files via `ImageDropZone` (click or drag-and-drop)
2. `App` holds `image1` and `image2` as `File | null` state
3. On Generate, `App` builds a `FormData` and POSTs to the n8n production webhook (`/webhook/` path — **not** `/webhook-test/`, which only works while the n8n editor is in test mode)
4. The response is consumed as a `Blob` and turned into an object URL via `URL.createObjectURL`; the previous URL is revoked before setting a new one

**`ImageDropZone` contract:**
- Validates file type against both MIME type (`image/jpeg`, `image/webp`) and extension (`.jpg`, `.jpeg`, `.webp`)
- Shows an inline error for invalid types; calls `onFile(file)` only for valid files
- Generates a preview via `URL.createObjectURL` on render — the `onLoad` callback revokes it to avoid leaks

**Webhook:**
- Endpoint: `https://cesardemacedo.app.n8n.cloud/webhook/eb00b9cf-91b8-4544-bcd3-f27cbbc94d89`
- Method: `POST`, `multipart/form-data`
- Fields: `image1`, `image2`
- Response: binary image blob (not JSON)
- The n8n workflow must be **Activated** (production mode) for this URL to respond
