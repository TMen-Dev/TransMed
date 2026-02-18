// src/services/mock/MockCagnotteService.ts

import type { ICagnotteService } from '../interfaces/ICagnotteService'
import type {
  Cagnotte,
  Contribution,
  DefinirMontantCibleDto,
  AjouterContributionDto,
} from '../../types/cagnotte.types'
import { MOCK_CAGNOTTES } from './data/cagnottes.mock'

export class MockCagnotteService implements ICagnotteService {
  private cagnottes: Cagnotte[] = MOCK_CAGNOTTES.map((c) => ({
    ...c,
    contributions: [...c.contributions],
  }))

  async createForDemande(demandeId: string): Promise<Cagnotte> {
    const cagnotte: Cagnotte = {
      id: `cagnotte-${crypto.randomUUID()}`,
      demandeId,
      montantCible: undefined,
      montantCollecte: 0,
      statut: 'en_attente_evaluation',
      contributions: [],
      createdAt: new Date().toISOString(),
    }
    this.cagnottes.push(cagnotte)
    return { ...cagnotte }
  }

  async getByDemandeId(demandeId: string): Promise<Cagnotte> {
    const cagnotte = this.cagnottes.find((c) => c.demandeId === demandeId)
    if (!cagnotte) throw new Error(`Aucune cagnotte pour la demande : ${demandeId}`)
    return { ...cagnotte, contributions: [...cagnotte.contributions] }
  }

  async definirMontantCible(data: DefinirMontantCibleDto): Promise<Cagnotte> {
    if (data.montantCible <= 0) throw new Error('Le montant cible doit être supérieur à 0.')
    const cagnotte = this.cagnottes.find((c) => c.id === data.cagnotteId)
    if (!cagnotte) throw new Error(`Cagnotte introuvable : ${data.cagnotteId}`)
    if (cagnotte.statut !== 'en_attente_evaluation') {
      throw new Error('Le montant cible ne peut être défini que si la cagnotte est en attente.')
    }
    cagnotte.montantCible = data.montantCible
    cagnotte.statut = 'ouverte'
    return { ...cagnotte, contributions: [...cagnotte.contributions] }
  }

  async ajouterContribution(
    data: AjouterContributionDto
  ): Promise<{ cagnotte: Cagnotte; objectifAtteint: boolean }> {
    if (data.montant <= 0) throw new Error('Le montant de la contribution doit être supérieur à 0.')
    const cagnotte = this.cagnottes.find((c) => c.id === data.cagnotteId)
    if (!cagnotte) throw new Error(`Cagnotte introuvable : ${data.cagnotteId}`)
    if (cagnotte.statut === 'en_attente_evaluation') {
      throw new Error(
        "Contributions bloquées — l'acheteur doit d'abord définir le montant cible (FR-022)."
      )
    }

    const contribution: Contribution = {
      id: `contrib-${crypto.randomUUID()}`,
      cagnotteId: data.cagnotteId,
      aidantId: data.aidantId,
      aidantPrenom: data.aidantPrenom,
      montant: data.montant,
      createdAt: new Date().toISOString(),
    }
    cagnotte.contributions.push(contribution)
    cagnotte.montantCollecte += data.montant

    let objectifAtteint = false
    if (cagnotte.montantCible !== undefined && cagnotte.montantCollecte >= cagnotte.montantCible) {
      cagnotte.statut = 'atteinte'
      objectifAtteint = true
    }

    return { cagnotte: { ...cagnotte, contributions: [...cagnotte.contributions] }, objectifAtteint }
  }

  async getContributions(cagnotteId: string): Promise<Contribution[]> {
    const cagnotte = this.cagnottes.find((c) => c.id === cagnotteId)
    if (!cagnotte) throw new Error(`Cagnotte introuvable : ${cagnotteId}`)
    return [...cagnotte.contributions]
  }
}
