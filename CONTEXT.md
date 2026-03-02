# Context de session — TransMed

**Date** : 2026-03-02 | **Branche** : master (solo workflow)

---

## Ce qui a été fait

### Feature 005 — supabase-backend ✅ IMPLÉMENTÉ + VALIDÉ E2E

Backend Supabase complet : Auth + PostgreSQL + Storage + RLS + Realtime.
Services swappés Mock → Supabase dans `src/services/index.ts`.

### Feature 006 — patient-notifications ✅ IMPLÉMENTÉ + VALIDÉ E2E (2026-03-02)

| Artefact | Chemin | Statut |
|----------|--------|--------|
| Edge Function webhook | `supabase/functions/notify-patient/index.ts` | ✅ déployée |
| Edge Function cron | `supabase/functions/retry-notifications/index.ts` | ✅ déployée |
| Migration | `supabase/migrations/006_notification_emails.sql` | ✅ appliquée |
| useNotification.ts | Realtime listener | ✅ refactoré |
| DetailDemandeView | badge "Patient notifié" | ✅ |
| ListeDemandesView | tri + badge "Action requise" | ✅ |

**Validé E2E :** webhook → Edge Function → Resend → email reçu ✓

**Configuration production :**
- `RESEND_API_KEY` : configuré via `supabase secrets set`
- `from` email : `onboarding@resend.dev` (domaine transmed.app non vérifié)
- Database Webhook : créé dans dashboard Supabase (Table: demandes, Event: UPDATE, Type: Supabase Edge Functions)

---

## Bugs résolus en session

### 1. CSP bloquait Supabase (`index.html`)
- Symptôme : "Refused to connect because it violates the document's Content Security Policy"
- Fix : ajout `connect-src 'self' https://*.supabase.co wss://*.supabase.co` dans la meta CSP

### 2. Logout ne naviguait pas (`ProfilView.vue`)
- Symptôme : clic sur déconnexion → reste sur la page
- Fix : `handleLogout` rendu `async` + `await authStore.logout()`

### 3. Upload ordonnance échouait (`SupabaseDemandeService.ts`)
- Symptôme : double préfixe `data:image/png;base64,data:image/png;base64,...` + CSP bloquant `fetch(data URL)`
- Fix : strip du préfixe via regex + conversion base64 → Blob via `atob()` + `Uint8Array` (sans fetch)

---

## Projet Supabase

- **Project ref** : `vhealjcvmvvpxgaycfli`
- **URL** : `https://vhealjcvmvvpxgaycfli.supabase.co`
- **MCP configuré** : `.mcp.json` à la racine du projet (gitignored)

### Migrations appliquées (ordre)
1. `001_initial_schema.sql`
2. `002_rls_and_functions.sql`
3. `003_fix_trigger_search_path.sql`
4. `004_missing_rls_policies.sql`
5. `005_fix_demandes_select_policy.sql`
6. `006_notification_emails.sql`

### Comptes de test
- **Ben** — patient (créé via l'app)
- **Amina** — aidante (créée via l'app)

---

## Stack technique

- **Client** : Ionic 7 + Vue 3.4 + TypeScript strict + Pinia + Vue Router + Vite + Capacitor
- **Backend** : Supabase (Auth + PostgreSQL + Storage + Edge Functions + Realtime)
- **Email** : Resend API via `npm:resend@3` (Deno Edge Function)
- **CSP** : `index.html` — connect-src inclut `https://*.supabase.co` + `wss://*.supabase.co`
