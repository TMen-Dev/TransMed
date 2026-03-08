// src/services/mock/MockPropositionService.ts

import type { IPropositionService } from '../interfaces/IPropositionService'
import type { Proposition, CreatePropositionDto } from '../../types/proposition.types'
import { MOCK_PROPOSITIONS } from './data/propositions.mock'
import { demandeService } from '../index'

const LOCK_DURATION_HOURS = 24

function lockExpiry(): string {
  const d = new Date()
  d.setHours(d.getHours() + LOCK_DURATION_HOURS)
  return d.toISOString()
}

function isLocked(lockedUntil?: string): boolean {
  if (!lockedUntil) return false
  return new Date(lockedUntil) > new Date()
}

export class MockPropositionService implements IPropositionService {
  private propositions: Proposition[] = [...MOCK_PROPOSITIONS]

  async getByDemandeId(demandeId: string): Promise<Proposition[]> {
    return this.propositions
      .filter((p) => p.demandeId === demandeId)
      .map((p) => ({ ...p }))
  }

  async create(data: CreatePropositionDto): Promise<Proposition> {
    const demande = await demandeService.getById(data.demandeId)

    // Vérification état autorisé + verrous
    if (data.type === 'prop_achat_envoi') {
      if (demande.statut !== 'nouvelle_demande' && demande.statut !== 'transporteur_disponible_attente_acheteur') {
        throw new Error('Proposition achat+envoi non autorisée dans cet état.')
      }
      if (isLocked(demande.acheteurLockedUntil)) {
        throw new Error('Un acheteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n\'est donnée.')
      }
    }

    if (data.type === 'prop_transport') {
      if (demande.statut !== 'nouvelle_demande' && demande.statut !== 'medicaments_achetes_attente_transporteur') {
        throw new Error('Proposition transport non autorisée dans cet état.')
      }
      if (isLocked(demande.transporteurLockedUntil)) {
        throw new Error('Un transporteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n\'est donnée.')
      }
    }

    if (data.type === 'prop_achat_transport') {
      if (demande.statut !== 'nouvelle_demande') {
        throw new Error('Proposition achat+transport non autorisée dans cet état.')
      }
      if (isLocked(demande.acheteurLockedUntil)) {
        throw new Error('Un acheteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n\'est donnée.')
      }
      if (isLocked(demande.transporteurLockedUntil)) {
        throw new Error('Un transporteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n\'est donnée.')
      }
    }

    const proposition: Proposition = {
      id: `prop-${crypto.randomUUID()}`,
      demandeId: data.demandeId,
      aidantId: data.aidantId,
      aidantPrenom: data.aidantPrenom,
      type: data.type,
      createdAt: new Date().toISOString(),
    }
    this.propositions.push(proposition)

    // Poser les verrous après création
    if (data.type === 'prop_achat_envoi' || data.type === 'prop_achat_transport') {
      await demandeService.setAcheteurLock(data.demandeId, lockExpiry())
    }
    if (data.type === 'prop_transport' || data.type === 'prop_achat_transport') {
      await demandeService.setTransporteurLock(data.demandeId, lockExpiry())
    }

    return { ...proposition }
  }
}
