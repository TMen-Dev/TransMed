<template>
  <span class="statut-badge" :class="`statut-${statut}`">
    <span class="badge-dot" />
    {{ libelle }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatutDemande } from '../types/demande.types'

const props = defineProps<{ statut: StatutDemande }>()

const LIBELLES: Record<StatutDemande, string> = {
  attente_fonds_et_transporteur: 'En attente',
  attente_fonds: 'Attend les fonds',
  attente_transporteur: 'Attend transporteur',
  fonds_atteints: 'Fonds atteints',
  transporteur_disponible: 'Transporteur prêt',
  pret_acceptation_patient: 'À confirmer',
  en_cours_livraison: 'En livraison',
  traitee: 'Traitée ✓',
}

const libelle = computed(() => LIBELLES[props.statut])
</script>

<style scoped>
.statut-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Couleurs par statut ── */
.statut-attente_fonds_et_transporteur {
  background: #F0EDE8;
  color: #6B5F58;
}
.statut-attente_fonds_et_transporteur .badge-dot { background: #9E8E85; }

.statut-attente_fonds {
  background: #FEF9EC;
  color: #96610A;
}
.statut-attente_fonds .badge-dot { background: #D68910; }

.statut-attente_transporteur {
  background: #EAF3FB;
  color: #1A5C96;
}
.statut-attente_transporteur .badge-dot { background: #2B7CC1; }

.statut-fonds_atteints {
  background: #FEF9EC;
  color: #956208;
}
.statut-fonds_atteints .badge-dot {
  background: #C9820A;
  animation: dotPulse 1.5s ease-in-out infinite;
}

.statut-transporteur_disponible {
  background: #EAF3FB;
  color: #1A5C96;
}
.statut-transporteur_disponible .badge-dot { background: #2B7CC1; }

.statut-pret_acceptation_patient {
  background: #E8F7F0;
  color: #146B45;
}
.statut-pret_acceptation_patient .badge-dot {
  background: #1B8C5A;
  animation: dotPulse 1.2s ease-in-out infinite;
}

.statut-en_cours_livraison {
  background: #FDF0E8;
  color: #A94517;
}
.statut-en_cours_livraison .badge-dot { background: #C8521A; }

.statut-traitee {
  background: #E8F7F0;
  color: #146B45;
}
.statut-traitee .badge-dot { background: #1B8C5A; }

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(1.3); }
}
</style>
