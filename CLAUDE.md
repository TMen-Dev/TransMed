# TransMed Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-18

## Active Technologies
- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Capacitor 5+, Pinia 2+, Vue Router 4, Vite 5, `@capacitor/camera`, `@capacitor/filesystem` (001-medication-relay)
- MVP — mock data TypeScript/JSON + base64 locale (ordonnances) ; Future — Supabase (PostgreSQL) + Supabase Storage (ordonnances, bucket privé + signed URLs) (001-medication-relay)
- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Pinia 2+, Vue Router 4, Vite 5 (002-ux-fixes)
- Mock TypeScript (in-memory, base64 pour ordonnances) (002-ux-fixes)
- TypeScript 5+ (strict mode) + `@supabase/supabase-js` v2, `@capacitor/preferences` (session storage natif), Ionic 7+, Vue 3.4+, Pinia 2+, Capacitor 5+ (005-supabase-backend)
- Supabase PostgreSQL (entités) + Supabase Storage bucket `ordonnances` (fichiers) (005-supabase-backend)
- TypeScript (Deno runtime pour les Edge Functions) + TypeScript 5+ (client Ionic) + Supabase Edge Functions (Deno), Resend API (email), `@supabase/supabase-js` (admin client dans Edge Function), Vue 3.4+ / Pinia (client) (006-patient-notifications)
- PostgreSQL — nouvelle table `notification_emails` (extension du schema 005) (006-patient-notifications)

- TypeScript 5+ (strict mode) + Ionic 7+, Vue 3.4+, Capacitor 5+, Pinia 2+, Vue Router 4, Vite 5 (001-medication-relay)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5+ (strict mode): Follow standard conventions

## Recent Changes
- 006-patient-notifications: Added TypeScript (Deno runtime pour les Edge Functions) + TypeScript 5+ (client Ionic) + Supabase Edge Functions (Deno), Resend API (email), `@supabase/supabase-js` (admin client dans Edge Function), Vue 3.4+ / Pinia (client)
- 005-supabase-backend: Added TypeScript 5+ (strict mode) + `@supabase/supabase-js` v2, `@capacitor/preferences` (session storage natif), Ionic 7+, Vue 3.4+, Pinia 2+, Capacitor 5+
- 002-ux-fixes: Added [if applicable, e.g., PostgreSQL, CoreData, files or N/A]


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
