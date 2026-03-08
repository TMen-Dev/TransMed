import type { IPropositionService } from '../interfaces/IPropositionService'
import type { Proposition, CreatePropositionDto } from '../../types/proposition.types'
import { supabase } from '../../lib/supabase'
import { handleSupabaseError } from './handleSupabaseError'
import { demandeService } from '../index'

const LOCK_DURATION_HOURS = 24

function lockExpiry(): string {
  const d = new Date()
  d.setHours(d.getHours() + LOCK_DURATION_HOURS)
  return d.toISOString()
}

function isLocked(lockedUntil?: string | null): boolean {
  if (!lockedUntil) return false
  return new Date(lockedUntil) > new Date()
}

function mapRowToProposition(row: {
  id: string
  demande_id: string
  aidant_id: string
  aidant_prenom: string
  type: string
  created_at: string
}): Proposition {
  return {
    id: row.id,
    demandeId: row.demande_id,
    aidantId: row.aidant_id,
    aidantPrenom: row.aidant_prenom,
    type: row.type as Proposition['type'],
    createdAt: row.created_at,
  }
}

export class SupabasePropositionService implements IPropositionService {
  async getByDemandeId(demandeId: string): Promise<Proposition[]> {
    const { data, error } = await supabase
      .from('propositions')
      .select('*')
      .eq('demande_id', demandeId)
      .order('created_at', { ascending: true })

    if (error) handleSupabaseError(error)
    return (data ?? []).map(mapRowToProposition)
  }

  async create(dto: CreatePropositionDto): Promise<Proposition> {
    // Vérifier l'état et les verrous anti-doublon avant l'insert
    const { data: lockRow, error: lockErr } = await supabase
      .from('demandes')
      .select('statut, acheteur_locked_until, transporteur_locked_until')
      .eq('id', dto.demandeId)
      .single()

    if (lockErr || !lockRow) throw new Error('Demande introuvable.')

    if (dto.type === 'prop_achat_envoi') {
      if (lockRow.statut !== 'nouvelle_demande' && lockRow.statut !== 'transporteur_disponible_attente_acheteur') {
        throw new Error('Proposition achat+envoi non autorisée dans cet état.')
      }
      if (isLocked(lockRow.acheteur_locked_until)) {
        throw new Error("Un acheteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n'est donnée.")
      }
    }

    if (dto.type === 'prop_transport') {
      if (lockRow.statut !== 'nouvelle_demande' && lockRow.statut !== 'medicaments_achetes_attente_transporteur') {
        throw new Error('Proposition transport non autorisée dans cet état.')
      }
      if (isLocked(lockRow.transporteur_locked_until)) {
        throw new Error("Un transporteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n'est donnée.")
      }
    }

    if (dto.type === 'prop_achat_transport') {
      if (lockRow.statut !== 'nouvelle_demande') {
        throw new Error('Proposition achat+transport non autorisée dans cet état.')
      }
      if (isLocked(lockRow.acheteur_locked_until)) {
        throw new Error("Un acheteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n'est donnée.")
      }
      if (isLocked(lockRow.transporteur_locked_until)) {
        throw new Error("Un transporteur a déjà proposé son aide. Réessayez dans 24h si aucune suite n'est donnée.")
      }
    }

    const { data: row, error } = await supabase
      .from('propositions')
      .insert({
        demande_id: dto.demandeId,
        aidant_id: dto.aidantId,
        aidant_prenom: dto.aidantPrenom,
        type: dto.type,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Un aidant a déjà proposé ce type d\'aide pour cette demande.')
      }
      handleSupabaseError(error)
    }
    if (!row) throw new Error('Erreur création proposition')

    // Poser les verrous après création
    if (dto.type === 'prop_achat_envoi' || dto.type === 'prop_achat_transport') {
      await demandeService.setAcheteurLock(dto.demandeId, lockExpiry())
    }
    if (dto.type === 'prop_transport' || dto.type === 'prop_achat_transport') {
      await demandeService.setTransporteurLock(dto.demandeId, lockExpiry())
    }

    return mapRowToProposition(row)
  }
}
