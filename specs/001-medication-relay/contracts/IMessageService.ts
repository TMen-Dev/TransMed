/**
 * IMessageService — Contrat de service pour la messagerie par demande.
 *
 * Implémentations attendues :
 *   - MockMessageService   : données TypeScript locales (MVP)
 *   - SupabaseMessageService : Supabase Realtime + table messages (future migration)
 *
 * Note Supabase future : le canal Realtime permettra une mise à jour en temps réel
 * sans polling. L'interface reste identique ; seule l'implémentation change.
 */

import type { Message, SendMessageDto } from '../../../src/types/message.types'

export interface IMessageService {
  /**
   * Récupère tous les messages associés à une demande, triés par date ASC.
   */
  getByDemandeId(demandeId: string): Promise<Message[]>

  /**
   * Envoie un nouveau message dans le fil d'une demande.
   * @throws Error si contenu est vide ou dépasse 1000 caractères
   * @throws Error si la demande n'existe pas
   */
  send(data: SendMessageDto): Promise<Message>
}
