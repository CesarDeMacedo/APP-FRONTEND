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

Supabase config is read from `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env` (git-ignored). Copy `.env.example` and fill it in. The app throws at startup if either variable is missing.

For production builds on GitHub Actions, both vars must be added as repository secrets — the workflow injects them via `env:` on the build step. On Vercel there is no `vercel.json`; the same two vars must be added manually in the project's dashboard under Environment Variables.

The Gemini API key is **not** a client-side env var — see Image generation below.

## Authentication

Auth is backed by Supabase (`src/lib/supabaseClient.ts`, same throw-on-missing-env pattern used elsewhere). The entire app is gated behind an authenticated session:

- `App` checks `supabase.auth.getSession()` on mount and subscribes to `supabase.auth.onAuthStateChange`. While the initial session check is pending it renders nothing; once resolved, an unauthenticated session renders `Auth` instead of the image tool.
- `Auth` (`src/components/Auth.tsx`) toggles between login and signup. Signup collects email, password, and a full name (passed as `options.data.full_name` to `supabase.auth.signUp`) and — since email confirmation is required — shows a "check your email" screen rather than granting a session immediately. Login uses `supabase.auth.signInWithPassword`.
- A `public.profiles` table (`id uuid references auth.users`, `full_name text`, RLS restricted to the owning row) is populated by a `security definer` trigger (`handle_new_user`, fired `after insert on auth.users`) that copies `full_name` out of signup metadata so it's queryable via the API. Direct RPC execution of the trigger function is revoked from `anon`/`authenticated`/`public` — it's only meant to run as the trigger.
- Signing out calls `supabase.auth.signOut()`; the auth-state listener picks up the resulting `null` session and re-renders `Auth`.

## Image generation

There is no n8n workflow anymore. `App` POSTs directly to a Supabase Edge Function (`supabase/functions/generate-image/index.ts`, deployed as `generate-image`) at `${VITE_SUPABASE_URL}/functions/v1/generate-image`, sending the current session's `access_token` as a Bearer token plus the `apikey` header.

- The function is deployed with `verify_jwt: true`, and additionally calls `supabase.auth.getUser()` on the caller's token to reject the public anon key used as a bearer token (the platform's `verify_jwt` check alone accepts any validly-signed JWT, anon key included) — only a real logged-in user can reach the generation logic.
- The function converts both uploaded images to base64 and calls the Gemini API (`gemini-2.5-flash-image`, aka "Nano Banana") via `generateContent`, with the fixed prompt `"The person is wearing the clothing"` and `generationConfig.responseModalities: ["IMAGE"]`.
- The output image comes back as base64 in `candidates[0].content.parts[].inlineData`, which the function decodes and returns as a binary response with the matching `Content-Type`.
- The Gemini API key is read from a `GEMINI_API_KEY` Edge Function secret (set via the Supabase dashboard, never committed to git). This is a paid API (no free tier, ~$0.039/generated image) — there's no built-in spend cap here.

## Architecture

Single-file React app — all state and logic live in `src/App.tsx`. There are no routes, no context providers, and no state management library.

**Data flow:**
1. User selects files via `ImageDropZone` (click or drag-and-drop)
2. `App` holds `image1` and `image2` as `File | null` state
3. On Generate, `App` builds a `FormData` and POSTs it to the `generate-image` Edge Function (see Image generation above), authenticated with the current session's token
4. The response is consumed as a `Blob` and turned into an object URL via `URL.createObjectURL`; the previous URL is revoked before setting a new one

**`ImageDropZone` contract:**
- Accepts `.jpg`, `.jpeg`, `.webp`, `.png` — validated against both MIME type and file extension
- Rejects files over 10 MB with an inline error
- Shows a thumbnail preview (`object-contain`) with an × button to remove the file
- Calls `onFile(file)` only for valid files; calls `onClear()` when the × is clicked

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds with Node 24 and deploys to GitHub Pages. The `base` in `vite.config.ts` is set to `/APP-FRONTEND/` to match the Pages URL.
