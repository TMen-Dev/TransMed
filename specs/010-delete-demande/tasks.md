# Tasks: Suppression de demande par le patient (010)

**Input**: Design documents from `specs/010-delete-demande/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅

**Organization**: Tâches groupées par user story pour une implémentation et un test indépendants.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, sans dépendances)
- **[Story]**: User story concernée (US1–US3)
- Tous les chemins sont relatifs à la racine du projet

---

## Phase 1: Setup (Migration SQL)

**Purpose**: RLS policy DELETE dans Supabase — prérequis bloquant pour tester la suppression réelle

- [X] T001 Exécuter migration SQL 010_a dans Supabase SQL Editor : `CREATE POLICY "patient_delete_own_demande" ON demandes FOR DELETE TO authenticated USING (patient_id = auth.uid())` (voir quickstart.md)

**Checkpoint**: Policy DELETE active — le patient peut supprimer ses propres demandes via RLS

---

## Phase 2: Foundational (Types & Interface)

**Purpose**: Fondations partagées entre toutes les user stories

- [X] T002 Ajouter constante `STATUTS_ANNULABLES: ReadonlyArray<StatutDemande>` dans `src/types/demande.types.ts` : valeurs `['nouvelle_demande', 'medicaments_achetes_attente_transporteur', 'transporteur_disponible_attente_acheteur']`
- [X] T003 Ajouter méthode `delete(id: string): Promise<void>` dans `src/services/interfaces/IDemandeService.ts` avec JSDoc décrivant la suppression en cascade (Storage + messages + propositions + ordonnances + demandes)

**Checkpoint**: Types et interface à jour — toutes les phases US peuvent démarrer

---

## Phase 3: User Story 1 — Suppression depuis le détail (Priority: P1)

**Goal**: Le patient peut supprimer sa demande depuis DetailDemandeView avec confirmation, et est redirigé vers la liste.

**Independent Test**: Créer une demande en `nouvelle_demande`, ouvrir le détail en tant que patient, cliquer "Supprimer la demande", confirmer → toast succès + redirection vers `/app/demandes` + demande disparue.

### Implémentation US1

- [X] T004 [P] [US1] Implémenter `delete(id)` dans `src/services/supabase/SupabaseDemandeService.ts` : 1) faire `SELECT storage_path FROM ordonnances WHERE demande_id = id` (requête séparée — `SELECT_FULL` ne retourne que `ordonnances(id)`, pas `storage_path`) ; 2) si `storage_path` trouvé → `supabase.storage.from('ordonnances').remove([storagePath])` (non-bloquant : log warning si erreur, ne pas throw) ; 3) `DELETE FROM messages WHERE demande_id = id` (explicite, sans dépendance au CASCADE) ; 4) `DELETE FROM propositions WHERE demande_id = id` (explicite) ; 5) `DELETE FROM ordonnances WHERE demande_id = id` (explicite) ; 6) `DELETE FROM demandes WHERE id = id` (RLS garantit patient_id = auth.uid()) — throw `"Demande introuvable ou non autorisée"` si aucune ligne affectée — utiliser le champ `ordonanceId` (avec 1 seul 'n', typo existant dans le codebase) pour référencer l'entrée ordonnance
- [X] T005 [P] [US1] Implémenter `delete(id)` dans `src/services/mock/MockDemandeService.ts` : trouver la demande par id dans `this.demandes`, throw `"Demande introuvable"` si absente (le mock n'a pas accès au contexte auth — la vérification de propriété est sautée en mode mock, seule l'existence est vérifiée), retirer du tableau
- [X] T006 [US1] Ajouter action `supprimerDemande(id: string): Promise<void>` dans `src/stores/demandes.store.ts` : appelle `demandeService.delete(id)`, puis retire la demande du tableau `demandes` local (optimiste côté client)
- [X] T007 [US1] Modifier `src/views/DetailDemandeView.vue` : ajouter bouton "Supprimer la demande" rouge visible uniquement si `isPatient && STATUTS_ANNULABLES.includes(demande.statut)` (v-if), clic → `alertController.create()` programmatique avec message "Cette action est irréversible", bouton "Supprimer" destructif → `demandeStore.supprimerDemande(id)` → `router.replace('/app/demandes')`, toast d'erreur si échec

**Checkpoint**: US1 — Patient supprime sa demande depuis le détail, redirigé vers la liste

---

## Phase 4: User Story 2 — Blocage selon l'état (Priority: P2)

**Goal**: La suppression est impossible pour les demandes en état avancé — le bouton est absent en UI et le service lève une erreur en défense.

**Independent Test**: Ouvrir une demande en état `transporteur_et_medicaments_prets` en tant que patient → aucun bouton "Supprimer" visible. Tenter via API → erreur levée.

### Implémentation US2

- [X] T008 [US2] Ajouter garde d'état dans `src/services/supabase/SupabaseDemandeService.ts` dans la méthode `delete()` : lire le statut de la demande avant de supprimer, throw `"Suppression impossible : demande en cours (état ${statut})"` si `!STATUTS_ANNULABLES.includes(statut)` — double sécurité côté service (la UI gère déjà le v-if)

**Checkpoint**: US2 — Aucun bouton visible sur les états verrouillés ; service refuse la suppression

---

## Phase 5: User Story 3 — Suppression depuis la liste (Priority: P3)

**Goal**: Le patient peut supprimer une demande directement depuis la liste via swipe-left.

**Independent Test**: Depuis ListeDemandesView, swiper à gauche sur une carte de demande annulable → bouton rouge "Supprimer" → confirmation → carte disparaît de la liste.

### Implémentation US3

- [X] T009 [US3] Modifier `src/views/ListeDemandesView.vue` : envelopper les `DemandeCard` des demandes du patient dans `<ion-item-sliding>` + `<ion-item-options side="end">` avec `<ion-item-option color="danger">` "Supprimer" visible uniquement si `isPatient && STATUTS_ANNULABLES.includes(demande.statut)` ; clic → même `alertController` programmatique que T007 → `demandeStore.supprimerDemande(id)`

**Checkpoint**: US3 — Swipe-to-delete fonctionnel depuis la liste

---

## Phase Finale: Polish & Vérifications

- [X] T010 [P] Vérifier non-régression : tester les 4 scénarios de quickstart.md (suppression réussie, blocage état verrouillé, annulation confirmation, swipe-to-delete) + SC-004 : simuler une erreur réseau en coupant la connexion pendant la suppression → vérifier que la demande reste intacte dans Supabase
- [ ] T011 Déployer sur mobile : `npm run build` → `npx cap sync android` → `./gradlew assembleDebug` → `adb install -r app/build/outputs/apk/debug/app-debug.apk` (APK prêt — attente connexion USB)

---

## Dépendances & Ordre d'exécution

```
Phase 1 (SQL)
    ↓
