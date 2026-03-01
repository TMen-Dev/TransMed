# Tasks: TransMed v1.2 — Workflow complet de livraison

**Input**: Design documents from `/specs/003-delivery-workflow/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Organization**: Tasks groupées par user story (P1 d'abord), avec une phase fondationnelle bloquante.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut tourner en parallèle (fichiers différents, pas de dépendances inter-tâches)
- **[Story]**: User story concernée (US1-US6)

---

## Phase 1: Fondation (bloquante pour toutes les user stories)

**Purpose**: Mettre à jour les types TypeScript, la machine d'états, les interfaces et services. Toute user story dépend de cette phase.

**⚠️ CRITIQUE**: Aucune user story ne peut démarrer tant que cette phase n'est pas complète.

- [X] T001Dans `src/types/demande.types.ts` : (a) retirer `en_cours_livraison` de `StatutDemande`, ajouter `'livraison_confirmee'` et `'livree'`; (b) retirer `'patient_confirme'` et `'aidant_livre'` de `TypeEvenement`, ajouter `'patient_confirme_livraison'`, `'transporteur_livre'`, `'patient_recoit_medicaments'`; (c) ajouter `nom: string`, `urgente: boolean`, `messageRemerciement?: string` à `Demande`; (d) ajouter `nom: string` et `urgente: boolean` à `CreateDemandeDto`

- [X] T002 Dans `src/services/demandeStateMachine.ts` : mettre à jour la table TRANSITIONS — remplacer `patient_confirme: 'en_cours_livraison'` par `patient_confirme_livraison: 'livraison_confirmee'`; ajouter la transition `livraison_confirmee: { transporteur_livre: 'livree' }`; ajouter `livree: { patient_recoit_medicaments: 'traitee' }`; retirer `en_cours_livraison` de la table et de l'ordre d'énumération (dépend de T001)

- [X] T003 [P] Dans `src/services/interfaces/IDemandeService.ts` : ajouter la signature `marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>`; mettre à jour les commentaires JSDoc de `confirmerParPatient` (→ `livraison_confirmee`) et `marquerLivree` (attend `livraison_confirmee`, retourne `livree`) (dépend de T001)

- [X] T004 Dans `src/services/mock/MockDemandeService.ts` : (a) modifier `confirmerParPatient()` → transition vers `'livraison_confirmee'` au lieu de `'en_cours_livraison'`; (b) modifier `marquerLivree()` → attend statut `'livraison_confirmee'` et passe à `'livree'`; (c) ajouter `marquerTraitee(id, messageRemerciement?)` : attend statut `'livree'`, appelle `updateStatut(id, 'traitee')`, stocke `messageRemerciement` dans la demande si fourni; (d) modifier `create()` pour inclure `nom` et `urgente` du DTO (dépend de T001, T003)

- [X] T005 Dans `src/stores/demandes.store.ts` : ajouter les 3 actions — `async function confirmerLivraison(demandeId: string)` (appelle `demandeService.confirmerParPatient()`), `async function livrerOrdonnance(demandeId: string)` (appelle `demandeService.marquerLivree()`), `async function recevoirMedicaments(demandeId: string, messageRemerciement?: string)` (appelle `demandeService.marquerTraitee()`); exposer les 3 dans le `return` (dépend de T004)

**Checkpoint**: Fondation prête — TypeScript compile, types cohérents. Toutes les user stories peuvent démarrer.

---

## Phase 2: User Story 1 — Nom et urgence de la demande (Priority: P1) 🎯

**Goal**: Champ `nom` auto-suggéré et flag `urgente` visibles à la création et dans la liste.

**Independent Test**: Créer une demande avec adresse contenant "Alger" → nom pré-rempli "Alice — Alger" → cocher urgente → badge rouge "URGENT" dans la liste.

- [X] T006 [US1] Dans `src/views/CreationDemandeView.vue` : (a) ajouter `ref<string> nom` initialisé à `''` et `ref<boolean> urgente` initialisé à `false`; (b) ajouter `ref<boolean> nomModifie` pour suivre si le patient a édité le champ; (c) ajouter un `watch(adresseLivraison, ...)` qui extrait la ville via `addr.split(',')[1]?.trim() ?? ''` et construit `"${currentUser.prenom} — ${ville || 'Médicaments'}"` dans `nom` uniquement si `!nomModifie.value`; (d) ajouter le champ `<input>` "Nom de la demande" stylisé (même style que les autres inputs natifs) après le champ adresse avec `@input="nomModifie = true"`; (e) ajouter un toggle "Demande urgente" (bouton natif style switch avec SVG éclair + label) sous le champ nom; (f) inclure `nom` et `urgente` dans le DTO envoyé au `demandeStore.createDemande()`

- [X] T007 [P] [US1] Dans `src/components/DemandeCard.vue` : (a) afficher `demande.nom` en texte principal (remplace ou complète le contenu actuel de la carte); (b) ajouter un badge rouge "URGENT" (`background:#C0392B; color:#fff; font-size:0.65rem; font-weight:700; padding:2px 8px; border-radius:100px`) visible uniquement si `demande.urgente === true`, positionné en haut à droite de la carte ou en ligne avec le nom

