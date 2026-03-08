# Contract: State Machine — 008-workflow-demandes

## Interface `demandeStateMachine.ts`

### Types exportés

```typescript
export type StatutDemande =
  | 'nouvelle_demande'
  | 'medicaments_achetes_attente_transporteur'
  | 'transporteur_disponible_attente_acheteur'
  | 'transporteur_et_medicaments_prets'
  | 'en_cours_livraison_transporteur'
  | 'rdv_a_fixer'
  | 'en_cours_livraison_patient'
  | 'traitee'

export type TypeEvenement =
  | 'prop_achat_envoi'
  | 'prop_transport'
  | 'prop_achat_transport'
  | 'acheteur_envoie_medicaments'
  | 'auto_rdv_patient'
  | 'transporteur_recoit_medicaments'
  | 'rdv_fixe'
  | 'patient_recoit_medicaments'
```

### Fonctions exportées

```typescript
/**
 * Applique une transition d'état.
 * @throws Error si la transition est interdite.
 */
export function applyTransition(statut: StatutDemande, evenement: TypeEvenement): StatutDemande

/**
 * Vérifie si une transition est possible sans la déclencher.
 */
export function canTransition(statut: StatutDemande, evenement: TypeEvenement): boolean
```

### Table de transitions (contrat)

| Statut courant | Événement | Statut suivant |
|---------------|-----------|----------------|
| nouvelle_demande | prop_achat_envoi | medicaments_achetes_attente_transporteur |
| nouvelle_demande | prop_transport | transporteur_disponible_attente_acheteur |
| nouvelle_demande | prop_achat_transport | transporteur_et_medicaments_prets |
| medicaments_achetes_attente_transporteur | prop_transport | transporteur_et_medicaments_prets |
| transporteur_disponible_attente_acheteur | prop_achat_envoi | transporteur_et_medicaments_prets |
| transporteur_et_medicaments_prets | acheteur_envoie_medicaments | en_cours_livraison_transporteur |
| transporteur_et_medicaments_prets | auto_rdv_patient | rdv_a_fixer |
| en_cours_livraison_transporteur | transporteur_recoit_medicaments | rdv_a_fixer |
| rdv_a_fixer | rdv_fixe | en_cours_livraison_patient |
| en_cours_livraison_patient | patient_recoit_medicaments | traitee |

Toute autre combinaison lève une `Error`.
