// src/types/proposition.types.ts

export type TypeProposition = 'prop1_cagnotte' | 'prop2_transport' | 'prop3_achat_transport'

export interface Proposition {
  id: string
  demandeId: string
  aidantId: string
  aidantPrenom: string // dénormalisé
  type: TypeProposition
  montantContribue?: number // défini uniquement pour prop1_cagnotte
  createdAt: string
}

export interface CreatePropositionDto {
  demandeId: string
  aidantId: string
  aidantPrenom: string
  type: TypeProposition
  montantContribue?: number // requis si type === 'prop1_cagnotte'
}
