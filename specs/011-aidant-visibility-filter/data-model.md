# Data Model: Visibilité Aidant & Filtre (011)

## Aucune nouvelle table

Cette feature ne crée pas de nouvelle entité. Elle raffine les règles d'accès sur les entités existantes.

---

## Entité : demandes (impact RLS)

### Politique RLS `demandes_select` — état actuel

```
patient_id = auth.uid()                    → patient voit ses demandes
OR (aidant AND statut IN A,B,C,D)          → aidant non-assigné voit demandes ouvertes
OR acheteur_id = auth.uid()               → aidant assigné acheteur voit jusqu'au bout
OR transporteur_id = auth.uid()           → aidant assigné transporteur voit jusqu'au bout
```

### Politique RLS `demandes_select` — après migration 010

```
+ OR EXISTS (SELECT 1 FROM propositions
             WHERE propositions.demande_id = demandes.id
               AND propositions.aidant_id = auth.uid())
```

**Impact** : Un aidant ayant émis une proposition sur une demande peut la suivre jusqu'au statut H (traitée), même sans être acheteur ou transporteur assigné.

---

## Entité : Proposition (lecture seule côté frontend)

Pas de changement de schéma. La relation aidant ↔ demande via `propositions` est utilisée par :
- `estImplique()` dans ListeDemandesView pour le filtre frontend
- La nouvelle clause RLS pour la visibilité E/F/G/H

---

## Nouvelle constante frontend : STATUTS_LECTURE_SEULE

```typescript
// À ajouter dans src/types/demande.types.ts
export const STATUTS_LECTURE_SEULE: ReadonlyArray<StatutDemande> = [
  'en_cours_livraison_transporteur',
  'rdv_a_fixer',
  'en_cours_livraison_patient',
  'traitee',
] as const
```

Utilisée dans `DetailDemandeView.vue` pour le computed `estLectureSeule`.

---

## Transitions de propositions — inchangées

| Statut | prop_achat_envoi | prop_transport | prop_achat_transport |
|--------|-----------------|----------------|---------------------|
| A (nouvelle_demande) | ✅ | ✅ | ✅ |
| B (achetes_attente_transporteur) | ❌ | ✅ | ❌ |
| C (transporteur_attente_acheteur) | ✅ | ❌ | ❌ |
| D (prets) | ❌ | ❌ | ❌ |
| E, F, G, H | ❌ | ❌ | ❌ |

Source : `demandeStateMachine.ts` TRANSITIONS — aucun changement requis.
