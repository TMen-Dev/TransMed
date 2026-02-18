<template>
  <ion-badge :color="couleur" class="statut-badge">{{ libelle }}</ion-badge>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { IonBadge } from '@ionic/vue'
import type { StatutDemande } from '../types/demande.types'

const props = defineProps<{
  statut: StatutDemande
}>()

const LIBELLES: Record<StatutDemande, string> = {
  attente_fonds_et_transporteur: 'En attente',
  attente_fonds: 'Attend les fonds',
  attente_transporteur: 'Attend transporteur',
  fonds_atteints: 'Fonds atteints',
  transporteur_disponible: 'Transporteur disponible',
  pret_acceptation_patient: 'À confirmer',
  en_cours_livraison: 'En livraison',
  traitee: 'Traitée',
}

const COULEURS: Record<StatutDemande, string> = {
  attente_fonds_et_transporteur: 'medium',
  attente_fonds: 'warning',
  attente_transporteur: 'warning',
  fonds_atteints: 'success',
  transporteur_disponible: 'tertiary',
  pret_acceptation_patient: 'primary',
  en_cours_livraison: 'secondary',
  traitee: 'success',
}

const libelle = computed(() => LIBELLES[props.statut])
const couleur = computed(() => COULEURS[props.statut])
</script>

<style scoped>
.statut-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 12px;
}
</style>
