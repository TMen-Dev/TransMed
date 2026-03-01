# Tasks: TransMed v1.1 — Corrections UX et nouvelles fonctionnalités

**Input**: Design documents from `/specs/002-ux-fixes/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Organization**: Tasks groupées par user story (P1 → P3), avec phases fondationnelles d'abord.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut tourner en parallèle (fichiers différents, pas de dépendances)
- **[Story]**: User story concernée (US1-US9)

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Modifications de types et services partagés, bloquants pour toutes les user stories.

- [x] T001 Ajouter `emailNotifEnvoyee?: boolean` au type `Demande` dans `src/types/demande.types.ts`
- [x] T002 [P] Ajouter `MOCK_CREDENTIALS` array dans `src/services/mock/data/users.mock.ts`
- [x] T003 [P] Ajouter méthode `authenticate(email, password)` à l'interface `src/services/interfaces/IUserService.ts`
- [x] T004 Ajouter méthode `markEmailNotifSent(id)` à l'interface `src/services/interfaces/IDemandeService.ts`
- [x] T005 Implémenter `authenticate()` dans `src/services/mock/MockUserService.ts` (lookup dans MOCK_CREDENTIALS)
- [x] T006 Implémenter `markEmailNotifSent()` dans `src/services/mock/MockDemandeService.ts`
- [x] T007 Ajouter action `markEmailNotifSent()` dans `src/stores/demandes.store.ts`
- [x] T008 Créer composable `src/composables/useNotification.ts` avec `checkAndSendEmailNotif(demande, cagnotte)`

**Checkpoint**: Infrastructure prête — toutes les user stories peuvent démarrer.

---

## Phase 2: User Story 1 — Authentification email/mot de passe (Priority: P1) 🎯

**Goal**: Remplacer les boutons "connexion rapide" par un vrai formulaire email + mot de passe.

**Independent Test**: Ouvrir l'app → saisir `alice@transmed.fr` / `test1234` → accès à la liste des demandes. Saisir des identifiants incorrects → message d'erreur visible.

- [x] T009 [US1] Remplacer la section "Connexion rapide" par un formulaire email+mot de passe dans `src/views/InscriptionView.vue` (utiliser `userService.authenticate()`, afficher erreur si invalide, bouton "Créer un compte" en lien secondaire sous le formulaire)

---

## Phase 3: User Story 2 — Navigation footer persistante (Priority: P1)

**Goal**: S'assurer que la barre d'onglets en bas est toujours visible après connexion.

**Independent Test**: Se connecter → vérifier que les onglets "Demandes" et "À propos" sont visibles en bas. Naviguer entre les onglets.

- [x] T010 [US2] Ajouter styles CSS globaux pour `ion-tab-bar` dans `src/App.vue` (`--background: #FFFFFF`, `--border: 1px solid #E8E1D9`, couleur onglet actif `#1B8C5A`)

---

## Phase 4: User Story 4 — Label "Propositions actives" (Priority: P2)

**Goal**: Afficher "Propositions actives" pour les aidants au lieu de "Demandes actives".

**Independent Test**: Se connecter comme Benjamin (aidant) → titre de la liste = "Propositions actives".