- [X] T008 [P] [US1] Dans `src/services/mock/data/demandes.mock.ts` : ajouter les champs `nom` et `urgente` à `demande-001` (nom: `'Alice — Alger'`, urgente: `false`) et `demande-002` (nom: `'Alice — Alger'`, urgente: `true`)

**Checkpoint**: Créer une demande → nom auto-rempli, badge URGENT visible dans la liste.

---

## Phase 3: User Story 2 — Mock data couvrant tous les statuts (Priority: P1)

**Goal**: 7 demandes mock couvrant chaque statut du workflow, permettant de tester toutes les étapes visuellement.

**Independent Test**: Alice se connecte → liste affiche des demandes dans les 7 statuts.

- [X] T009 [US2] Dans `src/services/mock/data/demandes.mock.ts` : ajouter les 6 nouvelles demandes :
  - `demande-003` : Karim, `attente_fonds_et_transporteur`, nom `'Karim — Oran'`, urgente: false, propositions: [], cagnotteId: `'cagnotte-003'`
  - `demande-004` : Alice, `fonds_atteints`, nom `'Alice — Alger'`, urgente: false, cagnotteId: `'cagnotte-004'`, propositions avec prop1 de Benjamin (montant 150€)
  - `demande-005` : Alice, `pret_acceptation_patient`, nom `'Alice — Alger'`, urgente: true, transporteurId: `'aidant-ben'`, transporteurPrenom: `'Benjamin'`, emailNotifEnvoyee: true, cagnotteId: `'cagnotte-005'`, propositions avec Prop3 de Benjamin
  - `demande-006` : Alice, `livraison_confirmee`, nom `'Alice — Alger'`, urgente: false, transporteurId: `'aidant-ben'`, transporteurPrenom: `'Benjamin'`, cagnotteId: `'cagnotte-006'`
  - `demande-007` : Alice, `livree`, nom `'Alice — Oran'`, urgente: false, transporteurId: `'aidant-leila'`, transporteurPrenom: `'Leila'`, cagnotteId: `'cagnotte-007'`
  - `demande-008` : Alice, `traitee`, nom `'Alice — Alger'`, urgente: false, transporteurId: `'aidant-ben'`, transporteurPrenom: `'Benjamin'`, messageRemerciement: `'Merci infiniment à toute l\'équipe !'`, cagnotteId: `'cagnotte-008'`, deliveredAt défini

