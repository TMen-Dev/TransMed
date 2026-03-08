# Tasks: Refonte du Workflow des Demandes

**Input**: Design documents from `/specs/008-workflow-demandes/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organisation**: Groupé par user story pour un delivery incrémental indépendant.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Peut être exécuté en parallèle (fichiers différents, pas de dépendance en attente)
- **[Story]**: User story associée (US1, US2, US3, US4)
- Chemins absolus dans les descriptions

---

## Phase 1: Setup — Suppression du modèle Cagnotte

**Purpose**: Nettoyer la codebase de tout le code cagnotte avant d'ajouter les nouveaux types.

- [x] T001 Supprimer `src/types/cagnotte.types.ts`
- [x] T002 [P] Supprimer `src/stores/cagnotte.store.ts`
- [x] T003 [P] Supprimer `src/services/interfaces/ICagnotteService.ts`
- [x] T004 [P] Supprimer `src/services/mock/MockCagnotteService.ts`
- [x] T005 [P] Supprimer `src/services/mock/data/cagnottes.mock.ts`
- [x] T006 [P] Supprimer `src/services/supabase/SupabaseCagnotteService.ts`
- [x] T007 [P] Supprimer `src/components/CagnotteProgress.vue`
- [x] T008 [P] Supprimer `src/components/ContributionForm.vue`

**Checkpoint**: Tous les fichiers cagnotte supprimés. Les erreurs TypeScript attendues seront résolues en Phase 2.

---

## Phase 2: Foundational — Types, State Machine, Services, Stores

**Purpose**: Infrastructure bloquante pour toutes les user stories. DOIT être complète avant toute phase US.

**⚠️ CRITIQUE**: Aucune user story ne peut être implémentée avant cette phase.

### Types

- [x] T009 Modifier `src/types/demande.types.ts` — Remplacer `StatutDemande` (7 → 8 valeurs : `nouvelle_demande`, `medicaments_achetes_attente_transporteur`, `transporteur_disponible_attente_acheteur`, `transporteur_et_medicaments_prets`, `en_cours_livraison_transporteur`, `rdv_a_fixer`, `en_cours_livraison_patient`, `traitee`), remplacer `TypeEvenement` (nouveaux événements selon contracts/state-machine.md), ajouter `acheteurId?`, `acheteurPrenom?`, `acheteurLockedUntil?`, `transporteurLockedUntil?`, `singleAidant?` à l'interface `Demande`, supprimer `cagnotteId`
- [x] T010 [P] Modifier `src/types/proposition.types.ts` — Remplacer `TypeProposition` par `'prop_achat_envoi' | 'prop_transport' | 'prop_achat_transport'`, supprimer `montantContribue` de `Proposition` et `CreatePropositionDto`

### State Machine

- [x] T011 Modifier `src/services/demandeStateMachine.ts` — Remplacer la table `TRANSITIONS` par la nouvelle selon contracts/state-machine.md (8 états, 10 transitions). Mettre à jour les types importés depuis `demande.types.ts`.

### Interfaces

- [x] T012 Modifier `src/services/interfaces/IDemandeService.ts` — Ajouter `confirmerEnvoiMedicaments(id)`, `confirmerReceptionTransporteur(id)`, `confirmerRdvFixe(id)`, `updateAcheteur(id, aidantId, aidantPrenom)`, `setAcheteurLock(id, lockedUntil)`, `setTransporteurLock(id, lockedUntil)`. Supprimer `confirmerParPatient()` et `marquerLivree()`. Garder `marquerTraitee()` (G→H).
- [x] T013 [P] Modifier `src/services/interfaces/IPropositionService.ts` — Mettre à jour la JSDoc de `create()` pour documenter les nouvelles règles de verrou et les états autorisés par type de proposition.

### Mock Data

- [x] T014 Modifier `src/services/mock/data/demandes.mock.ts` — Mettre à jour les données mock avec les nouveaux statuts (`nouvelle_demande` pour les demandes en attente, etc.), ajouter les nouveaux champs (`acheteurId`, `singleAidant`, etc.).
- [x] T015 [P] Modifier `src/services/mock/data/propositions.mock.ts` — Mettre à jour les types de propositions (`prop_achat_envoi`, `prop_transport`, `prop_achat_transport`), supprimer les propositions `prop1_cagnotte`.

### Mock Services

- [x] T016 Modifier `src/services/mock/MockDemandeService.ts` — Implémenter `confirmerEnvoiMedicaments()` (D→E), `confirmerReceptionTransporteur()` (E→F), `confirmerRdvFixe()` (F→G), `updateAcheteur()`, `setAcheteurLock()`, `setTransporteurLock()`. Supprimer `confirmerParPatient()`, `marquerLivree()`. Mettre à jour `getActiveForAidant()` avec les nouveaux statuts actifs (A, B, C, D).
- [x] T017 Modifier `src/services/mock/MockPropositionService.ts` — Implémenter les règles de verrou (vérifier `acheteurLockedUntil` / `transporteurLockedUntil` avant d'accepter une proposition), les règles d'état autorisé par type de proposition (FR-007, FR-008, FR-009), supprimer la logique `prop1_cagnotte`.

### Service Index

- [x] T018 Modifier `src/services/index.ts` — Supprimer les imports/exports liés à la cagnotte (`MockCagnotteService`, `SupabaseCagnotteService`, `cagnotteService`).

### Stores

- [x] T019 Modifier `src/stores/demandes.store.ts` — Remplacer `confirmerParPatient()`, `confirmerLivraison()`, `livrerOrdonnance()` par `confirmerEnvoiMedicaments()`, `confirmerReceptionTransporteur()`, `confirmerRdvFixe()`. Mettre à jour `STATUTS_ACTIFS_AIDANT` avec `['nouvelle_demande', 'medicaments_achetes_attente_transporteur', 'transporteur_disponible_attente_acheteur', 'transporteur_et_medicaments_prets']`. Ajouter action `setAcheteur()`. Supprimer `marquerLivree()` en doublon.
- [x] T020 Modifier `src/stores/propositions.store.ts` — Refactoriser `createProposition()` pour gérer les 3 scénarios : (1) `prop_achat_transport` → setAcheteur + setTransporteur + setLocks + triggerTransition(D) + si `singleAidant` triggerTransition(F) auto ; (2) `prop_achat_envoi` → setAcheteur + setAcheteurLock + triggerTransition(B ou D) + email si D ; (3) `prop_transport` → setTransporteur + setTransporteurLock + triggerTransition(C ou D) + email si D. Supprimer toute référence à cagnotteStore et prop1_cagnotte.

**Checkpoint**: `ionic serve` compile sans erreur. La state machine est testable en unitaire. Les services mock répondent correctement aux transitions.

---

## Phase 3: User Story 1 — Aidant Unique : Acheter et Livrer (Priority: P1) 🎯 MVP

**Goal**: Le flux complet Scénario 1 fonctionne de A à H avec un seul aidant.

**Independent Test**: Un aidant soumet `prop_achat_transport` sur une demande `nouvelle_demande` → la demande passe à `transporteur_et_medicaments_prets` puis automatiquement à `rdv_a_fixer` → le patient clique "RDV fixé" → `en_cours_livraison_patient` → le patient clique "Médicaments reçus" → `traitee`.

- [x] T021 [US1] Modifier `src/components/StatutBadge.vue` — Remplacer les 7 anciens libellés et classes CSS par les 8 nouveaux (`nouvelle_demande` → "Nouvelle demande", `medicaments_achetes_attente_transporteur` → "Médicaments achetés", `transporteur_disponible_attente_acheteur` → "Transporteur prêt", `transporteur_et_medicaments_prets` → "Prêt ✓", `en_cours_livraison_transporteur` → "En transit", `rdv_a_fixer` → "RDV à fixer", `en_cours_livraison_patient` → "En livraison", `traitee` → "Traitée ✓"). Mettre à jour les classes CSS correspondantes.
- [x] T022 [P] [US1] Modifier `src/components/StatutTimeline.vue` — Remplacer le tableau `ETAPES` (7 → 8 étapes), mettre à jour `ORDRE` avec les nouveaux statuts. Supprimer la prop `cagnotte` et la logique `isEtapeDone` basée sur la cagnotte. La logique `isEtapeDone` devient purement basée sur l'index de statut.
- [x] T023 [P] [US1] Modifier `src/components/PropositionPanel.vue` — Supprimer toute la section "Définir montant cible" et "Contribuer à la cagnotte" (Prop1), la prop `cagnotte`, les imports `ContributionForm`, `useCagnotteStore`. Remplacer les boutons Prop2/Prop3 par les 3 nouveaux types : bouton "Acheter et envoyer au transporteur" (`prop_achat_envoi`), "Proposer le transport" (`prop_transport`), "Acheter et transporter" (`prop_achat_transport`). Adapter `canProp*` avec les nouveaux événements state machine.
- [x] T024 [US1] Modifier `src/views/DetailDemandeView.vue` — (a) Supprimer imports `CagnotteProgress`, `useCagnotteStore`, `cagnotte` computed, section `<CagnotteProgress>`. (b) Remplacer le bloc patient "pret_acceptation_patient" par bloc F: bouton "RDV fixé avec transporteur" via **`v-if`** (pas `v-show` ni `:disabled`, conformément à FR-017) `isPatient && demande.statut === 'rdv_a_fixer'` → appel `confirmerRdvFixe()`. (c) Remplacer bloc transporteur "livraison_confirmee" par bloc E: bouton "Médicaments reçus" via **`v-if`** `estTransporteur && demande.statut === 'en_cours_livraison_transporteur'` → appel `confirmerReceptionTransporteur()`. (d) Mettre à jour le bloc patient "livree" en bloc G: bouton "Médicaments reçus" via **`v-if`** `isPatient && demande.statut === 'en_cours_livraison_patient'` → appel `recevoirMedicaments()`. (e) Supprimer `estTransporteur && !peutVoirOrdonnance` logique orpheline. (f) Ajouter computed `estAcheteur = currentUser?.id === demande?.acheteurId`. (g) Mettre à jour `peutProposer` computed avec les nouveaux événements. **Note**: tous les boutons d'action contextuelle DOIVENT utiliser `v-if` pour être complètement absents du DOM pour les rôles non autorisés.
- [x] T025 [P] [US1] Modifier `src/views/ListeDemandesView.vue` — Mettre à jour le filtre des statuts actifs aidant pour utiliser les nouveaux statuts (`nouvelle_demande`, `medicaments_achetes_attente_transporteur`, `transporteur_disponible_attente_acheteur`, `transporteur_et_medicaments_prets`).

**Checkpoint US1**: Scénario 1 entier (A→D→F→G→H) testable sur `ionic serve` avec un aidant mock. Les boutons F et G sont visibles uniquement pour le patient.

---

## Phase 4: User Stories 2 & 3 — Scénarios Collaboratifs (Priority: P2)

**Goal**: Les scénarios 2 et 3 (deux aidants distincts, avec état E) fonctionnent.

**Independent Test US2**: Aidant A soumet `prop_achat_envoi` (A→B), Aidant B soumet `prop_transport` (B→D). L'acheteur voit le bouton "Médicaments envoyés au transporteur" en état D. Clic → E. Le transporteur voit "Médicaments reçus" en état E → F → G → H.

**Independent Test US3**: Inverser l'ordre : Aidant B `prop_transport` (A→C), Aidant A `prop_achat_envoi` (C→D). Même suite D→E→F→G→H.

- [x] T026 [US2] Modifier `src/views/DetailDemandeView.vue` — **Dépend de T024** (modifier le fichier issu de T024). Ajouter le bloc D pour l'acheteur (scénarios 2/3) : bouton "Médicaments envoyés au transporteur" via `v-if` `estAcheteur && !demande.singleAidant && demande.statut === 'transporteur_et_medicaments_prets'`. Action → `demandeStore.confirmerEnvoiMedicaments(demande.id)`. Ajouter `loading` dédié `envoiLoading`.
- [x] T027 [P] [US2] Modifier `src/components/PropositionPanel.vue` — Vérifier que `canProp_achat_envoi` et `canProp_transport` utilisent correctement `canTransition()` avec les nouveaux événements pour afficher/masquer les boutons selon les états B et C (le bouton `prop_achat_envoi` n'apparaît qu'en état A ou C, `prop_transport` qu'en état A ou B).
- [x] T028 [P] [US3] Vérifier la logique du store `propositions.store.ts` — s'assurer que quand `prop_achat_envoi` est soumis en état C, le store appelle `triggerTransition('prop_achat_envoi')` (C→D) ET `setAcheteur()` ET `setAcheteurLock()` ET l'email `acheteur_transporteur_dispo` ou `transporteur_acheteur_pret`. Ajouter des commentaires inline si la logique est peu claire.

**Checkpoint US2/US3**: Les 3 scénarios sont testables sur `ionic serve`. Les boutons contextuels D→E (acheteur) et E→F (transporteur) sont corrects.

---

## Phase 5: User Story 4 — Verrous Anti-Doublon (Priority: P3)

**Goal**: Un second aidant ne peut pas prendre un rôle déjà réservé dans le délai de 24h.

**Independent Test**: Connecté en tant qu'aidant X ayant soumis `prop_achat_envoi`, tenter de soumettre à nouveau `prop_achat_envoi` en tant qu'aidant Y → message d'erreur explicite affiché dans `PropositionPanel.vue`. Après expiration du verrou (simulée en forçant `acheteurLockedUntil` à une date passée) → la proposition est acceptée.

- [x] T029 [US4] Modifier `src/services/mock/MockPropositionService.ts` — Vérifier et renforcer l'implémentation du verrou : lire `demande.acheteurLockedUntil` et `demande.transporteurLockedUntil`, comparer à `new Date().toISOString()`, throw une `Error` avec message explicite si verrou actif.
- [x] T030 [P] [US4] Modifier `src/services/supabase/SupabasePropositionService.ts` — Implémenter la même logique de verrou en Supabase : avant l'insert, appeler `supabase.from('demandes').select('acheteur_locked_until, transporteur_locked_until').eq('id', dto.demandeId).single()` et vérifier les timestamps. Définir la constante `LOCK_DURATION_HOURS = 24`. Après création de la proposition, appeler `setAcheteurLock()` ou `setTransporteurLock()` via le service demande.
- [x] T031 [P] [US4] Modifier `src/services/supabase/SupabaseDemandeService.ts` — Implémenter `setAcheteurLock()` et `setTransporteurLock()` : UPDATE `demandes` SET `acheteur_locked_until` / `transporteur_locked_until` = now() + 24h. Implémenter les autres nouvelles méthodes : `confirmerEnvoiMedicaments()` (D→E), `confirmerReceptionTransporteur()` (E→F), `confirmerRdvFixe()` (F→G), `updateAcheteur()`. Mettre à jour `DemandeRow` pour inclure `acheteur_id`, `acheteur_prenom`, `acheteur_locked_until`, `transporteur_locked_until`, `single_aidant`. Mettre à jour `mapRowToDemande()`. Mettre à jour `getActiveForAidant()` avec les nouveaux statuts.

**Checkpoint US4**: Les verrous bloquent correctement les doublons. Message d'erreur affiché dans l'UI.

---

## Phase 6: Polish — Edge Function & Migration Supabase

**Purpose**: Notifications email multi-événements et migration base de données de production.

- [x] T032 Refactoriser `supabase/functions/notify-patient/index.ts` — (a) Étendre `WebhookPayload` pour inclure `acheteur_id`, `transporteur_id`, `single_aidant`. (b) Remplacer la guard unique `pret_acceptation_patient` par un routing multi-événement basé sur `old_record.statut → record.statut` : (1) `* → transporteur_et_medicaments_prets` avec `single_aidant=true` → email patient `rdv_patient` ; (2) `medicaments_achetes_attente_transporteur → transporteur_et_medicaments_prets` → email acheteur `acheteur_transporteur_dispo` ; (3) `transporteur_disponible_attente_acheteur → transporteur_et_medicaments_prets` → email transporteur `transporteur_acheteur_pret` ; (4) `en_cours_livraison_transporteur → rdv_a_fixer` → email patient `rdv_patient`. (c) Passer `event_type` et `destinataire_id` dans l'upsert `notification_emails`. (d) Créer 3 templates email spécifiques (renderEmailHtml par event_type). (e) Mettre à jour la guard idempotence : vérifier `UNIQUE(demande_id, event_type)` plutôt que `demande_id` seul.
- [x] T033 [P] Exécuter la migration SQL dans Supabase SQL Editor — Appliquer le script complet de `quickstart.md` Étape 1 : `ALTER TABLE demandes ADD COLUMN ...`, migration des statuts existants, `ALTER TABLE propositions DROP COLUMN montant_contribue`, mise à jour `notification_emails`, `DROP TABLE contributions; DROP TABLE cagnottes;`.
- [x] T034 [P] Vérifier les policies RLS Supabase — S'assurer que les nouvelles colonnes (`acheteur_id`, `acheteur_locked_until`, etc.) sont accessibles aux utilisateurs authentifiés en lecture/écriture selon les policies existantes. Ajouter des policies si nécessaire.
- [x] T035 Mettre à jour la fonction SQL `update_demande_statut` dans Supabase SQL Editor — Cette fonction RPC est appelée par `SupabaseDemandeService.updateStatut()` avec `p_expected_statut` et `p_new_statut` pour garantir la concurrence optimiste. Elle doit accepter les nouveaux noms de statuts. Recréer ou ALTER la fonction pour qu'elle soit compatible avec les 8 nouveaux statuts. Tester via `supabase.rpc('update_demande_statut', ...)` en console.
- [x] T036 [P] Régénérer ou mettre à jour `src/types/supabase.types.ts` — Après la migration SQL (T033), ce fichier doit refléter le nouveau schéma : nouvelles colonnes sur `demandes`, suppression de `montant_contribue` sur `propositions`, suppression de `cagnottes`/`contributions`, `event_type` sur `notification_emails`. Si le projet utilise `supabase gen types typescript`, relancer la commande. Sinon, mettre à jour manuellement les interfaces concernées.
- [x] T037 [P] Vérifier et mettre à jour `src/components/DemandeCard.vue` — Supprimer toute référence à `cagnotte` ou `montantCollecte`. Mettre à jour l'affichage du statut si nécessaire. S'assurer que `StatutDemande` importé correspond aux nouvelles valeurs.
- [x] T038 [P] Vérifier `src/composables/useDemandeRealtime.ts` — Vérifier qu'il n'y a pas de logique conditionnelle sur les anciens noms de statuts. Mettre à jour si nécessaire.
- [x] T039 [P] Vérifier `src/composables/useNotification.ts` — Avec l'ajout de la colonne `event_type`, le payload Realtime inclura ce nouveau champ. Vérifier que la logique `row.statut === 'sent'` reste valide. Adapter si un affichage par `event_type` est souhaité.

**Checkpoint Final**: Les 3 scénarios fonctionnent en production (Supabase réel). Les emails sont envoyés automatiquement lors des transitions concernées. Aucune régression sur la création de demande, l'ordonnance et le chat.

---

## Dependency Graph

```
Phase 1 (T001-T008) ──► Phase 2 (T009-T020)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     Phase 3/US1        Phase 4/US2+3   Phase 5/US4
     (T021-T025)        (T026-T028)     (T029-T031)
              │               │               │
              └───────────────┴───────────────┘
                              ▼
                     Phase 6/Polish
                      (T032-T034)
