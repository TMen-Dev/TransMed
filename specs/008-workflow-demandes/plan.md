# Implementation Plan: Refonte du Workflow des Demandes

**Branch**: `008-workflow-demandes` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)

## Summary

Refonte complète du cycle de vie des demandes TransMed. Suppression du modèle cagnotte (collecte de fonds communautaire). Introduction de 3 types de propositions aidant (`prop_achat_envoi`, `prop_transport`, `prop_achat_transport`) et 8 états (A-H) couvrant 3 scénarios. Ajout de verrous anti-doublon par rôle (24h), de boutons contextuels selon rôle+état, et de notifications email multi-événements via l'Edge Function existante.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode) — Deno pour les Edge Functions
**Primary Dependencies**: Ionic 7+, Vue 3.4+ (Composition API), Pinia 2+, @supabase/supabase-js v2, Resend (email)
**Storage**: Supabase PostgreSQL (demandes, propositions, notification_emails) + Supabase Storage (ordonnances, inchangé)
**Testing**: Vitest (unitaires — state machine) + tests manuels ionic serve
**Target Platform**: Android (Huawei EMUI) + Web (ionic serve)
**Project Type**: Mobile + Web (Ionic/Capacitor)
**Performance Goals**: Transitions d'état < 2s, notifications email < 60s
**Constraints**: Anti-doublon verrous persistants en BDD, anti-doublon email via contrainte UNIQUE(demande_id, event_type)
**Scale/Scope**: ~3 scénarios workflow, 8 états, 20 fichiers modifiés, 8 fichiers supprimés

## Constitution Check

| Principe | Statut | Note |
|---------|--------|------|
| I. Stack Mobile-First (Ionic 7 + Vue 3 + Capacitor 5) | ✅ PASS | Aucune nouvelle dépendance |
| II. Composition API (`<script setup>`) | ✅ PASS | Tous les composants conservent `<script setup>` |
| III. Typage Strict (TypeScript strict, pas de `any`) | ✅ PASS | Tous les nouveaux types définis dans `src/types/` |
| IV. Accès Natif via Capacitor | ✅ PASS | Pas de nouveaux accès natifs |
| V. Simplicité et YAGNI | ✅ PASS | Suppression code mort (cagnotte), pas d'abstractions prématurées |

**Résultat**: Aucune violation — plan validé.

## Project Structure

### Documentation (cette feature)

```text
specs/008-workflow-demandes/
├── spec.md              ✅ Complété
├── plan.md              ✅ Ce fichier
├── research.md          ✅ Complété
├── data-model.md        ✅ Complété
├── quickstart.md        ✅ Complété
├── contracts/
│   ├── state-machine.md ✅ Complété
│   └── services.md      ✅ Complété
├── checklists/
│   └── requirements.md  ✅ Validé
└── tasks.md             ⏳ Généré par /speckit.tasks
```

### Source Code — fichiers impactés

