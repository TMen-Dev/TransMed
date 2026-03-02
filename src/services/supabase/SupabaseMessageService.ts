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
}): Message {
  return {
    id: row.id,
    demandeId: row.demande_id,
    auteurId: row.auteur_id,
    auteurPrenom: row.auteur_prenom,
    auteurRole: row.auteur_role as Message['auteurRole'],
    contenu: row.contenu,
    createdAt: row.created_at,
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
}
