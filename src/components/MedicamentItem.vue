<template>
  <ion-item lines="none" class="medicament-item">
    <ion-icon :icon="medkitOutline" slot="start" color="primary" />
    <ion-label>
      <span class="nom">{{ medicament.nom }}</span>
      <span class="quantite"> × {{ medicament.quantite }}</span>
    </ion-label>
  </ion-item>
</template>

<script setup lang="ts">
import { IonItem, IonLabel, IonIcon } from '@ionic/vue'
import { medkitOutline } from 'ionicons/icons'
import type { Medicament } from '../types/medicament.types'

defineProps<{
  medicament: Medicament
}>()
</script>

<style scoped>
.medicament-item {
  --padding-start: 0;
}
.nom {
  font-weight: 500;
}
.quantite {
  color: var(--ion-color-medium);
  font-size: 0.9em;
}
</style>
