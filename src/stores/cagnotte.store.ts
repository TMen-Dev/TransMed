// src/stores/cagnotte.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Cagnotte, DefinirMontantCibleDto, AjouterContributionDto } from '../types/cagnotte.types'
import { cagnotteService } from '../services/index'

export const useCagnotteStore = defineStore('cagnotte', () => {
  const cagnottesParDemande = ref<Map<string, Cagnotte>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchForDemande(demandeId: string): Promise<Cagnotte> {
    loading.value = true
    error.value = null
    try {
      const cagnotte = await cagnotteService.getByDemandeId(demandeId)
      cagnottesParDemande.value.set(demandeId, cagnotte)
      return cagnotte
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur de chargement'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function definirMontantCible(data: DefinirMontantCibleDto, demandeId: string): Promise<Cagnotte> {
    const cagnotte = await cagnotteService.definirMontantCible(data)
    cagnottesParDemande.value.set(demandeId, cagnotte)
    return cagnotte
  }

  async function ajouterContribution(
    data: AjouterContributionDto,
    demandeId: string
  ): Promise<{ objectifAtteint: boolean }> {
    const { cagnotte, objectifAtteint } = await cagnotteService.ajouterContribution(data)
    cagnottesParDemande.value.set(demandeId, cagnotte)

    return { objectifAtteint }
  }

  function getForDemande(demandeId: string): Cagnotte | undefined {
    return cagnottesParDemande.value.get(demandeId)
  }

  return {
    cagnottesParDemande,
    loading,
    error,
    fetchForDemande,
    definirMontantCible,
    ajouterContribution,
    getForDemande,
  }
})