Phase 2 (Types + Interface)
    ↓
    ┌─────────────────────┐
    ↓                     ↓
  T004 (Supabase)       T005 (Mock)      ← parallèles
    └──────┬─────────────┘
           ↓
         T006 (Store)
           ↓
         T007 (DetailDemandeView)  ←  US1 complète
           ↓
         T008 (Service guard)      ←  US2 complète
           ↓
         T009 (ListeDemandesView)  ←  US3 complète
           ↓
       Phase Finale
```

### Parallélisation

- T004 + T005 : fichiers différents, parallèles
- T010 (tests) : peut démarrer dès T009 terminé

---

## Stratégie d'implémentation

### MVP (Phase 1 + Phase 2 + Phase 3 + Phase 4)

1. Migration SQL (Phase 1) — ~5 min
2. Types + Interface (Phase 2) — ~10 min
3. Service Supabase + Mock + Store + UI détail (Phase 3) — ~45 min
4. Garde d'état service (Phase 4) — ~10 min
5. **STOP et VALIDATION** : tester la suppression de bout en bout

### Livraison incrémentale

1. Phase 1+2 → fondations prêtes
2. Phase 3 (US1) → suppression depuis le détail ✅
3. Phase 4 (US2) → blocage état verrouillé ✅
4. Phase 5 (US3) → swipe-to-delete (bonus) ✅
5. Phase Finale → polish + déploiement mobile

---

## Statistiques

| Métrique | Valeur |
|----------|--------|
| Total tâches | 11 |
| Phase Setup (SQL) | 1 tâche |
| Phase Foundational (Types+Interface) | 2 tâches |
| US1 Suppression détail (P1) | 4 tâches |
| US2 Blocage état (P2) | 1 tâche |
| US3 Swipe liste (P3) | 1 tâche |
| Phase Finale | 2 tâches |
| Tâches parallélisables [P] | 3 tâches |
| Nouveaux fichiers créés | 0 |
| Fichiers modifiés | 6 |
