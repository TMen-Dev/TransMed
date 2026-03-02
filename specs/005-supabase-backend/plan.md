# Implementation Plan: Intégration backend persistant (Supabase)

**Branch**: `005-supabase-backend` | **Date**: 2026-03-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-supabase-backend/spec.md`

## Summary

Remplacement transparent de la couche de données mockée par Supabase : Auth pour l'authentification réelle (email/password + session persistante), PostgreSQL pour toutes les entités (demandes, cagnottes, propositions, contributions, messages), et Supabase Storage (bucket privé) pour les ordonnances avec signed URLs. Le point d'injection unique `src/services/index.ts` permet de remplacer les 6 services mock par des implémentations Supabase sans toucher aux stores Pinia ni aux composants Vue.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: `@supabase/supabase-js` v2, `@capacitor/preferences` (session storage natif), Ionic 7+, Vue 3.4+, Pinia 2+, Capacitor 5+
**Storage**: Supabase PostgreSQL (entités) + Supabase Storage bucket `ordonnances` (fichiers)
**Testing**: Vitest (unitaires) + Cypress (E2E web)
**Target Platform**: iOS 16+, Android 8+, Web (PWA)
**Project Type**: Mobile (Capacitor) — structure single project existante
**Performance Goals**: Sync données < 2s, messages temps réel < 2s, accès ordonnance < 5s
**Constraints**: Sessions persistantes 7j, signed URLs 3600s, fichiers max 10 Mo, RLS côté serveur obligatoire
**Scale/Scope**: MVP — ~100 utilisateurs, ~500 demandes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Notes |
|----------|--------|-------|
| I. Stack Mobile-First (Capacitor + Ionic) | ✅ PASS | `@capacitor/preferences` pour la persistance session sur natif |
| II. Composition API (`<script setup>`) | ✅ PASS | Seule la couche service change — zéro modification des composants |
| III. TypeScript strict, pas de `any` | ✅ PASS | Types générés via `supabase gen types typescript` dans `src/types/supabase.types.ts` |
| IV. Accès natif via Capacitor plugins | ✅ PASS | Stockage de session via `CapacitorPreferencesStorage` adapter pour Supabase client |
| V. Simplicité / YAGNI | ✅ PASS | Pas de nouvelle abstraction — les interfaces existantes sont conservées telles quelles |

**Verdict**: ✅ Toutes les gates passent. Aucune violation à justifier.

## Project Structure

### Documentation (this feature)

```text
specs/005-supabase-backend/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — patterns Supabase + RLS + realtime
├── data-model.md        # Phase 1 — schéma PostgreSQL + RLS policies
├── quickstart.md        # Phase 1 — guide de démarrage développeur
├── contracts/           # Phase 1 — patterns d'appel Supabase client
└── tasks.md             # Phase 2 — généré par /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── lib/
│   └── supabase.ts                   ← NEW — client Supabase (singleton, storage adapter Capacitor)
├── types/
│   ├── supabase.types.ts             ← NEW — types générés par supabase CLI (database schema)
│   ├── demande.types.ts              ← unchanged
│   ├── user.types.ts                 ← minor update: email requis dans Utilisateur
│   └── ordonance.types.ts            ← update: signedUrl remplace base64Data
├── services/
│   ├── interfaces/                   ← UNCHANGED — 6 interfaces conservées telles quelles
│   ├── mock/                         ← UNCHANGED — conservé pour tests unitaires offline
│   └── supabase/                     ← NEW — 6 implémentations Supabase
│       ├── SupabaseUserService.ts    ← auth.signUp / signInWithPassword / getUser
│       ├── SupabaseDemandeService.ts ← CRUD demandes + updateStatut
│       ├── SupabaseCagnotteService.ts ← CRUD cagnottes + contributions
│       ├── SupabaseMessageService.ts ← getByDemandeId + send + realtime subscription
│       ├── SupabaseOrdonanceService.ts ← upload bucket + createSignedUrl
│       └── SupabasePropositionService.ts ← getByDemandeId + create
├── stores/
│   └── auth.store.ts                 ← UPDATE — session Supabase + onAuthStateChange
└── services/
    └── index.ts                      ← UPDATE — importer SupabaseXxxService au lieu de MockXxxService

