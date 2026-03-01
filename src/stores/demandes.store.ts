// src/stores/demandes.store.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Demande, CreateDemandeDto, StatutDemande, TypeEvenement } from '../types/demande.types'
import { demandeService } from '../services/index'
import { applyTransition, canTransition } from '../services/demandeStateMachine'

const STATUTS_ACTIFS_AIDANT: StatutDemande[] = [
  'attente_fonds_et_transporteur',
  'fonds_atteints',
  'transporteur_disponible',
]

export const useDemandeStore = defineStore('demandes', () => {
  const demandes = ref<Demande[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const demandesActivesAidant = computed(() =>
    demandes.value.filter((d) => STATUTS_ACTIFS_AIDANT.includes(d.statut))
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      demandes.value = await demandeService.getAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
    } finally {
      loading.value = false
    }
  }

  async function fetchForPatient(patientId: string) {
    loading.value = true
    error.value = null
    try {
      demandes.value = await demandeService.getByPatientId(patientId)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
    } finally {
      loading.value = false
    }
  }

  async function createDemande(data: CreateDemandeDto): Promise<Demande> {
    const demande = await demandeService.create(data)
    demandes.value.unshift(demande)
    return demande
  }

  async function triggerTransition(demandeId: string, evenement: TypeEvenement): Promise<void> {
    const demande = demandes.value.find((d) => d.id === demandeId)
    if (!demande) throw new Error(`Demande introuvable : ${demandeId}`)

    const nextStatut = applyTransition(demande.statut, evenement) // throws si illégal
    if (nextStatut !== demande.statut) {
      const updated = await demandeService.updateStatut(demandeId, nextStatut)
      const index = demandes.value.findIndex((d) => d.id === demandeId)
      if (index !== -1) demandes.value[index] = updated
    }
  }

  async function confirmerParPatient(demandeId: string): Promise<void> {
    const updated = await demandeService.confirmerParPatient(demandeId)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function confirmerLivraison(demandeId: string): Promise<void> {
    const updated = await demandeService.confirmerParPatient(demandeId)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function livrerOrdonnance(demandeId: string): Promise<void> {
    const updated = await demandeService.marquerLivree(demandeId)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function recevoirMedicaments(demandeId: string, messageRemerciement?: string): Promise<void> {
    const updated = await demandeService.marquerTraitee(demandeId, messageRemerciement)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function marquerLivree(demandeId: string): Promise<void> {
    const updated = await demandeService.marquerLivree(demandeId)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function setTransporteur(demandeId: string, aidantId: string, aidantPrenom: string): Promise<void> {
    const updated = await demandeService.updateTransporteur(demandeId, aidantId, aidantPrenom)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  async function markEmailNotifSent(demandeId: string): Promise<void> {
    const updated = await demandeService.markEmailNotifSent(demandeId)
    const index = demandes.value.findIndex((d) => d.id === demandeId)
    if (index !== -1) demandes.value[index] = updated
  }

  function getById(id: string): Demande | undefined {
    return demandes.value.find((d) => d.id === id)
  }

  return {
    demandes,
    loading,
    error,
    demandesActivesAidant,
    fetchAll,
    fetchForPatient,
    createDemande,
    triggerTransition,
    setTransporteur,
    markEmailNotifSent,
    confirmerParPatient,
    confirmerLivraison,
    livrerOrdonnance,
    recevoirMedicaments,
    marquerLivree,
    getById,
    canTransition,
  }
})
