import type { IPropositionService } from '../interfaces/IPropositionService'
import type { Proposition, CreatePropositionDto } from '../../types/proposition.types'
import { supabase } from '../../lib/supabase'
import { handleSupabaseError } from './handleSupabaseError'

function mapRowToProposition(row: {
  id: string
  demande_id: string
  aidant_id: string
  aidant_prenom: string
  type: string
  montant_contribue: number | null
  created_at: string
}): Proposition {
  return {
    id: row.id,
    demandeId: row.demande_id,
    aidantId: row.aidant_id,
    aidantPrenom: row.aidant_prenom,
    type: row.type as Proposition['type'],
    montantContribue: row.montant_contribue ?? undefined,
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
    const { data: row, error } = await supabase
      .from('propositions')
      .insert({
        demande_id: dto.demandeId,
        aidant_id: dto.aidantId,
        aidant_prenom: dto.aidantPrenom,
        type: dto.type,
        montant_contribue: dto.montantContribue ?? null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('Un transporteur est déjà assigné à cette demande (FR-024).')
      }
      handleSupabaseError(error)
    }
    if (!row) throw new Error('Erreur création proposition')
    return mapRowToProposition(row)
  }
}
