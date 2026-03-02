# Implementation Plan: Notification patient — demande prête

**Branch**: `006-patient-notifications` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-patient-notifications/spec.md`

## Summary

Remplacement du mock email (`useNotification.ts` + console.log) par un pipeline de notification réel côté serveur : un Database Webhook Supabase déclenche une Edge Function `notify-patient` dès que `demandes.statut` passe à `pret_acceptation_patient`. L'Edge Function envoie l'email via Resend et trace l'envoi dans une table `notification_emails`. Une seconde Edge Function planifiée (cron) réessaie les envois échoués toutes les 5 minutes. Le composable `useNotification.ts` est simplifié pour écouter les changements de la table `notification_emails` en temps réel (Supabase Realtime) et afficher la confirmation à l'aidant.

## Technical Context

**Language/Version**: TypeScript (Deno runtime pour les Edge Functions) + TypeScript 5+ (client Ionic)
**Primary Dependencies**: Supabase Edge Functions (Deno), Resend API (email), `@supabase/supabase-js` (admin client dans Edge Function), Vue 3.4+ / Pinia (client)
**Storage**: PostgreSQL — nouvelle table `notification_emails` (extension du schema 005)
**Testing**: Vitest (unitaires client) + `supabase functions serve` + curl (Edge Functions en local)
**Target Platform**: Supabase Edge Runtime (Deno Deploy) + iOS/Android/Web (client)
**Performance Goals**: Email livré ≤ 5 minutes après transition de statut (FR-601)
**Constraints**: 1 email maximum par demande (FR-602), 3 tentatives max (FR-605), idempotence garantie par contrainte DB
**Scale/Scope**: MVP ~100 utilisateurs, pic ~10 notifications/jour

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Notes |
|----------|--------|-------|
| I. Stack Mobile-First (Capacitor + Ionic) | ✅ PASS | Pipeline entièrement serveur-side — zéro dépendance native côté Edge Function |
| II. Composition API (`<script setup>`) | ✅ PASS | `useNotification.ts` mis à jour reste un composable Composition API |
| III. TypeScript strict, pas de `any` | ✅ PASS | Edge Functions en TypeScript Deno typé ; webhook payload typé |
| IV. Accès natif via Capacitor plugins | ✅ PASS | N/A pour les Edge Functions ; client ne requiert aucun nouveau plugin Capacitor |
| V. Simplicité / YAGNI | ✅ PASS | Pas de push, pas de notification center, pas de SDK tiers côté client |

**Verdict** : ✅ Toutes les gates passent.

## Project Structure

### Documentation (this feature)

```text
specs/006-patient-notifications/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — Edge Functions, Resend, webhook patterns
├── data-model.md        # Phase 1 — table notification_emails + RLS
├── quickstart.md        # Phase 1 — guide local Edge Functions
├── contracts/           # Phase 1 — webhook payload + Edge Function interface
└── tasks.md             # Phase 2 — généré par /speckit.tasks
```

### Source Code (repository root)

```text
supabase/
├── functions/
│   ├── notify-patient/
│   │   └── index.ts          ← NEW — Edge Function webhook receiver + envoi Resend
│   └── retry-notifications/
│       └── index.ts          ← NEW — Edge Function cron (toutes les 5 min)
├── migrations/
│   └── 003_notification_emails.sql  ← NEW — table + RLS
└── config.toml               ← UPDATE — ajouter cron schedule retry-notifications

src/
├── composables/
│   └── useNotification.ts    ← UPDATE — remplacer mock par listener realtime
├── views/
│   ├── DetailDemandeView.vue ← UPDATE — badge "Patient notifié" + avertissement si échec
│   └── ListeDemandesView.vue ← UPDATE — highlight "Action requise" pour patient
└── types/
    └── notification.types.ts ← NEW — types NotificationEmail, StatutNotification
