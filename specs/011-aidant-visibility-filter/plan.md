# Implementation Plan: Visibilité Aidant & Filtre Liste Demandes

**Branch**: `011-aidant-visibility-filter` | **Date**: 2026-03-12 | **Spec**: [spec.md](spec.md)

## Summary

Correction et renforcement des règles de visibilité et d'action pour les aidants dans TransMed. Trois axes : (1) étendre la politique RLS pour permettre aux aidants ayant émis une proposition de suivre une demande jusqu'à la clôture, (2) ajouter un indicateur "lecture seule" dans la vue détail pour les statuts E→H, (3) valider le filtre liste déjà implémenté. La state machine et PropositionPanel couvrent déjà les restrictions FR-004/FR-005.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: Ionic 7+, Vue 3.4+ (Composition API), Pinia 2+, Supabase JS v2, Vue Router 4
**Storage**: Supabase PostgreSQL (RLS) + Supabase Storage (ordonnances)
**Testing**: `npm test` (Vitest) + `npm run lint` (ESLint)
**Target Platform**: Web (ionic serve) + Android/iOS via Capacitor 5
**Project Type**: Mobile app (single codebase)
**Performance Goals**: Rendu filtre < 100ms (local, pas de requête réseau)
**Constraints**: Pas de `any` explicite, `<script setup>` obligatoire, Composition API uniquement

## Constitution Check

| Principe | Statut | Note |
|----------|--------|------|
| I. Stack Mobile-First | ✅ | Ionic 7 + Capacitor, pas de dépendance incompatible |
| II. Composition API | ✅ | Tous les composants en `<script setup>` |
| III. Typage Strict | ✅ | Nouvelle constante `STATUTS_LECTURE_SEULE` dans `src/types/` |
| IV. Capacitor Plugins | N/A | Aucun accès natif impliqué |
| V. Simplicité YAGNI | ✅ | Pas d'abstraction supplémentaire, computed local |

## Project Structure

### Documentation (cette feature)

```text
specs/011-aidant-visibility-filter/
├── plan.md          ← ce fichier
├── research.md      ← Phase 0
├── data-model.md    ← Phase 1
├── tasks.md         ← /speckit.tasks (à venir)
└── checklists/
    └── requirements.md
```

### Fichiers source impactés

```text
supabase/migrations/
└── 010_fix_demandes_aidant_proposition_visibility.sql  [NOUVEAU]

src/types/
└── demande.types.ts            [MODIFIER — ajouter STATUTS_LECTURE_SEULE]

src/views/
└── DetailDemandeView.vue       [MODIFIER — computed estLectureSeule + badge UI]

src/views/
└── ListeDemandesView.vue       [VALIDER — filtre déjà implémenté]
```

## Phases d'implémentation

### Phase A — Migration RLS (priorité haute)

**Fichier** : `supabase/migrations/010_fix_demandes_aidant_proposition_visibility.sql`

Ajouter une clause à `demandes_select` pour les aidants ayant une proposition :

```sql
DROP POLICY IF EXISTS "demandes_select" ON demandes;
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    patient_id = auth.uid()
    OR (current_user_role() = 'aidant' AND statut IN (
      'nouvelle_demande',
      'medicaments_achetes_attente_transporteur',
      'transporteur_disponible_attente_acheteur',
      'transporteur_et_medicaments_prets'
    ))
    OR acheteur_id = auth.uid()
    OR transporteur_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM propositions
      WHERE propositions.demande_id = demandes.id
        AND propositions.aidant_id = auth.uid()
    )
  );
```

**Appliquer via** : `mcp__supabase__apply_migration`

---

### Phase B — Constante STATUTS_LECTURE_SEULE

**Fichier** : `src/types/demande.types.ts`

Ajouter après `STATUTS_ANNULABLES` :

```typescript
export const STATUTS_LECTURE_SEULE: ReadonlyArray<StatutDemande> = [
  'en_cours_livraison_transporteur',
  'rdv_a_fixer',
  'en_cours_livraison_patient',
  'traitee',
] as const
```

---

### Phase C — Badge lecture seule dans DetailDemandeView

**Fichier** : `src/views/DetailDemandeView.vue`

1. Importer `STATUTS_LECTURE_SEULE`
2. Ajouter computed :

```typescript
const estLectureSeule = computed(() =>
  isAidant.value &&
  !!demande.value &&
  STATUTS_LECTURE_SEULE.includes(demande.value.statut)
)
```

3. Dans le template, après l'urgence-banner, ajouter :

```html
<div v-if="isAidant && estLectureSeule" class="lecture-seule-banner">
  <svg>…œil barré…</svg>
  Demande en lecture seule — votre rôle est terminé ou en cours de traitement
</div>
```

4. Conditionner `peutProposer` avec `!estLectureSeule` (redondant mais défensif).

---

### Phase D — Validation filtre liste

**Fichier** : `src/views/ListeDemandesView.vue`

Vérifier que :
- ✅ Chips 5 filtres présents
- ✅ `estImplique()` couvre acheteurId + transporteurId + propositions
- ✅ Compteurs par filtre corrects
- ✅ `onIonViewWillEnter` remplace `onMounted`
- ✅ Realtime channel UPDATE sur demandes

---

## Risques & décisions

| Risque | Mitigation |
|--------|-----------|
| Sous-requête EXISTS sur propositions — perf RLS | Index FK sur `propositions.aidant_id` déjà présent (migration 001) |
| `estLectureSeule` redondant avec state machine | Intentionnel : UX explicite > logique implicite |
| Filtre "Toutes" inclut traitées — liste longue | Badge "Traitée" sur DemandeCard déjà présent via StatutBadge |
