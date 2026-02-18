// src/types/cagnotte.types.ts

export type StatutCagnotte =
  | 'en_attente_evaluation' // montant cible non encore défini par l'acheteur
  | 'ouverte' // montant cible défini, contributions acceptées
  | 'atteinte' // montant collecté >= montant cible

export interface Contribution {
  id: string
  cagnotteId: string
  aidantId: string
  aidantPrenom: string
  montant: number // > 0
  createdAt: string
}

export interface Cagnotte {
  id: string
  demandeId: string
  montantCible?: number // défini par l'acheteur (FR-023)
  montantCollecte: number // somme des contributions
  statut: StatutCagnotte
  contributions: Contribution[]
  createdAt: string
}

export interface DefinirMontantCibleDto {
  cagnotteId: string
  montantCible: number // > 0, saisi par l'acheteur
}

export interface AjouterContributionDto {
  cagnotteId: string
  aidantId: string
  aidantPrenom: string
  montant: number
}
