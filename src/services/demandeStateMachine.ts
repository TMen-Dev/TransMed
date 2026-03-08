// src/services/demandeStateMachine.ts
// Machine d'états pure — aucun effet de bord, testable avec Vitest sans composant Vue.

import type { StatutDemande, TypeEvenement } from '../types/demande.types'

/**
 * Table de transition typée — 008-workflow-demandes.
 * 8 états (A-H), 10 transitions autorisées.
 * Une clé manquante = transition interdite.
 */
const TRANSITIONS: Record<StatutDemande, Partial<Record<TypeEvenement, StatutDemande>>> = {
  nouvelle_demande: {
    prop_achat_envoi:    'medicaments_achetes_attente_transporteur', // A→B
    prop_transport:      'transporteur_disponible_attente_acheteur', // A→C
    prop_achat_transport:'transporteur_et_medicaments_prets',        // A→D (scénario 1)
  },
  medicaments_achetes_attente_transporteur: {
    prop_transport: 'transporteur_et_medicaments_prets', // B→D
  },
  transporteur_disponible_attente_acheteur: {
    prop_achat_envoi: 'transporteur_et_medicaments_prets', // C→D
  },
  transporteur_et_medicaments_prets: {
    acheteur_envoie_medicaments: 'en_cours_livraison_transporteur', // D→E (scénarios 2/3)
    auto_rdv_patient:            'rdv_a_fixer',                     // D→F (scénario 1, auto)
  },
  en_cours_livraison_transporteur: {
    transporteur_recoit_medicaments: 'rdv_a_fixer', // E→F
  },
  rdv_a_fixer: {
    rdv_fixe: 'en_cours_livraison_patient', // F→G
  },
  en_cours_livraison_patient: {
    patient_recoit_medicaments: 'traitee', // G→H
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
 * Usage dans les composants : v-if="canTransition(demande.statut, 'prop_transport')"
 */
export function canTransition(statut: StatutDemande, evenement: TypeEvenement): boolean {
  return TRANSITIONS[statut][evenement] !== undefined
}
