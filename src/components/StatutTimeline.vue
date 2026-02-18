<template>
  <div class="timeline">
    <div
      v-for="etape in ETAPES"
      :key="etape.statut"
      class="timeline-step"
      :class="{
        'is-done': statutIndex(etape.statut) < statutIndex(statut),
        'is-current': etape.statut === statut,
        'is-future': statutIndex(etape.statut) > statutIndex(statut),
      }"
    >
      <div class="step-dot">
        <ion-icon v-if="statutIndex(etape.statut) < statutIndex(statut)" :icon="checkmarkOutline" />
        <span v-else>{{ etape.numero }}</span>
      </div>
      <div class="step-label">{{ etape.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { checkmarkOutline } from 'ionicons/icons'
import type { StatutDemande } from '../types/demande.types'

defineProps<{
  statut: StatutDemande
}>()

const ETAPES: { statut: StatutDemande; label: string; numero: number }[] = [
  { statut: 'attente_fonds_et_transporteur', label: 'En attente', numero: 1 },
  { statut: 'fonds_atteints', label: 'Fonds atteints', numero: 2 },
  { statut: 'transporteur_disponible', label: 'Transporteur prêt', numero: 3 },
  { statut: 'pret_acceptation_patient', label: 'À confirmer', numero: 4 },
  { statut: 'en_cours_livraison', label: 'En livraison', numero: 5 },
  { statut: 'traitee', label: 'Traitée', numero: 6 },
]

const ORDRE: StatutDemande[] = [
  'attente_fonds_et_transporteur',
  'attente_fonds',
  'attente_transporteur',
  'fonds_atteints',
  'transporteur_disponible',
  'pret_acceptation_patient',
  'en_cours_livraison',
  'traitee',
]

function statutIndex(s: StatutDemande): number {
  return ORDRE.indexOf(s)
}
</script>

<style scoped>
.timeline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  overflow-x: auto;
  padding: 16px 0;
}
.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 60px;
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--ion-color-light-shade);
  color: var(--ion-color-medium);
  transition: all 0.2s;
}
.is-done .step-dot {
  background: var(--ion-color-success);
  color: white;
}
.is-current .step-dot {
  background: var(--ion-color-primary);
  color: white;
  box-shadow: 0 0 0 3px var(--ion-color-primary-tint);
}
.step-label {
  font-size: 0.65rem;
  text-align: center;
  color: var(--ion-color-medium);
  line-height: 1.2;
}
.is-current .step-label {
  color: var(--ion-color-primary);
  font-weight: 600;
}
.is-done .step-label {
  color: var(--ion-color-success);
}
</style>
