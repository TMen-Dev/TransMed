# Data Model: Suppression de demande (010)

## Aucune nouvelle table

Cette feature ne crée aucune nouvelle table. Elle supprime des données des tables existantes.

## Tables impliquées

### `demandes` (existante)
- **Action** : DELETE WHERE id = :id AND patient_id = auth.uid()
- **RLS** : nouvelle policy DELETE pour le patient propriétaire

### `messages` (existante)
- **Action** : Supprimées en cascade (ON DELETE CASCADE via FK demande_id)
- **Pas de changement de schéma**

### `propositions` (existante)
- **Action** : Supprimées en cascade (ON DELETE CASCADE via FK demande_id)
- **Pas de changement de schéma**

### `ordonnances` (existante)
- **Action** : Supprimées en cascade (ON DELETE CASCADE via FK demande_id)
- **Storage** : fichier supprimé explicitement via `storage_path`

## Nouveau type TypeScript

```typescript
// src/types/demande.types.ts — ajout
export const STATUTS_ANNULABLES: ReadonlyArray<StatutDemande> = [
  'nouvelle_demande',
  'medicaments_achetes_attente_transporteur',
  'transporteur_disponible_attente_acheteur',
] as const
```

## RLS SQL à appliquer

```sql
-- Migration 010_a — Policy DELETE demandes
CREATE POLICY "patient_delete_own_demande"
  ON demandes FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid());

-- Vérifier que ON DELETE CASCADE existe déjà sur messages, ordonnances, propositions
-- (normalement présent depuis migration 005)
```

## Relation de suppression

```
demandes (DELETE)
  ├── messages (CASCADE)
  ├── ordonnances (CASCADE) + Storage.remove(storage_path)
  └── propositions (CASCADE)
```
