// src/composables/useUnreadMessages.ts
// feature 009 — badge non-lus avec Realtime Supabase
// Architecture : store = source de vérité de l'état ; composable = Realtime + wrapper

import { computed, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat.store'
import { useAuthStore } from '../stores/auth.store'
import { supabase } from '../lib/supabase'

export function useUnreadMessages() {
  const chatStore = useChatStore()
  const authStore = useAuthStore()

  const unreadCount = computed(() => chatStore.unreadCount)
  const hasUrgent = computed(() => chatStore.hasUrgent)
  const badgeColor = computed<'danger' | 'warning'>(() =>
    chatStore.hasUrgent ? 'danger' : 'warning'
  )

  async function fetchUnreadCount(): Promise<void> {
    const userId = authStore.currentUser?.id
    if (!userId) return
    await chatStore.fetchUnreadCount(userId)
  }

  async function markAsRead(demandeId: string): Promise<void> {
    const userId = authStore.currentUser?.id
    if (!userId) return
    await chatStore.markAsRead(demandeId, userId)
  }

  // Souscription Realtime : tout INSERT dans messages déclenche un refresh du count
  // Compatible EMUI — pas de Supabase Presence, simple postgres_changes INSERT
  const channel = supabase
    .channel('unread-messages-global')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      () => {
        // Rafraîchir le count non-lus à chaque nouveau message
        void fetchUnreadCount()
      }
    )
    .subscribe()

  // Initialiser le count au montage
  void fetchUnreadCount()

  onUnmounted(() => {
    channel.unsubscribe()
  })

  return {
    unreadCount,
    hasUrgent,
    badgeColor,
    fetchUnreadCount,
    markAsRead,
  }
}