supabase/
├── migrations/
│   ├── 001_initial_schema.sql        ← CREATE TABLE + indexes
│   └── 002_rls_policies.sql          ← RLS policies par entité
└── config.toml                       ← config locale Supabase CLI

tests/
├── unit/
│   └── services/supabase/            ← tests avec supabase-js mock
└── integration/
    └── supabase/                     ← tests contre Supabase local (CLI)
```

**Structure Decision**: Single project mobile (Option 3 adapté). Ajout du dossier `src/lib/` pour le client Supabase et `src/services/supabase/` pour les implémentations. Toute la logique métier reste dans les stores et composants existants — seule la couche service est étendue.

## Phase 0: Research

→ Voir [research.md](./research.md) pour les décisions techniques détaillées.

**Points résolus** :
1. Session persistence : `CapacitorStorageAdapter` (adapter custom utilisant `@capacitor/preferences`) pour fonctionner sur iOS/Android sans localStorage
2. Realtime chat : `supabase.channel('messages:demandeId').on('postgres_changes', ...)` — unsubscribe au unmount Vue
3. Signed URLs : `supabase.storage.from('ordonnances').createSignedUrl(path, 3600)` — 60 min
4. RLS : `auth.uid()` pour isolation patient, fonction `has_proposition()` pour accès ordonnances
5. Types : `supabase gen types typescript --project-id <id> > src/types/supabase.types.ts`
6. Package : `@supabase/supabase-js@^2.x` — `import { createClient } from '@supabase/supabase-js'`

## Phase 1: Design

→ Voir [data-model.md](./data-model.md) pour le schéma PostgreSQL complet.
→ Voir [contracts/](./contracts/) pour les patterns d'appel Supabase client.
→ Voir [quickstart.md](./quickstart.md) pour le guide de démarrage.

### Composants affectés

| Composant | Changement | Impact |
|-----------|------------|--------|
| `src/services/index.ts` | Swap Mock → Supabase | **Point unique — 6 lignes** |
| `src/stores/auth.store.ts` | Session Supabase réelle | Ajout `initSession()`, `onAuthStateChange()` |
| `src/types/user.types.ts` | `email` requis | Type update mineur |
| `src/types/ordonance.types.ts` | `signedUrl` + `storagePath` | Type update + adaptation composant |
| `src/lib/supabase.ts` | Nouveau | Client singleton |
| `src/services/supabase/*.ts` | Nouveau (×6) | Implémentations Supabase |
| `supabase/migrations/*.sql` | Nouveau | Schema + RLS |

### Non-affectés (zéro modification)

- Tous les composants Vue (`*.vue`) — zéro changement
- Tous les stores sauf `auth.store.ts` — zéro changement
- Les interfaces `src/services/interfaces/` — zéro changement
- Les services mock — conservés (tests offline)
- Le state machine `demandeStateMachine.ts` — zéro changement
- Les types sauf `user.types.ts` et `ordonance.types.ts` — zéro changement

## Implementation Sequence

```
1. Installer @supabase/supabase-js
2. Créer projet Supabase (cloud ou local CLI)
3. Créer src/lib/supabase.ts (client + Capacitor storage adapter)
4. Écrire migrations SQL (schema + RLS)
5. Générer src/types/supabase.types.ts via CLI
6. Implémenter SupabaseUserService (auth)
7. Mettre à jour auth.store.ts (session persistante)
8. Implémenter SupabaseDemandeService
9. Implémenter SupabaseCagnotteService + SupabasePropositionService
10. Implémenter SupabaseMessageService (avec realtime)
11. Implémenter SupabaseOrdonanceService (Storage + signed URLs)
12. Mettre à jour src/services/index.ts (swap)
13. Mettre à jour les types user + ordonance
14. Tests integration + vérification RLS
```
