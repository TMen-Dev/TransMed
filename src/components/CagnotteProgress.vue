<template>
  <ion-card class="cagnotte-card">
    <ion-card-header>
      <ion-card-title class="cagnotte-title">
        <ion-icon :icon="walletOutline" />
        Cagnotte
      </ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <div v-if="cagnotte.statut === 'en_attente_evaluation'" class="en-attente">
        <ion-icon :icon="timeOutline" color="warning" />
        <p>En attente d'évaluation par l'acheteur</p>
      </div>
      <div v-else>
        <div class="montants">
          <span class="collecte">{{ formatMontant(cagnotte.montantCollecte) }}</span>
          <span class="separateur"> / </span>
          <span class="cible">{{ formatMontant(cagnotte.montantCible) }}</span>
        </div>
        <ion-progress-bar
          :value="progression"
          :color="cagnotte.statut === 'atteinte' ? 'success' : 'primary'"
          class="progress-bar"
        />
        <p class="contributions-count">
          {{ cagnotte.contributions.length }} contribution(s)
          <ion-badge v-if="cagnotte.statut === 'atteinte'" color="success">Objectif atteint !</ion-badge>
        </p>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonProgressBar, IonIcon, IonBadge } from '@ionic/vue'
import { walletOutline, timeOutline } from 'ionicons/icons'
import type { Cagnotte } from '../types/cagnotte.types'

const props = defineProps<{
  cagnotte: Cagnotte
}>()

const progression = computed(() => {
  if (!props.cagnotte.montantCible || props.cagnotte.montantCible === 0) return 0
  return Math.min(props.cagnotte.montantCollecte / props.cagnotte.montantCible, 1)
})

function formatMontant(montant: number | undefined): string {
  if (montant === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
}
</script>

<style scoped>
.cagnotte-card {
  margin: 8px 0;
}
.cagnotte-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
}
.en-attente {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ion-color-warning-shade);
}
.montants {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
}
.collecte {
  color: var(--ion-color-primary);
}
.cible {
  color: var(--ion-color-medium);
}
.separateur {
  color: var(--ion-color-medium);
}
.progress-bar {
  height: 8px;
  border-radius: 4px;
  margin-bottom: 8px;
}
.contributions-count {
  font-size: 0.85rem;
  color: var(--ion-color-medium);
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
