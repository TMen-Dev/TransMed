// src/services/mock/MockPropositionService.ts

import type { IPropositionService } from '../interfaces/IPropositionService'
import type { Proposition, CreatePropositionDto } from '../../types/proposition.types'
import { MOCK_PROPOSITIONS } from './data/propositions.mock'
import { cagnotteService, demandeService } from '../index'

export class MockPropositionService implements IPropositionService {
  private propositions: Proposition[] = [...MOCK_PROPOSITIONS]

  async getByDemandeId(demandeId: string): Promise<Proposition[]> {
    return this.propositions
      .filter((p) => p.demandeId === demandeId)
      .map((p) => ({ ...p }))
  }

  async create(data: CreatePropositionDto): Promise<Proposition> {
    const demande = await demandeService.getById(data.demandeId)

    // Pré-conditions FR-024 : un seul transporteur par demande
    if (data.type === 'prop2_transport' && demande.transporteurId) {
      throw new Error('Un transporteur est déjà assigné à cette demande (FR-024).')
    }

    // Pré-conditions FR-022 : Prop1 bloquée si cagnotte en_attente_evaluation
    if (data.type === 'prop1_cagnotte') {
      if (!data.montantContribue || data.montantContribue <= 0) {
        throw new Error('Le montant de contribution est requis et doit être supérieur à 0.')
      }
      const cagnotte = await cagnotteService.getByDemandeId(data.demandeId)
      if (cagnotte.statut === 'en_attente_evaluation') {
        throw new Error(
          "Contributions bloquées — l'acheteur doit d'abord définir le montant cible (FR-022)."
        )
      }
    }

    const proposition: Proposition = {
      id: `prop-${crypto.randomUUID()}`,
      demandeId: data.demandeId,
      aidantId: data.aidantId,
      aidantPrenom: data.aidantPrenom,
      type: data.type,
      montantContribue: data.montantContribue,
      createdAt: new Date().toISOString(),
    }
    this.propositions.push(proposition)
    return { ...proposition }
  }
}
