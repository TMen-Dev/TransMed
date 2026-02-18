// src/stores/chat.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, SendMessageDto } from '../types/message.types'
import { messageService } from '../services/index'

export const useChatStore = defineStore('chat', () => {
  const messagesParDemande = ref<Map<string, Message[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMessages(demandeId: string): Promise<Message[]> {
    loading.value = true
    error.value = null
    try {
      const messages = await messageService.getByDemandeId(demandeId)
      messagesParDemande.value.set(demandeId, messages)
      return messages
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(data: SendMessageDto): Promise<Message> {
    const message = await messageService.send(data)
    const existing = messagesParDemande.value.get(data.demandeId) ?? []
    messagesParDemande.value.set(data.demandeId, [...existing, message])
    return message
  }

  function getForDemande(demandeId: string): Message[] {
    return messagesParDemande.value.get(demandeId) ?? []
  }

  return {
    messagesParDemande,
    loading,
    error,
    fetchMessages,
    sendMessage,
    getForDemande,
  }
})
