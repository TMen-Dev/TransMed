# Tasks: Visibilité Aidant & Filtre Liste Demandes (011)

**Input**: Design documents from `/specs/011-aidant-visibility-filter/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, quickstart.md ✓

**Organization**: Tasks grouped by user story. US3 et US4 partiellement déjà implémentés — voir notes par phase.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (Aucune — infrastructure existante)

> Pas de nouveau projet, pas de nouvelle dépendance. Stack existante : Ionic 7 + Vue 3.4 + TypeScript + Pinia + Supabase.

**Checkpoint** : Pas de setup requis — passer directement en Phase 2.

---

## Phase 2: Fondations (Prérequis bloquants)

**Purpose**: Migration RLS + constante TypeScript — bloquent toutes les user stories

**⚠️ CRITIQUE** : Aucune user story ne peut être validée sans la migration RLS.

- [x] T001 Appliquer la migration RLS `010_fix_demandes_aidant_proposition_visibility.sql` via `mcp__supabase__apply_migration` (projet `vhealjcvmvvpxgaycfli`)
- [x] T002 Ajouter `STATUTS_LECTURE_SEULE` dans `src/types/demande.types.ts` après `STATUTS_ANNULABLES`

**Checkpoint** : Migration appliquée + constante exportée → user stories peuvent démarrer.

---

## Phase 3: User Story 2 — Accès restreint statuts E/G (Priority: P1) 🎯 MVP

**Goal**: Les aidants non impliqués ne voient plus les demandes en statuts E/G/H. Un aidant ayant émis une proposition conserve la visibilité jusqu'au statut H.

**Independent Test** (T2 quickstart.md):
1. Ben fait une proposition sur "Amina — 1455"
2. Amina accepte → statut passe en E ou plus
3. Ben voit toujours la demande dans sa liste ✓
4. Un aidant sans proposition ne voit pas les demandes E/G/H ✓

### Implementation pour US2

- [x] T003 [US2] Vérifier que T001 couvre le cas : aidant avec proposition voit demandes E/F/G/H — valider via SQL `SELECT` dans Supabase Studio ou test manuel T2
- [x] T004 [US2] Vérifier que ListeDemandesView `estImplique()` inclut bien `propositions[].aidantId` dans `src/views/ListeDemandesView.vue`

**Checkpoint** : T2 quickstart.md passe → US2 livrée.

---

## Phase 4: User Story 3 — Visibilité complète aidants impliqués + badge lecture seule (Priority: P1)

**Goal**: Un aidant impliqué (proposition, acheteur ou transporteur) voit toutes ses demandes quel que soit le statut. Les demandes E/F/G/H s'affichent en lecture seule avec un indicateur explicite.

**Independent Test** (T3 quickstart.md):
1. Ben ouvre "Amina — tebessa" (statut `en_cours_livraison_patient`)
2. Un banner "Lecture seule" s'affiche ✓
3. Aucun bouton de proposition n'est visible ✓

### Implementation pour US3

- [x] T005 [P] [US3] Importer `STATUTS_LECTURE_SEULE` dans `src/views/DetailDemandeView.vue`
- [x] T006 [US3] Ajouter computed `estLectureSeule` dans `src/views/DetailDemandeView.vue` (dépend de T002, T005)
- [x] T007 [US3] Ajouter le banner "Lecture seule" dans le template de `src/views/DetailDemandeView.vue` après l'urgence-banner (dépend de T006)
- [x] T008 [US3] Conditionner `peutProposer` avec `!estLectureSeule` dans `src/views/DetailDemandeView.vue` (dépend de T006)

**Checkpoint** : T3 quickstart.md passe → US3 livrée.

---

## Phase 5: User Story 1 — Contrôle actions aidant par statut (Priority: P1)

**Goal**: En statut B, seul `prop_transport` est proposable. En statut C, seul `prop_achat_envoi` est proposable. Ces restrictions sont visuellement claires.

**Independent Test** (T4 quickstart.md):
1. Demande en statut B → seule l'option "Transport" visible dans PropositionPanel ✓
2. Demande en statut C → seule l'option "Achat+Envoi" visible dans PropositionPanel ✓

### Implementation pour US1

- [x] T009 [US1] Vérifier que `demandeStateMachine.ts` couvre déjà FR-004/FR-005 — audit `TRANSITIONS` pour `medicaments_achetes_attente_transporteur` et `transporteur_disponible_attente_acheteur`
- [x] T010 [US1] Vérifier que `PropositionPanel.vue` délègue à `canTransition()` pour les types de proposition autorisés — lecture seule, aucun changement attendu selon research.md décision 1

> **Note** : Selon research.md, US1 est déjà entièrement couverte par la state machine. T009/T010 sont des tâches de validation pure (lecture + confirmation), pas d'implémentation.

**Checkpoint** : T4 quickstart.md passe → US1 validée (déjà implémentée).

---

## Phase 6: User Story 4 — Filtre liste demandes aidant (Priority: P2)

**Goal**: L'aidant peut filtrer sa liste de demandes : Toutes / Nouvelles / En cours / Mes engagements / Traitées. Le filtre est conservé au pull-to-refresh.

**Independent Test** (T1 quickstart.md):
1. Connecter Ben (aidant)
2. Barre de filtres visible : Toutes · Nouvelles · En cours · Mes engagements · Traitées ✓
3. "Nouvelles" → seule "Amina — 1455" (statut A) apparaît ✓
4. "Traitées" → demandes traitées de Ben apparaissent ✓
5. Pull-to-refresh → filtre conservé ✓

### Implementation pour US4

- [x] T011 [US4] Valider présence des 5 chips de filtre dans `src/views/ListeDemandesView.vue` (Toutes / Nouvelles / En cours / Mes engagements / Traitées)
- [x] T012 [US4] Valider que `filtreActif` ref persiste sur pull-to-refresh dans `src/views/ListeDemandesView.vue`
- [x] T013 [US4] Valider compteurs par filtre affichés correctement dans `src/views/ListeDemandesView.vue`
- [x] T014 [US4] Valider que `onIonViewWillEnter` (pas `onMounted`) déclenche le fetch dans `src/views/ListeDemandesView.vue`
- [x] T015 [US4] Valider canal Realtime UPDATE sur `demandes` dans `src/views/ListeDemandesView.vue`

> **Note** : Selon research.md décision 4, US4 est déjà implémentée. T011→T015 sont des tâches de validation.

**Checkpoint** : T1 quickstart.md passe → US4 validée.

---

## Phase 7: Polish & Vérification croisée

- [x] T016 [P] Valider dans `src/views/ListeDemandesView.vue` que la computed `listeDemandes` exclut les demandes en statuts E et G pour un aidant sans implication (ni acheteurId, ni transporteurId, ni proposition) — test manuel : connecter un aidant sans engagement et vérifier l'absence de demandes E/G dans la liste affichée
- [x] T017 [P] Valider le cas "aidant à la fois acheteur ET transporteur" sur une demande en statut E ou G dans `src/views/ListeDemandesView.vue` et `src/views/DetailDemandeView.vue` : demande visible + badge lecture seule + infos livraison complètes
- [x] T018 [P] Lancer `pnpm run lint` — zéro erreur TypeScript strict
- [x] T019 [P] Lancer `npm test` (Vitest) — zéro régression
- [ ] T020 Dérouler les 4 scénarios complets de `specs/011-aidant-visibility-filter/quickstart.md`
- [x] T021 Mettre à jour `CLAUDE.md` avec les patterns introduits par cette feature (STATUTS_LECTURE_SEULE, estLectureSeule)

---

## Dépendances & Ordre d'exécution

### Dépendances entre phases

- **Phase 2** : Aucun prérequis → à exécuter en premier
- **Phase 3** (US2) : Dépend de T001 (migration RLS)
- **Phase 4** (US3) : Dépend de T002 (STATUTS_LECTURE_SEULE)
- **Phase 5** (US1) : Indépendante — validation pure
- **Phase 6** (US4) : Indépendante — validation pure
- **Phase 7** : Dépend de toutes les phases précédentes (21 tâches au total)

### Dépendances intra-story

- T006 dépend de T002 (constante) + T005 (import)
- T007 dépend de T006 (computed estLectureSeule)
- T008 dépend de T006 (computed estLectureSeule)

### Opportunités de parallélisme

```bash
# Phase 2 — séquentiel (T001 puis T002)
T001 → T002

# Phase 4 (US3) — T005 + T009 + T011 en parallèle
T005 (import DetailDemandeView)
T009 (audit stateMachine)
T011 (audit ListeDemandesView filtres)
→ Puis T006, T007, T008 séquentiellement

# Phase 7
T018 (lint) || T019 (tests) — en parallèle
```

---

## Stratégie d'implémentation

### MVP (US2 + US3 seulement — phases 2, 3, 4)

1. Appliquer migration T001
2. Ajouter constante T002
3. Valider RLS T003/T004
4. Ajouter badge lecture seule T005→T008
5. **STOP & VALIDER** : T2 + T3 quickstart.md
6. Livrer : aidants voient leurs demandes + badge explicite

### Livraison complète

1. MVP validé
2. Valider US1 (T009/T010) — probablement déjà OK
3. Valider US4 (T011→T015) — probablement déjà OK
4. Polish (T018→T021)

---

## Notes

- [P] = fichiers différents, pas de dépendance
- [USn] = user story correspondante dans spec.md
- US1 et US4 sont déjà implémentées selon research.md — tâches de validation uniquement
- La migration T001 est le seul vrai "risque" de cette feature (RLS Supabase)
- Rendu filtre cible < 100ms (local, pas de requête réseau)
