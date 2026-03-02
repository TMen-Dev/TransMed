// src/composables/useDemandeRealtime.ts
// Subscription Supabase Realtime sur la table `demandes` filtrée par ID.
// Rafraîchit le store demandes lors d'un changement de statut en temps réel.

import { onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import { useDemandeStore } from '../stores/demandes.store'
import { demandeService } from '../services/index'

export function useDemandeRealtime(demandeId: string) {
  const demandeStore = useDemandeStore()

  const channel = supabase
    .channel(`demande:${demandeId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'demandes',
        filter: `id=eq.${demandeId}`,
      },
      async () => {
        try {
          const fresh = await demandeService.getById(demandeId)
          const idx = demandeStore.demandes.findIndex((d) => d.id === demandeId)
          if (idx !== -1) demandeStore.demandes[idx] = fresh
          else demandeStore.demandes.unshift(fresh)
        } catch {
          // Erreur silencieuse — le store conserve sa valeur précédente
        }
      }
    )
    .subscribe()

  onUnmounted(() => {
    channel.unsubscribe()
  })
}
