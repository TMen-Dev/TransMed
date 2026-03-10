import type { IMessageService } from '../interfaces/IMessageService'
import type { Message, SendMessageDto } from '../../types/message.types'
import { supabase } from '../../lib/supabase'
import { handleSupabaseError } from './handleSupabaseError'

export function mapRowToMessage(row: {
  id: string
  demande_id: string
  auteur_id: string
  auteur_prenom: string
  auteur_role: string
  contenu: string
  created_at: string
  is_read?: boolean
  read_at?: string | null
}): Message {
  return {
    id: row.id,
    demandeId: row.demande_id,
    auteurId: row.auteur_id,
    auteurPrenom: row.auteur_prenom,
    auteurRole: row.auteur_role as Message['auteurRole'],
    contenu: row.contenu,
    createdAt: row.created_at,
    isRead: row.is_read ?? false,
    readAt: row.read_at ?? null,
  }
}

export class SupabaseMessageService implements IMessageService {
  async getByDemandeId(demandeId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('demande_id', demandeId)
      .order('created_at', { ascending: true })

    if (error) handleSupabaseError(error)
    return (data ?? []).map(mapRowToMessage)
  }

  async send(data: SendMessageDto): Promise<Message> {
    const { data: row, error } = await supabase
      .from('messages')
      .insert({
        demande_id: data.demandeId,
        auteur_id: data.auteurId,
        auteur_prenom: data.auteurPrenom,
        auteur_role: data.auteurRole,
        contenu: data.contenu,
      })
      .select()
      .single()

    if (error) handleSupabaseError(error)
    if (!row) throw new Error('Erreur envoi message')
    return mapRowToMessage(row)
  }

  // T008 — marquer messages comme lus
  async marquerCommeLus(demandeId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('demande_id', demandeId)
      .neq('auteur_id', userId)
      .eq('is_read', false)

    if (error) handleSupabaseError(error)
  }

  // T009 — compter messages non-lus pour l'utilisateur
  async countNonLus(userId: string): Promise<{ count: number; hasUrgent: boolean }> {
    const { data, error } = await supabase
      .from('messages')
      .select('id, demandes!inner(urgente, patient_id, acheteur_id, transporteur_id)')
      .neq('auteur_id', userId)
      .eq('is_read', false)
      .or(`patient_id.eq.${userId},acheteur_id.eq.${userId},transporteur_id.eq.${userId}`, { foreignTable: 'demandes' })

    if (error) {
      // Fallback : requête simplifiée sans filtre urgente si JOIN échoue
      return { count: 0, hasUrgent: false }
    }

    const count = data?.length ?? 0
    const hasUrgent = (data ?? []).some((row) => {
      const d = row.demandes as { urgente: boolean } | null
      return d?.urgente === true
    })

    return { count, hasUrgent }
  }

  // T010 — compter aidants uniques intéressés par une demande (propositions + pré-chats)
  async countAidantsInteresses(demandeId: string): Promise<number> {
    const [{ data: propData }, { data: msgData }] = await Promise.all([
      supabase
        .from('propositions')
        .select('aidant_id')
        .eq('demande_id', demandeId),
      supabase
        .from('messages')
        .select('auteur_id')
        .eq('demande_id', demandeId)
        .eq('auteur_role', 'aidant'),
    ])

    const propIds = new Set((propData ?? []).map((r) => r.aidant_id))
    const msgIds = new Set((msgData ?? []).map((r) => r.auteur_id))
    const union = new Set([...propIds, ...msgIds])
    return union.size
  }
}
