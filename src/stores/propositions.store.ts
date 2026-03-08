// src/stores/propositions.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Proposition, CreatePropositionDto } from '../types/proposition.types'
import { propositionService } from '../services/index'
import { useDemandeStore } from './demandes.store'
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

    // Création de la proposition (vérification verrous + état dans le service)
    const proposition = await propositionService.create(data)

    // Mettre à jour la liste locale des propositions
    const existing = propositionsParDemande.value.get(data.demandeId) ?? []
    propositionsParDemande.value.set(data.demandeId, [...existing, proposition])

    // Synchroniser dans demandes[i].propositions pour peutVoirOrdonnance, etc.
    const demandeIndex = demandeStore.demandes.findIndex((d) => d.id === data.demandeId)
    if (demandeIndex !== -1) {
      demandeStore.demandes[demandeIndex].propositions.push(proposition)
    }

    if (data.type === 'prop_achat_transport') {
      // Scénario 1 — aidant unique couvre les deux rôles
      await demandeStore.setAcheteur(data.demandeId, data.aidantId, data.aidantPrenom)
      await demandeStore.setTransporteur(data.demandeId, data.aidantId, data.aidantPrenom)
      // Marquer singleAidant dans le store local (le service Supabase le gère côté BDD)
      const idx = demandeStore.demandes.findIndex((d) => d.id === data.demandeId)
      if (idx !== -1) demandeStore.demandes[idx].singleAidant = true
      // A→D
      await demandeStore.triggerTransition(data.demandeId, 'prop_achat_transport')
      // D→F automatique (scénario 1) + email patient
      await demandeStore.triggerTransition(data.demandeId, 'auto_rdv_patient')
      const demandeApres = demandeStore.getById(data.demandeId)
      if (demandeApres) {
        const { checkAndSendEmailNotif } = useNotification()
        await checkAndSendEmailNotif(demandeApres)
      }

    } else if (data.type === 'prop_achat_envoi') {
      // Scénario 2 (A→B) ou scénario 3 phase acheteur (C→D)
      await demandeStore.setAcheteur(data.demandeId, data.aidantId, data.aidantPrenom)
      const demande = demandeStore.getById(data.demandeId)
      if (demande?.statut === 'nouvelle_demande') {
        // A→B
        await demandeStore.triggerTransition(data.demandeId, 'prop_achat_envoi')
      } else if (demande?.statut === 'transporteur_disponible_attente_acheteur') {
        // C→D
        await demandeStore.triggerTransition(data.demandeId, 'prop_achat_envoi')
        // Email aidant-transporteur : "un acheteur est prêt"
        const demandeApres = demandeStore.getById(data.demandeId)
        if (demandeApres) {
          const { checkAndSendEmailNotif } = useNotification()
          await checkAndSendEmailNotif(demandeApres)
        }
      }

    } else if (data.type === 'prop_transport') {
      // Scénario 3 (A→C) ou scénario 2 phase transporteur (B→D)
      await demandeStore.setTransporteur(data.demandeId, data.aidantId, data.aidantPrenom)
      const demande = demandeStore.getById(data.demandeId)
      if (demande?.statut === 'nouvelle_demande') {
        // A→C
        await demandeStore.triggerTransition(data.demandeId, 'prop_transport')
      } else if (demande?.statut === 'medicaments_achetes_attente_transporteur') {
        // B→D
        await demandeStore.triggerTransition(data.demandeId, 'prop_transport')
        // Email aidant-acheteur : "un transporteur est disponible"
        const demandeApres = demandeStore.getById(data.demandeId)
        if (demandeApres) {
          const { checkAndSendEmailNotif } = useNotification()
          await checkAndSendEmailNotif(demandeApres)
        }
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
