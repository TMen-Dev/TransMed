// src/services/mock/MockMessageService.ts

import type { IMessageService } from '../interfaces/IMessageService'
import type { Message, SendMessageDto } from '../../types/message.types'
import { MOCK_MESSAGES } from './data/messages.mock'

export class MockMessageService implements IMessageService {
  private messages: Message[] = [...MOCK_MESSAGES]

  async getByDemandeId(demandeId: string): Promise<Message[]> {
    return this.messages
      .filter((m) => m.demandeId === demandeId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((m) => ({ ...m }))
  }

  async send(data: SendMessageDto): Promise<Message> {
    if (!data.contenu.trim()) throw new Error('Le message ne peut pas être vide.')
    if (data.contenu.length > 1000) throw new Error('Le message ne peut pas dépasser 1000 caractères.')

    const message: Message = {
      id: `msg-${crypto.randomUUID()}`,
      demandeId: data.demandeId,
      auteurId: data.auteurId,
      auteurPrenom: data.auteurPrenom,
      auteurRole: data.auteurRole,
      contenu: data.contenu.trim(),
      createdAt: new Date().toISOString(),
      isRead: false,
      readAt: null,
    }
    this.messages.push(message)
    return { ...message }
  }
}
