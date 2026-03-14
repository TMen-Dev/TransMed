// src/types/demande.types.ts

import type { Medicament } from './medicament.types'
import type { Proposition } from './proposition.types'

export type StatutDemande =
  | 'nouvelle_demande'                         // A — état initial
  | 'medicaments_achetes_attente_transporteur'  // B — acheteur engagé, attend transporteur
  | 'transporteur_disponible_attente_acheteur'  // C — transporteur engagé, attend acheteur
  | 'transporteur_et_medicaments_prets'         // D — les deux rôles couverts
  | 'en_cours_livraison_transporteur'           // E — médicaments en transit vers le transporteur
  | 'rdv_a_fixer'                               // F — RDV patient ↔ transporteur à fixer
  | 'en_cours_livraison_patient'                // G — médicaments en transit vers le patient
  | 'traitee'                                   // H — terminal

/** États dans lesquels un aidant impliqué ne peut plus agir (lecture seule — feature 011). */
export const STATUTS_LECTURE_SEULE: ReadonlyArray<StatutDemande> = [
  'en_cours_livraison_transporteur', // E
  'rdv_a_fixer',                     // F
  'en_cours_livraison_patient',      // G
  'traitee',                         // H
] as const

/** États dans lesquels un patient peut supprimer sa demande (feature 010). */
export const STATUTS_ANNULABLES: ReadonlyArray<StatutDemande> = [
  'nouvelle_demande',
  'medicaments_achetes_attente_transporteur',
  'transporteur_disponible_attente_acheteur',
] as const

export type TypeEvenement =
  | 'prop_achat_envoi'               // A→B ou C→D
  | 'prop_transport'                 // A→C ou B→D
  | 'prop_achat_transport'           // A→D (aidant unique)
  | 'acheteur_envoie_medicaments'    // D→E (scénarios 2/3, acheteur confirme envoi)
  | 'auto_rdv_patient'               // D→F (scénario 1, automatique)
  | 'transporteur_recoit_medicaments'// E→F (transporteur confirme réception)
  | 'rdv_fixe'                       // F→G (patient confirme RDV)
  | 'patient_recoit_medicaments'     // G→H (patient confirme réception finale)

export interface Demande {
  id: string
  patientId: string
  patientPrenom: string // dénormalisé
  nom: string
  urgente: boolean // badge URGENT si true
  medicaments: Medicament[] // min 1
  adresseLivraison: string
  statut: StatutDemande
  ordonanceId: string // obligatoire — référence Ordonance
  propositions: Proposition[]

  // Rôle acheteur
  acheteurId?: string          // aidant assigné à l'achat
  acheteurPrenom?: string      // dénormalisé

  // Rôle transporteur
  transporteurId?: string      // aidant assigné au transport
  transporteurPrenom?: string  // dénormalisé

  // Verrous anti-doublon (ISO timestamp d'expiration)
  acheteurLockedUntil?: string
  transporteurLockedUntil?: string

  // true si un aidant unique couvre les deux rôles (prop_achat_transport — scénario 1)
  singleAidant?: boolean

  emailNotifEnvoyee?: boolean // notification patient déclenchée une seule fois
  messageRemerciement?: string // saisi par le patient à la confirmation de réception
  createdAt: string
  updatedAt: string
  deliveredAt?: string // défini à statut traitee
}

export interface CreateDemandeDto {
  patientId: string
  patientPrenom: string
  nom: string
  urgente: boolean
  medicaments: Medicament[]
  adresseLivraison: string
  ordonanceBase64?: string
  ordonanceMimeType?: 'image/jpeg' | 'image/png' | 'application/pdf'
}
