// src/types/proposition.types.ts

export type TypeProposition =
  | 'prop_achat_envoi'     // Acheter les médicaments et les envoyer au transporteur
  | 'prop_transport'       // Transporter les médicaments jusqu'au patient
  | 'prop_achat_transport' // Acheter ET transporter (aidant unique — scénario 1)

export interface Proposition {
  id: string
  demandeId: string
  aidantId: string
  aidantPrenom: string // dénormalisé
  type: TypeProposition
  createdAt: string
}

export interface CreatePropositionDto {
  demandeId: string
  aidantId: string
  aidantPrenom: string
  type: TypeProposition
}
