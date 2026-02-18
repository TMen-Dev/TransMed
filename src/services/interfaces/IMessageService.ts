// src/services/interfaces/IMessageService.ts

import type { Message, SendMessageDto } from '../../types/message.types'

export interface IMessageService {
  /** Récupère tous les messages d'une demande triés par date. */
  getByDemandeId(demandeId: string): Promise<Message[]>

  /** Envoie un message dans le chat d'une demande. */
  send(data: SendMessageDto): Promise<Message>
}
