// src/composables/useChat.ts

import { computed, onUnmounted, type Ref } from 'vue'
import { useChatStore } from '../stores/chat.store'
import type { SendMessageDto } from '../types/message.types'
import { supabase } from '../lib/supabase'
import { mapRowToMessage } from '../services/supabase/SupabaseMessageService'

export function useChat(demandeId: string) {
  const chatStore = useChatStore()

  const messages = computed(() => chatStore.getForDemande(demandeId))
  const loading = computed(() => chatStore.loading)

  // Realtime subscription — messages temps réel
  const channel = supabase
    .channel(`chat:${demandeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `demande_id=eq.${demandeId}`,
      },
      (payload) => {
        const newMsg = mapRowToMessage(payload.new as Parameters<typeof mapRowToMessage>[0])
        const existing = chatStore.getForDemande(demandeId)
        if (!existing.find((m) => m.id === newMsg.id)) {
          chatStore.messagesParDemande[demandeId] = [...existing, newMsg]
        }
      }
    )
    .subscribe()

  onUnmounted(() => {
    channel.unsubscribe()
  })

  async function fetchMessages() {
    return chatStore.fetchMessages(demandeId)
  }

  async function sendMessage(data: Omit<SendMessageDto, 'demandeId'>) {
    return chatStore.sendMessage({ ...data, demandeId })
  }

  function scrollToBottom(containerRef: Ref<HTMLElement | null>) {
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }

  return { messages, loading, fetchMessages, sendMessage, scrollToBottom }
}
