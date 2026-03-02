// src/composables/useNotification.ts
// 006-patient-notifications — Realtime listener sur notification_emails
// L'envoi email est entièrement serveur-side (Edge Function notify-patient).
// Ce composable écoute les changements Realtime et expose l'état de notification.

import { ref } from 'vue'
import type { Demande } from '../types/demande.types'
import { supabase } from '../lib/supabase'

const notifTriggered = ref(false)
const notifMessage = ref('')
const notifEchec = ref(false)

// Canal Realtime actif (une seule souscription à la fois)
let activeChannel: ReturnType<typeof supabase.channel> | null = null

export function useNotification() {
  function startListening(demandeId: string) {
    // Nettoyer le canal précédent si on change de demande
    if (activeChannel) {
      supabase.removeChannel(activeChannel)
      activeChannel = null
    }

    activeChannel = supabase
      .channel(`notification:${demandeId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_emails',
          filter: `demande_id=eq.${demandeId}`,
        },
        (payload) => {
          const row = payload.new as {
            statut?: string
            tentatives?: number
            patient_email?: string
          }

          if (row.statut === 'sent') {
            notifMessage.value = 'Patient notifié par email'
            notifTriggered.value = true
            notifEchec.value = false
          } else if (row.statut === 'failed' && (row.tentatives ?? 0) >= 3) {
            notifEchec.value = true
          }
        },
      )
      .subscribe()
  }

  function stopListening() {
    if (activeChannel) {
      supabase.removeChannel(activeChannel)
      activeChannel = null
    }
  }

  // Compatibilité avec les stores existants — no-op côté client
  // L'envoi est désormais entièrement géré par l'Edge Function notify-patient
  async function checkAndSendEmailNotif(_demande: Demande): Promise<void> {
    // no-op intentionnel — voir specs/006-patient-notifications/contracts/edge-functions.md
  }

  function resetNotif() {
    notifTriggered.value = false
    notifMessage.value = ''
    notifEchec.value = false
  }

  return {
    notifTriggered,
    notifMessage,
    notifEchec,
    startListening,
    stopListening,
    checkAndSendEmailNotif,
    resetNotif,
  }
}
