# Implementation Plan: Suppression de demande par le patient

**Branch**: `010-delete-demande` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)

## Summary

Permettre à un patient de supprimer sa propre demande (en cascade : messages + fichier ordonnance dans Storage) depuis DetailDemandeView, avec confirmation obligatoire et blocage sur les états avancés. La suppression depuis la liste (swipe) est un bonus P3. Aucune nouvelle dépendance — tout repose sur l'infrastructure Supabase et Ionic existante.

## Technical Context

**Language/Version**: TypeScript 5+ (strict mode)
**Primary Dependencies**: `@ionic/vue` (alertController pour confirmation), `@supabase/supabase-js` v2 (DELETE + Storage.remove), Pinia 2+, Vue 3.4+
**Storage**: Supabase PostgreSQL (table `demandes`, `messages`, `ordonnances`) + Supabase Storage bucket `ordonnances`
**Testing**: vue-tsc --noEmit + test manuel Playwright web
**Target Platform**: Android (Huawei EMUI) + Web (ionic serve)
**Project Type**: Mobile Ionic/Capacitor
**Performance Goals**: Suppression complète < 3s sur réseau 4G
**Constraints**: Pas de nouvelle dépendance ; compatibilité EMUI (pas de dialogs déclaratifs — utiliser `alertController` programmatique)
**Scale/Scope**: Fonctionnalité unitaire — 1 service method, 1 store action, 2 vues modifiées

## Constitution Check

| Principe | Statut | Note |
|----------|--------|------|
| I. Stack Mobile-First (Ionic 7+/Vue 3/Capacitor 5) | ✅ PASS | Pas de nouvelle dépendance |
| II. Composition API (`<script setup>`) | ✅ PASS | Toutes les modifs utilisent `<script setup>` |
| III. Typage Strict (no `any`) | ✅ PASS | `STATUTS_ANNULABLES` en `ReadonlyArray<StatutDemande>` |
| IV. Accès natif via Capacitor | ✅ PASS | N/A pour cette feature |
| V. Simplicité YAGNI | ✅ PASS | 1 méthode service, 1 action store, 0 nouveau composant |

## Project Structure

### Documentation (this feature)

```text
specs/010-delete-demande/
├── plan.md              ← ce fichier
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── service-contracts.md
└── tasks.md             ← généré par /speckit.tasks
```

### Source Code impacté

```text
src/
├── services/
│   ├── interfaces/
│   │   └── IDemandeService.ts          ← ajouter delete(id)
│   ├── supabase/
│   │   └── SupabaseDemandeService.ts   ← implémenter delete(id)
│   └── mock/
│       └── MockDemandeService.ts       ← implémenter delete(id)
├── stores/
│   └── demandes.store.ts               ← ajouter action supprimerDemande()
├── types/
│   └── demande.types.ts                ← ajouter STATUTS_ANNULABLES constant
└── views/
    ├── DetailDemandeView.vue           ← bouton Supprimer + alertController
    └── ListeDemandesView.vue           ← swipe-to-delete (P3, optionnel)
```

## Phases

### Phase 0 — Research (résolu)

Voir `research.md` — toutes les décisions techniques sont confirmées.

### Phase 1 — Design & Contracts

Voir `data-model.md`, `contracts/service-contracts.md`, `quickstart.md`.

## Decisions Techniques

### 1. Ordre de suppression en cascade

```
1. Lire ordonnances.storage_path pour ce demande_id
2. Supprimer le fichier Storage (non-bloquant si absent)
3. DELETE FROM ordonnances WHERE demande_id = X
4. DELETE FROM messages WHERE demande_id = X
5. DELETE FROM propositions WHERE demande_id = X
6. DELETE FROM demandes WHERE id = X AND patient_id = currentUser.id
```

La contrainte RLS sur `demandes` garantit que seul le propriétaire peut DELETE. Les tables enfants (messages, ordonnances, propositions) ont des ON DELETE CASCADE en Supabase, mais on les supprime explicitement pour le fichier Storage.

### 2. Confirmation : `alertController` programmatique

Utiliser `alertController.create()` (Ionic programmatique) — jamais `IonAlert` déclaratif pour EMUI compatibility (même pattern que `actionSheetController` fix 007).

```typescript
const alert = await alertController.create({
  header: 'Supprimer la demande ?',
  message: 'Cette action est irréversible. La demande, les messages et l\'ordonnance seront définitivement supprimés.',
  buttons: [
    { text: 'Annuler', role: 'cancel' },
    { text: 'Supprimer', role: 'destructive', handler: () => { doDelete() } },
  ],
})
await alert.present()
```

### 3. États annulables — constante partagée

```typescript
// src/types/demande.types.ts
export const STATUTS_ANNULABLES: ReadonlyArray<StatutDemande> = [
  'nouvelle_demande',
  'medicaments_achetes_attente_transporteur',
  'transporteur_disponible_attente_acheteur',
] as const
```

### 4. Suppression Storage — non-bloquante

Si la demande n'a pas d'ordonnance (ordonanceId vide), on saute la suppression Storage. Si la suppression Storage échoue, on log un warning mais on continue (fichier orphelin acceptable).

### 5. Swipe-to-delete (P3) — IonItemSliding

```html
<ion-item-sliding>
  <ion-item><!-- DemandeCard --></ion-item>
  <ion-item-options side="end">
    <ion-item-option color="danger" @click="confirmerSuppression(demande.id)">
      Supprimer
    </ion-item-option>
  </ion-item-options>
</ion-item-sliding>
```

### 6. Retour après suppression

Après succès :
- `demandStore.supprimerDemande(id)` retire du store local (optimiste)
- `router.replace('/app/demandes')` (replace et non push pour éviter un back vers la demande supprimée)