```

**Structure Decision** : Hybrid mobile + serverless. La logique d'envoi est entièrement dans `supabase/functions/`. Les modifications client (`src/`) sont minimales — seul `useNotification.ts` est refactoré, deux vues reçoivent des indicateurs visuels.

## Phase 0: Research

→ Voir [research.md](./research.md) pour les décisions techniques.

**Points résolus** :
1. **Déclencheur** : Database Webhook Supabase (configuré dans le dashboard) → HTTP POST à `notify-patient` Edge Function sur UPDATE de `demandes` où `new.statut = 'pret_acceptation_patient'` ET `old.statut != 'pret_acceptation_patient'`
2. **Idempotence** : Contrainte UNIQUE sur `notification_emails(demande_id)` + vérification `emailNotifEnvoyee` avant insert — double protection contre les doublons
3. **Email** : Resend API — `import { Resend } from 'npm:resend'` depuis Deno ; clé API dans `Deno.env.get('RESEND_API_KEY')`
4. **Retry** : Scheduled Edge Function `retry-notifications` avec cron `"*/5 * * * *"` dans `config.toml` — select toutes les notifications `statut = 'failed' AND tentatives < 3`
5. **Admin client** : `createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'))` dans les Edge Functions pour bypass RLS sur `notification_emails`
6. **Client** : `useNotification.ts` simplifié — subscribe `supabase.channel('notification:demandeId')` sur la table `notification_emails`, affiche confirmation quand `statut = 'sent'`

## Phase 1: Design

→ Voir [data-model.md](./data-model.md) pour le schéma PostgreSQL.
→ Voir [contracts/](./contracts/) pour les interfaces Edge Function.
→ Voir [quickstart.md](./quickstart.md) pour le guide de démarrage.

### Flux complet

```
1. Aidant complète Prop3 (ou Prop2+cagnotte)
2. Store Pinia → SupabaseDemandeService.updateStatut() → RPC update_demande_statut
3. PostgreSQL UPDATE demandes SET statut='pret_acceptation_patient'
4. Database Webhook → POST notify-patient Edge Function
5. Edge Function :
   a. Vérifie idempotence (notification_emails UNIQUE sur demande_id)
   b. Récupère email patient via auth.users
   c. Envoie email via Resend
   d. Insert notification_emails(statut='sent') OU update(statut='failed')
   e. UPDATE demandes SET email_notif_envoyee=true
6. Supabase Realtime → notification_emails change → useNotification.ts
7. useNotification → notifTriggered = true → toast aidant "Patient notifié"
8. (Si échec) retry-notifications cron → réessaie après 5min, max 3 fois
```

### Composants affectés

| Composant | Changement | Impact |
|-----------|------------|--------|
| `supabase/functions/notify-patient/index.ts` | Nouveau | Pipeline email complet |
| `supabase/functions/retry-notifications/index.ts` | Nouveau | Retry cron |
| `supabase/migrations/003_notification_emails.sql` | Nouveau | Table + RLS |
| `supabase/config.toml` | Update | Cron schedule |
| `src/composables/useNotification.ts` | Refactor | Mock → Realtime listener |
| `src/types/notification.types.ts` | Nouveau | Types TypeScript |
| `src/views/DetailDemandeView.vue` | Minor update | Badge "Patient notifié" |
| `src/views/ListeDemandesView.vue` | Minor update | Highlight patient "Action requise" |

### Non-affectés

- Tous les stores (demandes, cagnotte, propositions, chat) — zéro changement
- `src/services/` — zéro changement
- `src/stores/auth.store.ts` — zéro changement
- Tous les autres composants Vue — zéro changement

## Implementation Sequence

```
1. Migration SQL : table notification_emails + RLS
2. Créer src/types/notification.types.ts
3. Créer notify-patient Edge Function (webhook receiver + Resend)
4. Configurer Database Webhook dans Supabase dashboard
5. Stocker RESEND_API_KEY comme secret Supabase
6. Tester notify-patient en local (supabase functions serve + curl)
7. Créer retry-notifications Edge Function
8. Configurer cron dans config.toml + déployer
9. Refactorer useNotification.ts (mock → realtime listener)
10. Ajouter badge "Patient notifié" dans DetailDemandeView.vue
11. Ajouter highlight "Action requise" dans ListeDemandesView.vue (vue patient)
12. Test bout-en-bout : Prop3 → email reçu → confirmation aidant → highlight patient
```
