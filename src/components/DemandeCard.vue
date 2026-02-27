<template>
  <div class="demande-card" :class="`accent-${accentClass}`" @click="$emit('click')">
    <div class="card-top">
      <div class="medicaments-preview">
        <span
          v-for="(med, index) in demande.medicaments.slice(0, 2)"
          :key="index"
          class="med-chip"
        >
          {{ med.nom }} <span class="med-qty">×{{ med.quantite }}</span>
        </span>
        <span v-if="demande.medicaments.length > 2" class="med-chip med-more">
          +{{ demande.medicaments.length - 2 }}
        </span>
      </div>
      <StatutBadge :statut="demande.statut" />
    </div>

    <div class="card-bottom">
      <span class="adresse-wrap">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" class="pin-icon">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
        </svg>
        <span class="adresse">{{ demande.adresseLivraison }}</span>
      </span>
      <span class="date">{{ formatDate(demande.createdAt) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatutBadge from './StatutBadge.vue'
import type { Demande } from '../types/demande.types'

const props = defineProps<{ demande: Demande }>()
defineEmits<{ (e: 'click'): void }>()

const ACCENT_MAP: Record<string, string> = {
  attente_fonds_et_transporteur: 'gray',
  attente_fonds: 'amber',
  attente_transporteur: 'blue',
  fonds_atteints: 'gold',
  transporteur_disponible: 'blue',
  pret_acceptation_patient: 'green',
  en_cours_livraison: 'terra',
  traitee: 'green',
}

const accentClass = computed(() => ACCENT_MAP[props.demande.statut] ?? 'gray')

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}
</script>

<style scoped>
.demande-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 10px rgba(26, 21, 16, 0.06);
  margin: 8px 16px;
  padding: 14px 16px 12px;
  cursor: pointer;
  border-left: 4px solid #E8E1D9;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  animation: tmFadeUp 0.35s ease both;
}

.demande-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(26, 21, 16, 0.11);
}

.demande-card:active {
  transform: scale(0.985);
  box-shadow: 0 2px 8px rgba(26, 21, 16, 0.08);
}

/* ── Accent colors ── */
.accent-green  { border-left-color: #1B8C5A; }
.accent-amber  { border-left-color: #D68910; }
.accent-blue   { border-left-color: #2B7CC1; }
.accent-gold   { border-left-color: #C9820A; }
.accent-terra  { border-left-color: #C8521A; }
.accent-gray   { border-left-color: #9E8E85; }

/* ── Layout ── */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 10px;
}

.medicaments-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  flex: 1;
}

.med-chip {
  background: #F0FAF5;
  color: #146B45;
  border: 1px solid #C6EADA;
  border-radius: 100px;
  padding: 3px 9px;
  font-size: 0.78rem;
  font-weight: 500;
}

.med-qty {
  color: #1B8C5A;
  font-weight: 700;
}

.med-more {
  background: #F0EDE8;
  color: #7A6E65;
  border-color: #E0D8D0;
}

.card-bottom {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: #7A6E65;
}

.adresse-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}

.pin-icon {
  flex-shrink: 0;
  color: #9E8E85;
}

.adresse {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.date {
  white-space: nowrap;
  font-weight: 500;
  color: #9E8E85;
}
</style>
