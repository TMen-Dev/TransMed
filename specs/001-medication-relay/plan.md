# Implementation Plan: Mise en relation patients-aidants pour médicaments

**Branch**: `001-medication-relay` | **Date**: 2026-02-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-medication-relay/spec.md`

## Summary

Application mobile Ionic/Vue/Capacitor permettant à des patients (situés à l'étranger, ex. Algérie) de publier des demandes de médicaments disponibles en France. Des aidants peuvent proposer leur aide selon 3 modes (Prop1 : cagnotte, Prop2 : transport, Prop3 : achat + transport). Une machine d'états à 8 statuts orchestre le cycle de vie de chaque demande. Le patient doit uploader son ordonnance (obligatoire) ; les acheteurs peuvent la télécharger. MVP avec données mockées, architecture prête pour Supabase + Supabase Storage.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Ionic 7+, Vue 3.4+, Capacitor 5+, Pinia 2+, Vue Router 4, Vite 5, `@capacitor/camera`, `@capacitor/filesystem`
**Storage**: MVP — mock data TypeScript/JSON + base64 locale (ordonnances) ; Future — Supabase (PostgreSQL) + Supabase Storage (ordonnances, bucket privé + signed URLs)
**Testing**: Vitest (unitaires), Cypress (E2E web)
**Target Platform**: iOS 14+ / Android 10+ / Web (développement)
**Project Type**: Mobile app (Ionic + Capacitor), monorepo unique
**Performance Goals**: Transitions entre vues < 300ms ; calcul de transition d'état < 10ms
**Constraints**: Dépendances compatibles Capacitor ; couche données abstraite derrière interface ; `<script setup>` obligatoire ; pas de `any` ; machine d'états centralisée dans le store
**Scale/Scope**: MVP 6 écrans, 9 entités, données mockées

## Constitution Check

| Principe | Statut | Notes |
|----------|--------|-------|
| I. Stack Mobile-First (Ionic 7+ / Vue 3 / Capacitor 5+) | ✅ PASS | Stack confirmée |
| II. Composition API Obligatoire (`<script setup>`) | ✅ PASS | Tous composants et vues |
| III. Typage Strict (TypeScript strict, pas de `any`) | ✅ PASS | Tous les types dans `src/types/` |
| IV. Accès Natif via Capacitor Plugins | ✅ PASS | `@capacitor/camera` + `@capacitor/filesystem` pour upload ordonnance |
| V. Simplicité et YAGNI | ✅ PASS | Machine d'états en table de transition pure (pas de librairie XState) |

**GATE PASS** — Aucune violation.

*Note Supabase Storage (migration future)* : ordonnances dans un bucket privé avec RLS ; accès restreint aux acheteurs via signed URLs temporaires. Aucun impact sur les interfaces de service existantes.

## Project Structure

### Documentation (this feature)

```text
specs/001-medication-relay/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — modèle de données TypeScript
├── quickstart.md        # Phase 1 — guide de démarrage
├── contracts/
│   ├── IUserService.ts
│   ├── IDemandeService.ts
│   ├── IPropositionService.ts   ← nouveau
│   ├── IOrdonanceService.ts     ← nouveau
│   ├── ICagnotteService.ts      ← nouveau
│   └── IMessageService.ts
└── tasks.md             # Phase 2 — /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── user.types.ts
│   ├── demande.types.ts        # StatutDemande (1-8), TypeEvenement
│   ├── medicament.types.ts
│   ├── proposition.types.ts    # Proposition, TypeProposition
│   ├── cagnotte.types.ts       # Cagnotte, StatutCagnotte, Contribution
│   ├── ordonance.types.ts      # Ordonance
│   └── message.types.ts
│
├── services/
│   ├── interfaces/
│   │   ├── IUserService.ts
│   │   ├── IDemandeService.ts
│   │   ├── IPropositionService.ts
│   │   ├── IOrdonanceService.ts
│   │   ├── ICagnotteService.ts
│   │   └── IMessageService.ts
│   ├── mock/
│   │   ├── data/
│   │   │   ├── users.mock.ts
│   │   │   ├── demandes.mock.ts
│   │   │   ├── propositions.mock.ts
│   │   │   ├── cagnottes.mock.ts
│   │   │   └── messages.mock.ts
│   │   ├── MockUserService.ts
│   │   ├── MockDemandeService.ts
│   │   ├── MockPropositionService.ts
│   │   ├── MockOrdonanceService.ts
│   │   ├── MockCagnotteService.ts
│   │   └── MockMessageService.ts
│   └── index.ts                # Point d'injection unique
│
├── stores/
│   ├── auth.store.ts
│   ├── demandes.store.ts       # + applyTransition(statut, evenement) pure fn
│   ├── propositions.store.ts
│   ├── cagnotte.store.ts
│   └── chat.store.ts
│
├── composables/
│   ├── useDemandes.ts
│   ├── usePropositions.ts
│   ├── useCagnotte.ts
│   ├── useOrdonance.ts         # Capacitor camera/filesystem + affichage
│   ├── useChat.ts
│   └── useCurrentUser.ts
│
├── views/
│   ├── InscriptionView.vue
│   ├── ListeDemandesView.vue   # Filtrée par rôle + statuts visibles
│   ├── CreationDemandeView.vue # Médicaments + upload ordonnance obligatoire
│   ├── DetailDemandeView.vue   # Statut + cagnotte + PropositionPanel + actions patient
│   ├── ChatView.vue
│   └── AProposView.vue
│
├── components/
│   ├── DemandeCard.vue
│   ├── StatutBadge.vue         # Badge coloré par statut (1-8)
│   ├── StatutTimeline.vue      # Progression visuelle 8 étapes
│   ├── MedicamentItem.vue
│   ├── OrdonanceUploader.vue   # Zone upload + aperçu (image/PDF)
│   ├── CagnotteProgress.vue    # Barre de progression + montant
│   ├── PropositionPanel.vue    # Sélecteur Prop1/Prop2/Prop3
│   ├── ContributionForm.vue    # Saisie montant pour Prop1
│   └── MessageBubble.vue
│
└── router/index.ts
```

### Machine d'états — Table de transition

```
Événement \ Statut →   1    2    3    4    5    6    7    8
────────────────────────────────────────────────────────────
Prop1 cagnotte++       1    2    3    4    5    –    –    –
Prop1 cagnotte=cible   4    6    3*   –    6    –    –    –
Prop2 transport        5    –    –    6    –    –    –    –
Prop3 achat+transport  6    6    6    6    6    –    –    –
Patient confirme       –    –    –    –    –    7    –    –
Aidant livre           –    –    –    –    –    –    8    –

* Statut 3 déjà en attente de transporteur uniquement — cagnotte atteinte
  ne change pas le statut 3, mais Prop2 ensuite → 6
– = transition non applicable (ignorée ou erreur)
```

### Navigation

```text
/ → /inscription (standalone, hors tabs)
/app/demandes           → ListeDemandesView (tab 1)
/app/demandes/:id       → DetailDemandeView (stack)
/app/demandes/:id/chat  → ChatView (stack)
/app/apropos            → AProposView (tab 2)
IonModal                → CreationDemandeView (depuis ListeDemandesView, Patient only)
```

**Structure Decision** : Monorepo Ionic unique. 5 services (User, Demande, Proposition, Ordonance, Cagnotte, Message) avec interface TypeScript + implémentation mock. La machine d'états est une fonction pure dans `demandes.store.ts`, sans dépendance externe.

## Complexity Tracking

Aucune violation de constitution — tableau non requis.