```text
src/
├── types/
│   ├── demande.types.ts          MODIFIÉ — nouveaux StatutDemande, TypeEvenement, Demande
│   ├── proposition.types.ts      MODIFIÉ — nouveaux TypeProposition, suppression montantContribue
│   └── cagnotte.types.ts         SUPPRIMÉ
│
├── services/
│   ├── demandeStateMachine.ts    MODIFIÉ — nouvelle table TRANSITIONS (8 états)
│   ├── index.ts                  MODIFIÉ — suppression exports cagnotte
│   ├── interfaces/
│   │   ├── IDemandeService.ts    MODIFIÉ — nouvelles méthodes
│   │   ├── IPropositionService.ts MODIFIÉ — contrat verrous
│   │   └── ICagnotteService.ts   SUPPRIMÉ
│   ├── mock/
│   │   ├── MockDemandeService.ts  MODIFIÉ
│   │   ├── MockPropositionService.ts MODIFIÉ — verrous + nouveaux types
│   │   ├── MockCagnotteService.ts SUPPRIMÉ
│   │   └── data/
│   │       ├── demandes.mock.ts   MODIFIÉ — nouveaux statuts
│   │       ├── propositions.mock.ts MODIFIÉ — nouveaux types
│   │       └── cagnottes.mock.ts  SUPPRIMÉ
│   └── supabase/
│       ├── SupabaseDemandeService.ts    MODIFIÉ — nouveau mapping + méthodes
│       ├── SupabasePropositionService.ts MODIFIÉ — verrous
│       └── SupabaseCagnotteService.ts   SUPPRIMÉ
│
├── stores/
│   ├── demandes.store.ts         MODIFIÉ — nouvelles actions, supprimer cagnotte
│   ├── propositions.store.ts     MODIFIÉ — orchestration 3 scénarios
│   └── cagnotte.store.ts         SUPPRIMÉ
│
├── components/
│   ├── StatutBadge.vue           MODIFIÉ — 8 nouveaux statuts
│   ├── StatutTimeline.vue        MODIFIÉ — 8 étapes A-H
│   ├── PropositionPanel.vue      MODIFIÉ — 3 nouveaux types, suppression cagnotte
│   ├── CagnotteProgress.vue      SUPPRIMÉ
│   └── ContributionForm.vue      SUPPRIMÉ
│
└── views/
    ├── DetailDemandeView.vue     MODIFIÉ — nouveaux boutons contextuels, computeds
    └── ListeDemandesView.vue     MODIFIÉ — filtre statuts actifs

supabase/
└── functions/
    └── notify-patient/
        └── index.ts              MODIFIÉ — multi-événements (4 types)
```

## Complexity Tracking

> Aucune violation de constitution — section non applicable.

---

## Phase 0: Research ✅

Voir [research.md](./research.md) — toutes les inconnues résolues.

## Phase 1: Design & Contracts ✅

Voir [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md).

---

## Ordre d'implémentation recommandé

### Groupe 1 — Types (fondation)
1. `src/types/demande.types.ts`
2. `src/types/proposition.types.ts`
3. Supprimer `src/types/cagnotte.types.ts`

### Groupe 2 — State Machine
4. `src/services/demandeStateMachine.ts`

### Groupe 3 — Interfaces
5. `src/services/interfaces/IDemandeService.ts`
6. `src/services/interfaces/IPropositionService.ts`
7. Supprimer `src/services/interfaces/ICagnotteService.ts`

### Groupe 4 — Mock Services (pour dev web)
8. `src/services/mock/MockDemandeService.ts`
9. `src/services/mock/MockPropositionService.ts`
10. `src/services/mock/data/demandes.mock.ts`
11. `src/services/mock/data/propositions.mock.ts`
12. Supprimer fichiers cagnotte mock

### Groupe 5 — Supabase Services
13. `src/services/supabase/SupabaseDemandeService.ts`
14. `src/services/supabase/SupabasePropositionService.ts`
15. Supprimer `src/services/supabase/SupabaseCagnotteService.ts`
16. `src/services/index.ts`

### Groupe 6 — Stores
17. `src/stores/demandes.store.ts`
18. `src/stores/propositions.store.ts`
19. Supprimer `src/stores/cagnotte.store.ts`

### Groupe 7 — Composants UI
20. `src/components/StatutBadge.vue`
21. `src/components/StatutTimeline.vue`
22. `src/components/PropositionPanel.vue`
23. Supprimer `src/components/CagnotteProgress.vue`
24. Supprimer `src/components/ContributionForm.vue`

### Groupe 8 — Vues
25. `src/views/DetailDemandeView.vue`
26. `src/views/ListeDemandesView.vue`

### Groupe 9 — Edge Function
27. `supabase/functions/notify-patient/index.ts`

### Groupe 10 — Migration BDD
28. SQL Editor Supabase (voir quickstart.md Étape 1)