```

### Parallélisations possibles

**Phase 1**: T002-T008 tous parallèles entre eux (fichiers indépendants).

**Phase 2**:
- T009 doit précéder T010-T020 (types de base)
- T010 peut aller en parallèle avec T009 (fichier différent)
- T011 doit suivre T009-T010 (importe les types)
- T012-T013 parallèles (interfaces différentes) après T009-T010
- T014-T015 parallèles (mock data)
- T016-T017 parallèles (services mock différents) après T012-T015
- T019-T020 parallèles (stores différents) après T016-T018

**Phase 3**: T022, T023, T025 parallèles (composants différents). T021 parallèle à T022-T025. T024 dépend de T021-T023 (importe les composants).

**Phase 5**: T029, T030, T031 parallèles (mock + supabase, fichiers différents).

**Phase 6**: T033, T034 parallèles entre eux (SQL + RLS). T032 peut démarrer en parallèle de T033-T034.

---

## Implementation Strategy

**MVP (Phase 1 + 2 + Phase 3/US1)**: Permet de livrer le scénario 1 de bout en bout. Un aidant peut prendre en charge une demande complète. Les statuts et la timeline sont corrects. Livrable immédiatement après T025.

**Incrément 2 (Phase 4/US2+US3)**: Ajoute les scénarios collaboratifs (deux aidants). Dépend de l'MVP.

**Incrément 3 (Phase 5/US4)**: Ajoute les verrous anti-doublon. Peut être implémenté en parallèle de l'incrément 2 côté mock.

**Production (Phase 6)**: Migration Supabase + Edge Function. Implémentation après validation complète en mock.

---

## Résumé

| Métrique | Valeur |
|---------|--------|
| Total tâches | 39 |
| Phase 1 (Setup) | 8 tâches |
| Phase 2 (Foundational) | 12 tâches |
| Phase 3 (US1 - MVP) | 5 tâches |
| Phase 4 (US2+US3) | 3 tâches |
| Phase 5 (US4) | 3 tâches |
| Phase 6 (Polish) | 8 tâches (T032-T039) |
| Tâches parallélisables [P] | 22 tâches |
| Fichiers supprimés | 8 fichiers |
| Fichiers modifiés | 24 fichiers |