- [X] T010 [P] [US2] Dans `src/services/mock/data/cagnottes.mock.ts` : ajouter les 6 nouvelles cagnottes associées :
  - `cagnotte-003` : demandeId `'demande-003'`, montantCible: 90, montantCollecte: 0, statut: `'en_attente_evaluation'`, contributions: []
  - `cagnotte-004` : demandeId `'demande-004'`, montantCible: 150, montantCollecte: 150, statut: `'objectif_atteint'`, contributions: [Benjamin 150€]
  - `cagnotte-005` : demandeId `'demande-005'`, montantCible: 120, montantCollecte: 120, statut: `'objectif_atteint'`, contributions: [Benjamin 120€]
  - `cagnotte-006` : demandeId `'demande-006'`, montantCible: 80, montantCollecte: 80, statut: `'objectif_atteint'`, contributions: [Benjamin 80€]
  - `cagnotte-007` : demandeId `'demande-007'`, montantCible: 60, montantCollecte: 60, statut: `'objectif_atteint'`, contributions: [Leila 60€]
  - `cagnotte-008` : demandeId `'demande-008'`, montantCible: 100, montantCollecte: 100, statut: `'objectif_atteint'`, contributions: [Benjamin 100€]

**Checkpoint**: Alice connectée → liste avec 7+ demandes couvrant chacun des 7 statuts.

---

## Phase 4: User Story 3 — Confirmation de livraison par le patient (Priority: P1)

**Goal**: Redirection automatique post-login + bouton "Confirmer la livraison" visible uniquement pour le patient propriétaire sur statut `pret_acceptation_patient`.

**Independent Test**: Alice se connecte → redirection vers `demande-005` → bouton "Confirmer la livraison" → clic → statut `livraison_confirmee`.

- [X] T011 [US3] Dans `src/router/index.ts` : dans le guard `router.beforeEach`, après la vérification d'authentification, ajouter la logique de redirection : si `to.path === '/app/demandes'` ET `currentUser.role === 'patient'` → utiliser `useDemandeStore()` pour charger les demandes du patient si le store est vide, puis chercher la demande la plus récente avec `statut === 'pret_acceptation_patient'` ET `emailNotifEnvoyee === true` ET `patientId === currentUser.id`; si trouvée → retourner `/app/demandes/${demande.id}`; ajouter un flag module-level `let redirectionConfirmDone = false` réinitialisé à chaque logout pour éviter la boucle infinie; réinitialiser le flag dans `authStore.logout()`

- [X] T012 [US3] Dans `src/views/DetailDemandeView.vue` : (a) ajouter `computed peutConfirmerLivraison` : `demande.value?.patientId === currentUser?.id && demande.value?.statut === 'pret_acceptation_patient'`; (b) ajouter le bouton "Confirmer la livraison" (bouton natif vert `#1B8C5A`, icône SVG check-circle, visible `v-if="peutConfirmerLivraison"`); (c) ajouter `async function confirmerLivraison()` qui appelle `demandeStore.confirmerLivraison(id)` et affiche un toast "Livraison confirmée !"

**Checkpoint**: Alice connectée → redirection `demande-005` → bouton visible → clic → statut `livraison_confirmee` → bouton disparu.

---

## Phase 5: User Story 4 — Marquage "Ordonnance livrée" par le transporteur (Priority: P1)

**Goal**: Bouton "Ordonnance livrée" visible uniquement pour le transporteur assigné sur statut `livraison_confirmee`.

**Independent Test**: Benjamin se connecte → `demande-006` (livraison_confirmee, transporteurId=aidant-ben) → bouton "Ordonnance livrée" visible → clic → statut `livree`.

- [X] T013 [US4] Dans `src/views/DetailDemandeView.vue` : (a) ajouter `computed peutMarquerLivree` : `demande.value?.transporteurId === currentUser?.id && demande.value?.statut === 'livraison_confirmee'`; (b) ajouter le bouton "Ordonnance livrée" (bouton natif terracotta `#C8521A`, icône SVG package, visible `v-if="peutMarquerLivree"`); (c) ajouter `async function marquerLivree()` qui appelle `demandeStore.livrerOrdonnance(id)` et affiche un toast "Ordonnance marquée comme livrée"

**Checkpoint**: Benjamin connecté → `demande-006` → bouton visible → clic → statut `livree`. Alice sur la même demande → bouton absent.

---

## Phase 6: User Story 5 — Réception des médicaments par le patient (Priority: P1)