- [x] T011 [P] [US4] Changer `'Demandes actives'` en `'Propositions actives'` dans `src/views/ListeDemandesView.vue` (ligne titre de l'ion-toolbar)

---

## Phase 5: User Story 5 — Validation statut "Financé" (Priority: P2)

**Goal**: L'étape "Financé" dans la timeline n'est cochée verte que si la cagnotte est pleine.

**Independent Test**: Ouvrir demande-001 (cagnotte 45/120€, statut transporteur_disponible) → étape "Financé" grisée (non complétée).

- [x] T012 [US5] Ajouter prop optionnelle `cagnotte` à `src/components/StatutTimeline.vue` et modifier la logique `is-done` pour l'étape `fonds_atteints`: vérifier `cagnotte.montantCollecte >= cagnotte.montantCible` plutôt que l'index de statut seul
- [x] T013 [US5] Passer la prop `cagnotte` à `<StatutTimeline>` dans `src/views/DetailDemandeView.vue`

---

## Phase 6: User Story 7 — Upload ordonnance obligatoire (Priority: P2)

**Goal**: Désactiver le bouton "Publier" si aucune ordonnance n'est jointe.

**Independent Test**: Créer une demande sans ordonnance → bouton "Publier" désactivé avec message visible. Joindre une ordonnance → bouton s'active.

- [x] T014 [P] [US7] Dans `src/views/CreationDemandeView.vue`, changer `:disabled="loading"` en `:disabled="loading || !ordonance"` et ajouter un texte d'aide sous l'`OrdonanceUploader` ("L'ordonnance est obligatoire pour soumettre")

---

## Phase 7: User Story 6 — Visualisation ordonnance (Priority: P2)

**Goal**: Le bouton "Voir ordonnance" ouvre réellement une modal avec l'image mockée.

**Independent Test**: Benjamin (aidant avec Prop1 sur demande-001) → détail → cliquer "Voir l'ordonnance" → modal avec image s'affiche. Fermer la modal → retour au détail.

- [x] T015 [US6] Dans `src/views/DetailDemandeView.vue`, corriger `voirOrdonnance()` pour utiliser `modalController.create()` au lieu de `:is-open` (remplacer le `<ion-modal :is-open>` par appel programmatique), et étendre `peutVoirOrdonnance` pour inclure `prop2_transport`

---

## Phase 8: User Story 8 — Téléchargement ordonnance (Priority: P3)

**Goal**: Les aidants avec proposition et le transporteur peuvent télécharger l'ordonnance.

**Independent Test**: Benjamin (Prop1) → bouton "Télécharger ordonnance" visible → cliquer → toast confirmation. Leila (transporteur) → bouton visible. Karim (sans proposition) → pas de bouton.

- [x] T016 [US8] Dans `src/views/DetailDemandeView.vue`, ajouter computed `peutTelechargerOrdonnance` (aidant avec n'importe quelle prop OU estTransporteur), ajouter bouton "Télécharger ordonnance" dans la section ordonnance, implémenter fonction mock `telechargerOrdonnance()` qui affiche un toast IonToast

---

## Phase 9: User Story 9 — Notification email mockée (Priority: P3)

**Goal**: Toast "Email envoyé au patient" déclenché automatiquement quand demande financée + transporteur assigné.

**Independent Test**: Demande avec transporteur existant → contribuer jusqu'à 100% → toast "Email envoyé au patient" apparaît. Recharger → pas de second toast.

- [x] T017 [US9] Dans `src/stores/propositions.store.ts`, après l'appel `setTransporteur()`, appeler `checkAndSendEmailNotif(demande, cagnotte)` via le composable `useNotification`
- [x] T018 [US9] Dans `src/stores/cagnotte.store.ts`, après `objectifAtteint = true`, appeler `checkAndSendEmailNotif(demande, cagnotte)` via le composable `useNotification`
- [x] T019 [US9] Dans `src/views/DetailDemandeView.vue`, ajouter un `IonToast` et un `ref<string> toastMessage` observant `useNotification` via `watch` sur un `ref<boolean> notifTriggered` exposé par le composable — afficher le toast "Email envoyé au patient" puis remettre le flag à `false` (scope local, conforme principe V YAGNI)

---

## Phase finale: Vérification et polish

- [x] T020 [P] Vérifier conformité FR-107/FR-108 : confirmer que `<ion-buttons slot="start"><ion-back-button>` est présent dans `src/views/DetailDemandeView.vue` et `src/views/ChatView.vue` (no-op si déjà conforme — ajouter commentaire `// FR-107 ✓` au-dessus de la ligne concernée)
- [x] T021 [P] Vérifier l'ensemble de l'app après tous les changements : login, footer, back button, aidant label, timeline, ordonnance, notification
- [x] T022 [P] Lancer `npm run lint` et corriger toute erreur TypeScript

---

## Dependency Graph

```
T001 → T004, T007, T008, T012
T002 → T005
T003 → T005
T004 → T006, T007
T005 → T009
T006 → T007
T007 → T017, T018
T008 → T017, T018
T012 → T013
T013 → T015 (DetailDemandeView modifié en plusieurs passes)
```

**Stories indépendantes** (peuvent commencer après Phase 1):
- US2 (T010), US4 (T011), US7 (T014) — Aucune dépendance inter-stories
- US5 (T012-T013) — dépend uniquement de T001
- US1 (T009) — dépend de T005
- US6 (T015), US8 (T016) — dépendent de T013 (même fichier DetailDemandeView)
- US9 (T017-T019) — dépend de T007+T008

## Exécution parallèle possible

```
Batch A (parallèle):  T001, T002, T003
Batch B (parallèle):  T004, T005, T006 (après T001-T003)
Batch C (parallèle):  T007, T008, T010, T011, T014 (après T004)
Batch D (parallèle):  T009 (après T005), T012 (après T001)
Batch E:              T013 (après T012), T015 (après T013), T016 (après T015)
Batch F (parallèle):  T017, T018 (après T007+T008)
Batch G:              T019 (après T017+T018)
Batch H (parallèle):  T020, T021
```

## Périmètre MVP

Toutes les 9 user stories sont critiques pour v1.1. Ordre suggéré si livraison incrémentale:
1. T001-T009 (US1 auth) — bloque tout le reste
2. T010 (US2 footer) — navigation fondamentale
3. T011-T016 (US4, US5, US6, US7) — corrections fonctionnelles
4. T017-T019 (US9 notification) — nouveau comportement

---

## Phase 10: User Story 12 — Correction visibilité footer (Priority: P1)

**Goal**: Le footer doit être visible. Corriger le slot Ionic (web component) vs Vue (slot template).

- [x] T023 [US12] Dans `src/views/TabsView.vue`, remplacer `<template #bottom><ion-tab-bar>` par `<ion-tab-bar slot="bottom">` pour corriger le rendu web component Ionic

---

## Phase 11: User Story 10 — Page Profil + User Story 11 — Footer 3 onglets (Priority: P1)

**Goal**: Créer la page Profil et compléter le footer avec 3 onglets.

- [x] T024 [US10] Ajouter champ `email?: string` à l'interface `Utilisateur` dans `src/types/user.types.ts` et ajouter `email` dans chaque entrée de `MOCK_USERS` dans `src/services/mock/data/users.mock.ts` (correspondant aux MOCK_CREDENTIALS)
- [x] T025 [US10] Créer `src/views/ProfilView.vue` : ion-header + ion-content avec carte profil affichant prénom, rôle (patient/aidant avec libellé FR), email, et bouton "Se déconnecter" natif stylisé charte TransMed
- [x] T026 [US11] Dans `src/views/TabsView.vue`, ajouter un 3ème onglet "Profil" entre "Demandes" et "À propos" avec icône SVG personne conforme charte TransMed
- [x] T027 [US11] Dans `src/router/index.ts`, ajouter la route `{ path: 'profil', component: () => import('../views/ProfilView.vue') }` comme enfant de `/app/`
- [x] T028 [US10] Dans `src/views/ListeDemandesView.vue`, retirer le bouton logout de l'ion-toolbar (bouton SVG + fonction logout)

---

## Récapitulatif

| Phase | US | Tâches | Parallélisables |
|-------|-----|--------|-----------------|
| 1 Setup | - | T001-T008 | T002, T003 |
| 2 Auth | US1 | T009 | — |
| 3 Footer | US2 | T010 | — |
| 4 Label | US4 | T011 | Oui |
| 5 Timeline | US5 | T012-T013 | — |
| 6 Ordonnance obligatoire | US7 | T014 | Oui |
| 7 Voir ordonnance | US6 | T015 | — |
| 8 Télécharger ordonnance | US8 | T016 | — |
| 9 Notification | US9 | T017-T019 | T017, T018 |
| Final | — | T020-T021 | Oui |
| **Total** | **9 stories** | **21 tâches** | **9 parallèles** |
