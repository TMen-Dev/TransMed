// src/composables/useAidantsInteresses.ts
// feature 009 — badge "N aidants intéressés" (propositions + pré-chats)

import { ref, onUnmounted } from 'vue'
import { messageService } from '../services/index'
import { supabase } from '../lib/supabase'

export function useAidantsInteresses(demandeId: string) {
  const count = ref(0)

  async function refresh(): Promise<void> {
    try {
      count.value = await messageService.countAidantsInteresses(demandeId)
    } catch {
      // Non bloquant
    }
  }

  // Charger le count initial
  void refresh()

  // Realtime : rafraîchir à chaque nouvelle proposition ou nouveau message aidant
  const channel = supabase
    .channel(`aidants-interesses:${demandeId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'propositions',
        filter: `demande_id=eq.${demandeId}`,
      },
      () => void refresh()
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `demande_id=eq.${demandeId}`,
      },
      () => void refresh()
    )
    .subscribe()

  onUnmounted(() => {
    channel.unsubscribe()
  })

  return { count, refresh }
}
