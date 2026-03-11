// src/stores/chat.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, SendMessageDto } from '../types/message.types'
import { messageService } from '../services/index'

export const useChatStore = defineStore('chat', () => {
  const messagesParDemande = ref<Map<string, Message[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  // feature 009 — état messages non-lus (source de vérité)
  const unreadCount = ref(0)
  const hasUrgent = ref(false)

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
    // Dedup : le realtime peut avoir déjà ajouté ce message pendant l'attente de la Promise
    if (!existing.find((m) => m.id === message.id)) {
      messagesParDemande.value.set(data.demandeId, [...existing, message])
    }
    return message
  }

  function getForDemande(demandeId: string): Message[] {
    return messagesParDemande.value.get(demandeId) ?? []
  }

  // T014 — marquer messages comme lus + mettre à jour l'état local
  async function markAsRead(demandeId: string, userId: string): Promise<void> {
    await messageService.marquerCommeLus(demandeId, userId)
    // Mettre à jour l'état local des messages
    const msgs = messagesParDemande.value.get(demandeId)
    if (msgs) {
      const now = new Date().toISOString()
      messagesParDemande.value.set(
        demandeId,
        msgs.map((m) =>
          m.auteurId !== userId && !m.isRead ? { ...m, isRead: true, readAt: now } : m
        )
      )
    }
    // Rafraîchir le compteur global
    await fetchUnreadCount(userId)
  }

  // T022 — fetcher le count non-lus depuis le service (store = source de vérité, sans Realtime propre)
  async function fetchUnreadCount(userId: string): Promise<void> {
    try {
      const result = await messageService.countNonLus(userId)
      unreadCount.value = result.count
      hasUrgent.value = result.hasUrgent
    } catch {
      // Non bloquant
    }
  }

  return {
    messagesParDemande,
    loading,
    error,
    unreadCount,
    hasUrgent,
    fetchMessages,
    sendMessage,
    getForDemande,
    markAsRead,
    fetchUnreadCount,
  }
})