**Goal**: Bouton "Médicaments récupérés" (patient, statut `livree`) + popup IonAlert avec message de remerciement optionnel → transition vers `traitee`.

**Independent Test**: Alice → `demande-007` (livree) → "Médicaments récupérés" → popup → message → Confirmer → statut `traitee` → message visible.

- [X] T014 [US5] Dans `src/views/DetailDemandeView.vue` : (a) ajouter `computed peutRecevoirMedicaments` : `demande.value?.patientId === currentUser?.id && demande.value?.statut === 'livree'`; (b) ajouter le bouton "Médicaments récupérés" (bouton natif gold `#C9820A`, icône SVG check, visible `v-if="peutRecevoirMedicaments"`); (c) ajouter `async function ouvrirPopupReception()` qui crée un `alertController.create()` avec header `'Médicaments récupérés'`, message `'Merci de confirmer la réception. Vous pouvez laisser un message de remerciement.'`, input `{ type: 'textarea', name: 'message', placeholder: 'Message de remerciement (optionnel)...' }`, boutons `[{ text: 'Annuler', role: 'cancel' }, { text: 'Confirmer', handler: async (data) => { await demandeStore.recevoirMedicaments(id, data.message || undefined); /* toast */ } }]`

- [X] T015 [P] [US5] Dans `src/views/DetailDemandeView.vue` : ajouter la section d'affichage du message de remerciement — `<div v-if="demande?.messageRemerciement && demande?.statut === 'traitee'" class="merci-card">` avec icône coeur SVG (color gold) et le texte du message stylisé charte TransMed (fond `#FEF9EC`, bordure `#C9820A`)

**Checkpoint**: Alice → `demande-007` → bouton → popup → confirmer avec message → `traitee` → message affiché dans le détail.

---

## Phase 7: User Story 6 — Timeline 6 étapes (Priority: P2)

**Goal**: `StatutTimeline` affiche 6 étapes (+ `livraison_confirmee` et `livree`) avec les bons libellés et l'ordre correct.

**Independent Test**: Ouvrir `demande-006` (livraison_confirmee) → 4 étapes cochées, 2 grisées.

- [X] T016 [US6] Dans `src/components/StatutTimeline.vue` : (a) remplacer `{ statut: 'en_cours_livraison', label: 'Livraison', numero: 5 }` par `{ statut: 'livraison_confirmee', label: 'Confirmé', numero: 5 }`; (b) insérer `{ statut: 'livree', label: 'Livré', numero: 6 }` avant `{ statut: 'traitee', label: 'Traité', numero: 7 }`; (c) mettre à jour le tableau `ORDRE` pour refléter la séquence complète : `['attente_fonds_et_transporteur', 'fonds_atteints', 'transporteur_disponible', 'pret_acceptation_patient', 'livraison_confirmee', 'livree', 'traitee']`; (d) s'assurer que `isEtapeDone` utilise le bon `statutIndex` pour les 7 statuts

**Checkpoint**: `demande-005` → 3 étapes cochées; `demande-006` → 4 cochées; `demande-007` → 5 cochées; `demande-008` → 6 cochées.

---

## Phase finale: Polish et vérifications croisées

**Purpose**: Nettoyer les références obsolètes à `en_cours_livraison` et valider l'ensemble.

- [X] T017 [P] Dans `src/components/StatutBadge.vue` : (a) retirer l'entrée `en_cours_livraison` du record `LIBELLES` et du style CSS `.statut-en_cours_livraison`; (b) ajouter `livraison_confirmee: 'Livraison confirmée'` (fond `#EAF3FB`, couleur `#1A5C96`, dot `#2B7CC1` avec animation dotPulse); (c) ajouter `livree: 'Livrée'` (fond `#FEF9EC`, couleur `#956208`, dot `#C9820A`)

- [X] T018 [P] Dans `src/views/DetailDemandeView.vue` : afficher `demande.nom` dans le titre de la toolbar (remplacer "Détail demande" par le nom dynamique : `{{ demande?.nom ?? 'Détail demande' }}`); afficher un badge "URGENT" rouge si `demande?.urgente === true` dans l'header ou près du titre

