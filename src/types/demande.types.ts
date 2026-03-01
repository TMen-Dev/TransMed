// src/types/demande.types.ts

import type { Medicament } from './medicament.types'
import type { Proposition } from './proposition.types'

export type StatutDemande =
  | 'attente_fonds_et_transporteur' // 1 — initial
  | 'fonds_atteints'                // 2 — cagnotte complète, attend transporteur
  | 'transporteur_disponible'       // 3 — a un transporteur, attend les fonds
  | 'pret_acceptation_patient'      // 4 — les deux conditions réunies + email envoyé
  | 'livraison_confirmee'           // 5 — patient a confirmé la livraison (nouveau)
  | 'livree'                        // 6 — transporteur a livré (nouveau)
  | 'traitee'                       // 7 — patient a confirmé réception (terminal)

export type TypeEvenement =
  | 'prop1_contribution'           // Prop1 — cagnotte non encore atteinte
  | 'prop1_cagnotte_atteinte'      // Prop1 — contribution qui remplit la cagnotte
  | 'prop2_transport'              // Prop2 — aidant propose transport
  | 'prop3_achat_transport'        // Prop3 — aidant propose achat + transport
  | 'patient_confirme_livraison'   // Patient confirme → livraison_confirmee
  | 'transporteur_livre'           // Transporteur livre → livree
  | 'patient_recoit_medicaments'   // Patient reçoit → traitee

export interface Demande {
  id: string
  patientId: string
  patientPrenom: string // dénormalisé
  nom: string // ex: "Alice — Alger" (FR-201)
  urgente: boolean // badge URGENT si true (FR-206)
  medicaments: Medicament[] // min 1
  adresseLivraison: string
  statut: StatutDemande
  ordonanceId: string // obligatoire — référence Ordonance
  cagnotteId: string // créée automatiquement avec la demande
  propositions: Proposition[] // liste des propositions reçues
  transporteurId?: string // aidant assigné au transport (Prop2 ou Prop3)
  transporteurPrenom?: string // dénormalisé
  emailNotifEnvoyee?: boolean // FR-120 — notification patient déclenchée une seule fois
  messageRemerciement?: string // saisi par le patient à la confirmation de réception (FR-224)
  createdAt: string
  updatedAt: string
  deliveredAt?: string // défini à statut traitee
}

export interface CreateDemandeDto {
  patientId: string
  patientPrenom: string
  nom: string // nom auto-suggéré ou personnalisé (FR-201-FR-203)
  urgente: boolean // demande urgente (FR-206)
  medicaments: Medicament[]
  adresseLivraison: string
  ordonanceBase64: string // fichier encodé en base64 (MVP local)
  ordonanceMimeType: 'image/jpeg' | 'image/png' | 'application/pdf'
}
