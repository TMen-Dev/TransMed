// src/stores/propositions.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Proposition, CreatePropositionDto } from '../types/proposition.types'
import { propositionService } from '../services/index'
import { useDemandeStore } from './demandes.store'
import { useCagnotteStore } from './cagnotte.store'
import { useNotification } from '../composables/useNotification'

export const usePropositionsStore = defineStore('propositions', () => {
  const propositionsParDemande = ref<Map<string, Proposition[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchForDemande(demandeId: string): Promise<Proposition[]> {
    loading.value = true
    error.value = null
    try {
      const props = await propositionService.getByDemandeId(demandeId)
      propositionsParDemande.value.set(demandeId, props)
      return props
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createProposition(data: CreatePropositionDto): Promise<Proposition> {
    const demandeStore = useDemandeStore()
    const cagnotteStore = useCagnotteStore()

    const proposition = await propositionService.create(data)

    // Mettre à jour la liste locale des propositions (store propositions)
    const existing = propositionsParDemande.value.get(data.demandeId) ?? []
    propositionsParDemande.value.set(data.demandeId, [...existing, proposition])

    // H3 — Synchroniser aussi dans demandes[i].propositions pour peutVoirOrdonnance, etc.
    const demandeIndex = demandeStore.demandes.findIndex((d) => d.id === data.demandeId)
    if (demandeIndex !== -1) {
      demandeStore.demandes[demandeIndex].propositions.push(proposition)
    }

    // Déclencher la transition de statut
    if (data.type === 'prop1_cagnotte' && data.montantContribue) {
      // Ajouter contribution à la cagnotte
      const demande = demandeStore.getById(data.demandeId)
      if (demande) {
        const { objectifAtteint } = await cagnotteStore.ajouterContribution(
          {
            cagnotteId: demande.cagnotteId,
            aidantId: data.aidantId,
            aidantPrenom: data.aidantPrenom,
            montant: data.montantContribue,
          },
          data.demandeId
        )
        const evenement = objectifAtteint ? 'prop1_cagnotte_atteinte' : 'prop1_contribution'
        await demandeStore.triggerTransition(data.demandeId, evenement)
        // FR-118 — Notif email APRÈS la transition (prop1_cagnotte_atteinte peut → pret si transporteur déjà là)
        const demandeApres1 = demandeStore.getById(data.demandeId)
        if (demandeApres1) {
          const { checkAndSendEmailNotif } = useNotification()
          await checkAndSendEmailNotif(demandeApres1)
        }
      }
    } else if (data.type === 'prop2_transport') {
      await demandeStore.triggerTransition(data.demandeId, 'prop2_transport')
      // C1/C2 — Assigner le transporteur
      await demandeStore.setTransporteur(data.demandeId, data.aidantId, data.aidantPrenom)
      // FR-118 — Vérifier si notification email doit être déclenchée
      const demandeApresProp2 = demandeStore.getById(data.demandeId)
      if (demandeApresProp2) {
        const { checkAndSendEmailNotif } = useNotification()
        await checkAndSendEmailNotif(demandeApresProp2)
      }
    } else if (data.type === 'prop3_achat_transport') {
      await demandeStore.triggerTransition(data.demandeId, 'prop3_achat_transport')
      // C1/C2 — Assigner le transporteur (acheteur = transporteur pour Prop3)
      await demandeStore.setTransporteur(data.demandeId, data.aidantId, data.aidantPrenom)
      // FR-118 — Vérifier si notification email doit être déclenchée
      const demandeApresProp3 = demandeStore.getById(data.demandeId)
      if (demandeApresProp3) {
        const { checkAndSendEmailNotif } = useNotification()
        await checkAndSendEmailNotif(demandeApresProp3)
      }
    }

    return proposition
  }

  function getForDemande(demandeId: string): Proposition[] {
    return propositionsParDemande.value.get(demandeId) ?? []
  }

  return {
    propositionsParDemande,
    loading,
    error,
    fetchForDemande,
    createProposition,
    getForDemande,
  }
})
