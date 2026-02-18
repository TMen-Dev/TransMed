// src/composables/useChat.ts

import { computed, type Ref } from 'vue'
import { useChatStore } from '../stores/chat.store'
import type { SendMessageDto } from '../types/message.types'

export function useChat(demandeId: string) {
  const chatStore = useChatStore()

  const messages = computed(() => chatStore.getForDemande(demandeId))
  const loading = computed(() => chatStore.loading)

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
