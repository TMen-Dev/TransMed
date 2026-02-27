<template>
  <div class="cagnotte-card" :class="{ 'is-atteinte': cagnotte.statut === 'atteinte' }">
    <div class="cagnotte-header">
      <div class="cagnotte-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C10.34 2 9 3.34 9 5H4v2h1l1 12h12l1-12h1V5h-5c0-1.66-1.34-3-3-3zm0 2c.55 0 1 .45 1 1H11c0-.55.45-1 1-1zm-5.8 3h11.6l-.83 10H7.03L6.2 7zm5.8 1c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z" fill="currentColor"/>
        </svg>
      </div>
      <span class="cagnotte-title">Cagnotte</span>
      <span v-if="cagnotte.statut === 'atteinte'" class="atteinte-badge">
        🎉 Objectif atteint !
      </span>
    </div>

    <div v-if="cagnotte.statut === 'en_attente_evaluation'" class="en-attente">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="attente-icon">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <p>En attente d'évaluation par l'acheteur</p>
    </div>

    <div v-else>
      <div class="montants-row">
        <div class="montants">
          <span class="collecte">{{ formatMontant(cagnotte.montantCollecte) }}</span>
          <span class="separateur">/</span>
          <span class="cible">{{ formatMontant(cagnotte.montantCible) }}</span>
        </div>
        <span class="pct">{{ pctDisplay }}%</span>
      </div>

      <div class="progress-track">
        <div
          class="progress-fill"
          :class="{ 'is-gold': cagnotte.statut === 'atteinte' }"
          :style="{ width: `${Math.min(progression * 100, 100)}%` }"
        >
          <div class="progress-shimmer" />
        </div>
      </div>

      <div class="contributions-row">
        <span class="contrib-count">{{ cagnotte.contributions.length }} contribution(s)</span>
        <span v-if="cagnotte.statut === 'atteinte'" class="stars">★ ★ ★</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Cagnotte } from '../types/cagnotte.types'

const props = defineProps<{ cagnotte: Cagnotte }>()

const progression = computed(() => {
  if (!props.cagnotte.montantCible || props.cagnotte.montantCible === 0) return 0
  return Math.min(props.cagnotte.montantCollecte / props.cagnotte.montantCible, 1)
})

const pctDisplay = computed(() => Math.round(progression.value * 100))

function formatMontant(montant: number | undefined): string {
  if (montant === undefined) return '—'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(montant)
}
</script>

<style scoped>
.cagnotte-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.07);
  padding: 16px;
  margin: 0 0 12px;
  transition: box-shadow 0.3s ease;
  animation: tmFadeUp 0.35s ease both;
}

.cagnotte-card.is-atteinte {
  border-color: #C9820A;
  box-shadow: 0 4px 20px rgba(201, 130, 10, 0.18);
  animation: tmFadeUp 0.35s ease both, atteinteGlow 2s ease-in-out 0.5s infinite alternate;
}

@keyframes atteinteGlow {
  from { box-shadow: 0 4px 20px rgba(201, 130, 10, 0.18); }
  to   { box-shadow: 0 4px 28px rgba(201, 130, 10, 0.32); }
}

/* ── Header ── */
.cagnotte-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
}

.cagnotte-icon {
  width: 32px;
  height: 32px;
  background: #FEF9EC;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #C9820A;
  flex-shrink: 0;
}

.cagnotte-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1A1510;
  flex: 1;
}

.atteinte-badge {
  font-size: 0.78rem;
  font-weight: 700;
  color: #956208;
  background: #FEF9EC;
  border: 1px solid #E8C870;
  border-radius: 100px;
  padding: 3px 10px;
  animation: tmCelebrate 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── En attente ── */
.en-attente {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #96610A;
  background: #FEF9EC;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.88rem;
}

.attente-icon {
  flex-shrink: 0;
  color: #D68910;
  animation: tmFloat 2.5s ease-in-out infinite;
}

/* ── Montants ── */
.montants-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 10px;
}

.montants {
  display: flex;
  align-items: baseline;
  gap: 5px;
  font-size: 1.15rem;
  font-weight: 700;
}

.collecte {
  color: #1B8C5A;
}

.separateur {
  color: #C4B8AE;
  font-weight: 400;
}

.cible {
  color: #9E8E85;
  font-size: 0.95rem;
  font-weight: 500;
}

.pct {
  font-size: 0.85rem;
  font-weight: 700;
  color: #7A6E65;
}

.is-atteinte .collecte {
  color: #C9820A;
}

/* ── Barre de progression ── */
.progress-track {
  height: 10px;
  background: #F0EDE8;
  border-radius: 100px;
  overflow: hidden;
  position: relative;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background: #1B8C5A;
  border-radius: 100px;
  position: relative;
  overflow: hidden;
  transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
  min-width: 4px;
}

.progress-fill.is-gold {
  background: linear-gradient(90deg, #C9820A, #F5C518, #C9820A);
  background-size: 200% 100%;
  animation: goldSlide 2s linear infinite;
}

@keyframes goldSlide {
  0%   { background-position: 0% 0%; }
  100% { background-position: 200% 0%; }
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  animation: tmShimmer 2s ease-in-out infinite;
}

/* ── Contributions ── */
.contributions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.contrib-count {
  font-size: 0.8rem;
  color: #9E8E85;
}

.stars {
  font-size: 0.9rem;
  color: #C9820A;
  letter-spacing: 2px;
  animation: tmCelebrate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both;
}
</style>
