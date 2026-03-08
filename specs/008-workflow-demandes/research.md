# Research: 008-workflow-demandes

**Phase 0 — Résolution des inconnues**
**Date**: 2026-03-07

---

## Décision 1 — Identification du scénario 1 vs scénarios 2/3

**Question**: Comment différencier automatiquement le scénario 1 (aidant unique) des scénarios 2/3 (deux aidants distincts) lors de l'entrée en état D ?

**Décision**: Ajouter un champ `singleAidant: boolean` sur `Demande` (colonne `single_aidant` en BDD). Il est positionné à `true` uniquement quand une proposition `prop_achat_transport` est soumise. La logique dans le store (`propositions.store.ts`) lit ce flag après l'entrée en état D pour décider si la transition D→F est automatique.

**Rationale**: Simple, explicite, testable sans ambiguïté. Pas besoin de comparer `acheteurId === transporteurId` (qui serait équivalent mais moins lisible).

**Alternatives considérées**:
- Comparer `acheteurId === transporteurId` → moins clair, couplage implicite
- Ajouter un `scenarioType: 1 | 2 | 3` → redondant, calculable depuis `singleAidant`

---

## Décision 2 — Transition D→F automatique (scénario 1)

**Question**: La transition D→F dans le scénario 1 est-elle un événement de la state machine ou une logique de store ?

**Décision**: La transition D→F automatique est gérée dans le **store** (`propositions.store.ts`), pas dans la state machine. Après avoir mis la demande à l'état D via `prop_achat_transport`, le store détecte `singleAidant === true`, appelle `updateStatut(id, 'rdv_a_fixer')` immédiatement. La state machine expose la transition `D → rdv_a_fixer` via l'événement `auto_rdv_patient`.

**Rationale**: La state machine reste pure (sans effets de bord), le store orchestrate la séquence. Conforme au pattern existant.

---

## Décision 3 — Verrous anti-doublon : stockage

**Question**: Les verrous `acheteurLockedUntil` / `transporteurLockedUntil` sont-ils en base ou en mémoire ?

**Décision**: **En base** — colonnes `acheteur_locked_until TIMESTAMPTZ` et `transporteur_locked_until TIMESTAMPTZ` dans la table `demandes`. La vérification est faite dans `SupabasePropositionService.create()` avant l'insert. Durée par défaut : 24h (constante `LOCK_DURATION_HOURS = 24`).

**Rationale**: Persistant, multi-device, pas de race condition côté serveur. Les verrous survivent aux crashes app.

**Alternatives considérées**:
- Verrou en mémoire (Pinia) → ne survit pas au reload, multi-device impossible
- Verrou via RLS Supabase → complexité excessive pour un MVP

---

## Décision 4 — Extension de la table `notification_emails`

**Question**: La table `notification_emails` a un `UNIQUE(demande_id)` — comment gérer plusieurs emails par demande ?

**Décision**: Ajouter une colonne `event_type VARCHAR` (valeurs: `rdv_patient`, `acheteur_transporteur_dispo`, `transporteur_acheteur_pret`) et changer la contrainte unique en `UNIQUE(demande_id, event_type)`. La fonction Edge `notify-patient` est refactorisée pour recevoir le `event_type` dans le payload (via un champ supplémentaire dans le webhook ou via la nouvelle valeur de statut + old_statut).

**Rationale**: La table reste le journal d'audit de toutes les notifications. Un seul email par `(demande_id, event_type)` garantit l'idempotence.

---

## Décision 5 — Suppression de la cagnotte

**Question**: Quels fichiers supprimer, quelles références mettre à jour ?

**Décision**: Suppression complète des fichiers suivants :
- `src/types/cagnotte.types.ts`
- `src/stores/cagnotte.store.ts`
- `src/services/interfaces/ICagnotteService.ts`
- `src/services/mock/MockCagnotteService.ts`
- `src/services/mock/data/cagnottes.mock.ts`
- `src/services/supabase/SupabaseCagnotteService.ts`
- `src/components/CagnotteProgress.vue`
- `src/components/ContributionForm.vue`

Le champ `cagnotteId` de `Demande` est supprimé. Le champ `montantContribue` de `Proposition` est supprimé. Références dans `DetailDemandeView.vue` et `PropositionPanel.vue` sont nettoyées.

Côté BDD : `DROP TABLE contributions; DROP TABLE cagnottes;` (à faire dans Supabase SQL Editor en dev).

---

## Décision 6 — Identité du rôle dans la vue (aidant-acheteur vs aidant-transporteur)

**Question**: Comment `DetailDemandeView.vue` identifie-t-il si l'utilisateur courant est l'acheteur assigné ?

**Décision**: Ajout d'un computed `estAcheteur` basé sur `currentUser.value?.id === demande.value?.acheteurId`. Parallèle à `estTransporteur` existant. Ces deux computed pilotent la visibilité des boutons contextuels (D→E pour l'acheteur, E→F pour le transporteur).

---

## Décision 7 — Gestion du mock pour le développement

**Question**: Le mock service doit-il être mis à jour ou peut-on développer directement sur Supabase ?

**Décision**: **Mise à jour du mock** — les services mock sont mis à jour pour refléter le nouveau workflow. Cela permet de tester l'UI sans Supabase (développement web avec `ionic serve`). La migration Supabase est une étape distincte.

---

## Résumé des décisions

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Détection scénario 1 | Champ `singleAidant` sur Demande |
| 2 | Transition D→F auto | Logique store (pas state machine) |
| 3 | Verrous | Colonnes BDD `*_locked_until` |
| 4 | Multi-emails par demande | Nouvelle contrainte `UNIQUE(demande_id, event_type)` |
| 5 | Suppression cagnotte | Suppression complète fichiers + BDD |
| 6 | Identité acheteur dans UI | Computed `estAcheteur` |
| 7 | Mock vs Supabase | Mock mis à jour, migration Supabase séparée |
