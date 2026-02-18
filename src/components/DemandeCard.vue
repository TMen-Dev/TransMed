<template>
  <ion-card class="demande-card" button @click="$emit('click')">
    <ion-card-content>
      <div class="card-header">
        <div class="medicaments-preview">
          <span
            v-for="(med, index) in demande.medicaments.slice(0, 2)"
            :key="index"
            class="med-chip"
          >
            {{ med.nom }} ×{{ med.quantite }}
          </span>
          <span v-if="demande.medicaments.length > 2" class="med-chip med-chip--more">
            +{{ demande.medicaments.length - 2 }} autres
          </span>
        </div>
        <StatutBadge :statut="demande.statut" />
      </div>

      <div class="card-footer">
        <ion-icon :icon="locationOutline" size="small" color="medium" />
        <span class="adresse">{{ demande.adresseLivraison }}</span>
        <span class="date">{{ formatDate(demande.createdAt) }}</span>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardContent, IonIcon } from '@ionic/vue'
import { locationOutline } from 'ionicons/icons'
import StatutBadge from './StatutBadge.vue'
import type { Demande } from '../types/demande.types'

defineProps<{
  demande: Demande
}>()

defineEmits<{
  (e: 'click'): void
}>()

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<style scoped>
.demande-card {
  margin: 8px 16px;
  cursor: pointer;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
}
.medicaments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex: 1;
}
.med-chip {
  background: var(--ion-color-primary-tint);
  color: var(--ion-color-primary);
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.8rem;
}
.med-chip--more {
  background: var(--ion-color-light);
  color: var(--ion-color-medium);
}
.card-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-medium);
  font-size: 0.8rem;
}
.adresse {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.date {
  white-space: nowrap;
}
</style>