- [X] T019 [P] Vérifier et corriger toute référence résiduelle à `en_cours_livraison` dans tous les fichiers : `src/stores/demandes.store.ts` (constante `STATUTS_ACTIFS_AIDANT` — ne devrait pas contenir `en_cours_livraison` mais vérifier), `src/services/mock/MockDemandeService.ts` (constante `STATUTS_ACTIFS_AIDANT`), et tout autre fichier via grep

- [X] T020 [P] Lancer `npm run lint` et corriger toute erreur TypeScript ou ESLint

- [X] T021 [P] Vérification manuelle complète selon `specs/003-delivery-workflow/quickstart.md` : 6 scénarios à valider (nom/urgence, redirection, confirmation, livraison transporteur, réception patient, gardes d'accès)

---

## Dependency Graph

```
T001 (types) → T002 (state machine) → T003, T004
T003 (interface) → T004 (mock service)
T004 (mock service) → T005 (store)
T005 (store) → T012, T013, T014

Phase 2 (T001-T005) bloque TOUT

T006 (CreationDemande nom/urgente) → nécessite T001
T007 (DemandeCard) → nécessite T001 (type étendu)
T008 (mock data existantes) → nécessite T001

T009 (nouvelles demandes mock) → nécessite T001, T008
T010 (nouvelles cagnottes) → indépendant de T009 mais même fichier → séquentiel

T011 (router redirect) → nécessite T005 (store chargement)
T012 (DetailDemande btn A) → nécessite T005, T009
T013 (DetailDemande btn B) → nécessite T012 (même fichier → séquentiel conseillé)
T014 (DetailDemande btn C) → nécessite T013 (même fichier)
T015 (merci card) → nécessite T014 (même fichier)

T016 (Timeline) → nécessite T001 (types)
T017 (StatutBadge) → nécessite T001 (types)
T018 (header nom/urgente) → nécessite T009 (données)
T019 (grep en_cours_livraison) → nécessite T002, T016, T017
T020 (lint) → tout
T021 (quickstart) → tout
```

---

## Parallel Execution Opportunities

```
# Batch A (après T001 uniquement):
T002, T003, T007, T008 — fichiers différents

# Batch B (après T002+T003):
T004 (services), T016 (timeline) — fichiers différents

# Batch C (après T004):
T005, T017 — fichiers différents

# Batch D (après T005+T009):
T006, T010, T011 — fichiers différents

# Batch E (après T012):
T013 dans le même fichier DetailDemandeView (séquentiel)

# Batch F (final — après tout):
T017, T018, T019, T020 — fichiers différents → parallèles
```

---

## Implementation Strategy

### MVP (US1 + US2 seulement — données et formulaire)

1. Compléter Phase 1 (T001-T005) — fondation TypeScript
2. Compléter Phase 2 (T006-T008) — nom + urgente
3. Compléter Phase 3 (T009-T010) — mock data 7 statuts
4. **STOP** → Valider visuellement la liste et la création

### Livraison complète (toutes les user stories)

1. Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Polish
2. Chaque phase est testable indépendamment via `quickstart.md`

## Récapitulatif

| Phase | US | Tâches | Parallélisables |
|-------|-----|--------|-----------------|
| 1 Fondation | — | T001-T005 | T003 (avec T002) |
| 2 Nom + Urgence | US1 | T006-T008 | T007, T008 |
| 3 Mock data 7 statuts | US2 | T009-T010 | T010 après T009 |
| 4 Confirmation patient | US3 | T011-T012 | — |
| 5 Livraison transporteur | US4 | T013 | — |
| 6 Réception patient | US5 | T014-T015 | T015 |
| 7 Timeline 6 étapes | US6 | T016 | Oui (avec T017) |
| Polish | — | T017-T021 | T017, T018, T019, T020 |
| **Total** | **6 stories** | **21 tâches** | **11 parallélisables** |
