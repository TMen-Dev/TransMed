// src/composables/useNotification.ts
// FR-118-120 — Notification email mockée au patient

import { ref } from 'vue'
import type { Demande } from '../types/demande.types'
import { useDemandeStore } from '../stores/demandes.store'

const PATIENT_EMAIL_TEST = 'testpatient@yopmail.com'

const notifTriggered = ref(false)
const notifMessage = ref('')

export function useNotification() {
  const demandeStore = useDemandeStore()

  async function checkAndSendEmailNotif(demande: Demande): Promise<void> {
    console.log('[NOTIF] checkAndSendEmailNotif — statut:', demande.statut, '| emailNotifEnvoyee:', demande.emailNotifEnvoyee)
    // Guard : envoyer une seule fois, seulement quand la demande est prête
    if (demande.emailNotifEnvoyee) {
      console.log('[NOTIF] Guard 1 bloqué — email déjà envoyé')
      return
    }
    if (demande.statut !== 'pret_acceptation_patient') {
      console.log('[NOTIF] Guard 2 bloqué — statut:', demande.statut)
      return
    }

    const nomDemande = demande.nom || demande.id
    const corps = `Votre demande "${nomDemande}" est prête. Connectez-vous à TransMed pour confirmer la livraison ou chatter avec le transporteur.`

    // Simulation email — log console
    console.log('[EMAIL MOCK] ─────────────────────────────')
    console.log(`  À        : ${PATIENT_EMAIL_TEST}`)
    console.log(`  Sujet    : Votre demande TransMed "${nomDemande}" est prête`)
    console.log(`  Message  : ${corps}`)
    console.log('[EMAIL MOCK] ─────────────────────────────')

    await demandeStore.markEmailNotifSent(demande.id)

    notifMessage.value = `Un email a été envoyé à ${PATIENT_EMAIL_TEST} pour notifier que la demande "${nomDemande}" est prête.`
    notifTriggered.value = true
  }

  function resetNotif() {
    notifTriggered.value = false
    notifMessage.value = ''
  }

  return {
    notifTriggered,
    notifMessage,
    checkAndSendEmailNotif,
    resetNotif,
  }
}
