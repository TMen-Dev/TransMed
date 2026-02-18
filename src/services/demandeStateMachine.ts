// src/services/demandeStateMachine.ts
// Machine d'états pure — aucun effet de bord, testable avec Vitest sans composant Vue.

import type { StatutDemande, TypeEvenement } from '../types/demande.types'

/**
 * Table de transition typée.
 * Chaque cellule correspond à une règle de FR-007.
 * Une clé manquante = transition interdite.
 */
const TRANSITIONS: Record<StatutDemande, Partial<Record<TypeEvenement, StatutDemande>>> = {
  attente_fonds_et_transporteur: {
    prop1_contribution: 'attente_fonds_et_transporteur', // contribue mais objectif non atteint
    prop1_cagnotte_atteinte: 'fonds_atteints',
    prop2_transport: 'transporteur_disponible',
    prop3_achat_transport: 'pret_acceptation_patient',
  },
  attente_fonds: {
    // a un transporteur, attend les fonds
    prop1_contribution: 'attente_fonds',
    prop1_cagnotte_atteinte: 'pret_acceptation_patient', // transporteur déjà là → statut 6
    prop3_achat_transport: 'pret_acceptation_patient',
  },
  attente_transporteur: {
    // a les fonds, attend un transporteur
    prop2_transport: 'pret_acceptation_patient', // fonds déjà là → statut 6
    prop3_achat_transport: 'pret_acceptation_patient',
  },
  fonds_atteints: {
    prop2_transport: 'pret_acceptation_patient',
    prop3_achat_transport: 'pret_acceptation_patient',
  },
  transporteur_disponible: {
    prop1_contribution: 'transporteur_disponible',
    prop1_cagnotte_atteinte: 'pret_acceptation_patient', // fonds maintenant atteints → statut 6
    prop3_achat_transport: 'pret_acceptation_patient',
  },
  pret_acceptation_patient: {
    patient_confirme: 'en_cours_livraison',
  },
  en_cours_livraison: {
    aidant_livre: 'traitee',
  },
  traitee: {}, // état terminal — aucune transition
}

/**
 * Applique une transition d'état.
 * @throws Error si la transition est illégale pour le statut courant.
 */
export function applyTransition(statut: StatutDemande, evenement: TypeEvenement): StatutDemande {
  const next = TRANSITIONS[statut][evenement]
  if (next === undefined) {
    throw new Error(
      `Transition interdite : statut "${statut}" + événement "${evenement}"`
    )
  }
  return next
}

/**
 * Vérifie si une transition est possible sans la déclencher.
 * Usage dans les composants : v-if="canTransition(demande.statut, 'prop2_transport')"
 */
export function canTransition(statut: StatutDemande, evenement: TypeEvenement): boolean {
  return TRANSITIONS[statut][evenement] !== undefined
}
