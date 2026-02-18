// src/types/demande.types.ts

import type { Medicament } from './medicament.types'
import type { Proposition } from './proposition.types'

export type StatutDemande =
  | 'attente_fonds_et_transporteur' // 1 — initial
  | 'attente_fonds' // 2 — a un transporteur, attend les fonds
  | 'attente_transporteur' // 3 — a les fonds, attend un transporteur
  | 'fonds_atteints' // 4 — cagnotte complète, attend transporteur
  | 'transporteur_disponible' // 5 — a un transporteur, attend les fonds
  | 'pret_acceptation_patient' // 6 — les deux conditions réunies
  | 'en_cours_livraison' // 7 — patient a confirmé
  | 'traitee' // 8 — livrée

export type TypeEvenement =
  | 'prop1_contribution' // Prop1 — cagnotte non encore atteinte
  | 'prop1_cagnotte_atteinte' // Prop1 — contribution qui remplit la cagnotte
  | 'prop2_transport' // Prop2 — aidant propose transport
  | 'prop3_achat_transport' // Prop3 — aidant propose achat + transport
  | 'patient_confirme' // Patient → 6 → 7
  | 'aidant_livre' // Aidant → 7 → 8

export interface Demande {
  id: string
  patientId: string
  patientPrenom: string // dénormalisé
  medicaments: Medicament[] // min 1
  adresseLivraison: string
  statut: StatutDemande
  ordonanceId: string // obligatoire — référence Ordonance
  cagnotteId: string // créée automatiquement avec la demande
  propositions: Proposition[] // liste des propositions reçues
  transporteurId?: string // aidant assigné au transport (Prop2 ou Prop3)
  transporteurPrenom?: string // dénormalisé
  createdAt: string
  updatedAt: string
  deliveredAt?: string // défini à statut 8
}

export interface CreateDemandeDto {
  patientId: string
  patientPrenom: string
  medicaments: Medicament[]
  adresseLivraison: string
  ordonanceBase64: string // fichier encodé en base64 (MVP local)
  ordonanceMimeType: 'image/jpeg' | 'image/png' | 'application/pdf'
}
