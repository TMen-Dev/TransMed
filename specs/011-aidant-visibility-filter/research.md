# Research: Visibilité Aidant & Filtre Liste Demandes (011)

## Décision 1 — State Machine comme source de vérité pour les propositions

**Décision** : `demandeStateMachine.ts` (TRANSITIONS) reste la seule source de vérité pour les types de proposition autorisés par statut.
**Rationale** : La machine d'état couvre déjà exactement FR-004 et FR-005 — `prop_achat_envoi` uniquement en statut C, `prop_transport` uniquement en statut B. `PropositionPanel.vue` délègue déjà à `canTransition()`.
**Conclusion** : Aucun changement nécessaire sur la state machine ni sur PropositionPanel. FR-004/FR-005 sont déjà satisfaits.

---

## Décision 2 — RLS : visibilité des aidants avec proposition sur statuts E/F/G/H

**Problème** : La politique RLS actuelle (migration 007) autorise les aidants à voir les demandes en statuts E, F, G, H UNIQUEMENT via `acheteur_id = auth.uid()` ou `transporteur_id = auth.uid()`. Un aidant ayant émis une proposition mais non assigné perd la visibilité dès le passage en statut E+.

**Décision** : Ajouter une clause RLS basée sur l'existence d'une proposition.

```sql
OR EXISTS (
  SELECT 1 FROM propositions
  WHERE propositions.demande_id = demandes.id
    AND propositions.aidant_id = auth.uid()
)
```

**Rationale** : Conforme à FR-002. L'aidant ayant proposé a un intérêt légitime à suivre la demande jusqu'à la fin.
**Risque** : Léger coût de la sous-requête — acceptable car `propositions.aidant_id` est indexé (FK).
**Migration** : `010_fix_demandes_aidant_proposition_visibility.sql`

---

## Décision 3 — Lecture seule côté frontend pour aidants impliqués sur E/F/G/H

**Problème** : Un aidant assigné (acheteur ou transporteur) qui ouvre une demande en statut E, F, G ou H voit actuellement `peutProposer = false` (state machine bloque les propositions), mais aucun indicateur visuel "lecture seule" n'est affiché.

**Décision** : Ajouter un computed `estLectureSeule` dans `DetailDemandeView.vue` :

```typescript
const STATUTS_LECTURE_SEULE: StatutDemande[] = [
  'en_cours_livraison_transporteur', 'rdv_a_fixer',
  'en_cours_livraison_patient', 'traitee'
]
const estLectureSeule = computed(() =>
  isAidant.value &&
  !!demande.value &&
  STATUTS_LECTURE_SEULE.includes(demande.value.statut)
)
```

Utiliser ce computed pour afficher un badge "Lecture seule" discret et masquer tous les panneaux d'action aidant.
**Rationale** : Cohérent avec FR-003 et FR-006. Aucun changement de state machine nécessaire.

---

## Décision 4 — Filtre liste : déjà implémenté

**Constat** : FR-007 → FR-014 (filtres chips) sont déjà implémentés dans `ListeDemandesView.vue` avec les 5 catégories, les compteurs, et la persistance du filtre lors du pull-to-refresh.
**Conclusion** : Pas de nouveau développement sur le filtre. Validation uniquement.

---

## Décision 5 — Pas de nouvelle migration RLS Storage

**Constat** : La migration 009 a déjà élargi `ordonnances_select` à tous les aidants.
**Conclusion** : Aucun changement RLS Storage nécessaire.

---

## Résumé des lacunes restantes

| ID | Lacune | Solution |
|----|--------|----------|
| FR-002 | Aidant avec proposition ne voit pas les demandes E/F/G/H | Migration 010 RLS |
| FR-003/FR-006 | Pas de badge "lecture seule" dans DetailDemandeView | Computed + UI |
| FR-007→14 | ✅ Déjà implémenté | — |
| FR-004/FR-005 | ✅ Déjà géré par state machine | — |
