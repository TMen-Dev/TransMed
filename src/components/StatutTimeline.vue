<template>
  <div class="timeline-wrap">
    <div class="timeline">
      <div
        v-for="(etape, idx) in ETAPES"
        :key="etape.statut"
        class="timeline-step"
        :class="{
          'is-done': isEtapeDone(etape.statut),
          'is-current': etape.statut === statut,
          'is-future': !isEtapeDone(etape.statut) && etape.statut !== statut,
        }"
      >
        <!-- Ligne connecteur -->
        <div
          v-if="idx < ETAPES.length - 1"
          class="connector"
        >
          <div
            class="connector-fill"
            :class="{ 'filled': isEtapeDone(etape.statut) }"
          />
        </div>

        <!-- Point -->
        <div class="step-dot">
          <svg
            v-if="isEtapeDone(etape.statut)"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17l-5-5"
              stroke="white"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span v-else>{{ etape.numero }}</span>
        </div>

        <!-- Label -->
        <div class="step-label">
          {{ etape.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatutDemande } from '../types/demande.types'

const props = defineProps<{
  statut: StatutDemande
  cagnotte?: { montantCollecte: number; montantCible?: number } | null
}>()

const ETAPES: { statut: StatutDemande; label: string; numero: number }[] = [
  { statut: 'attente_fonds_et_transporteur', label: 'En attente',   numero: 1 },
  { statut: 'fonds_atteints',                label: 'Financé',      numero: 2 },
  { statut: 'transporteur_disponible',        label: 'Transporteur', numero: 3 },
  { statut: 'pret_acceptation_patient',       label: 'Prêt',        numero: 4 },
  { statut: 'livraison_confirmee',            label: 'Confirmé',    numero: 5 },
  { statut: 'livree',                         label: 'Livré',       numero: 6 },
  { statut: 'traitee',                        label: 'Traité',      numero: 7 },
]

const ORDRE: StatutDemande[] = [
  'attente_fonds_et_transporteur',
  'fonds_atteints',
  'transporteur_disponible',
  'pret_acceptation_patient',
  'livraison_confirmee',
  'livree',
  'traitee',
]

function statutIndex(s: StatutDemande): number {
  return ORDRE.indexOf(s)
}

/**
 * FR-110 — L'étape "Financé" (fonds_atteints) est marquée done uniquement si
 * le montant collecté atteint réellement le montant cible, indépendamment du statut.
 */
function isEtapeDone(etapeStatut: StatutDemande): boolean {
  if (etapeStatut === 'fonds_atteints') {
    if (!props.cagnotte?.montantCible) return false
    return props.cagnotte.montantCollecte >= props.cagnotte.montantCible
  }
  return statutIndex(etapeStatut) < statutIndex(props.statut)
}
</script>

<style scoped>
.timeline-wrap {
  overflow-x: auto;
  padding: 4px 0 8px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.timeline-wrap::-webkit-scrollbar { display: none; }

.timeline {
  display: flex;
  align-items: flex-start;
  min-width: max-content;
  padding: 8px 4px 4px;
}

.timeline-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  min-width: 62px;
}

/* ── Connecteur ── */
.connector {
  position: absolute;
  top: 13px;
  left: calc(50% + 13px);
  right: calc(-50% + 13px);
  height: 2px;
  background: #E8E1D9;
  border-radius: 2px;
  overflow: hidden;
}

.connector-fill {
  height: 100%;
  width: 0%;
  background: #1B8C5A;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.connector-fill.filled {
  width: 100%;
}

/* ── Point ── */
.step-dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 700;
  background: #ECE8E0;
  color: #9E8E85;
  border: 2px solid #E8E1D9;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  z-index: 1;
}

.is-done .step-dot {
  background: #1B8C5A;
  color: white;
  border-color: #1B8C5A;
}

.is-current .step-dot {
  background: #1B8C5A;
  color: white;
  border-color: #1B8C5A;
  animation: tmPulseRing 1.8s ease-in-out infinite;
}

/* ── Label ── */
.step-label {
  font-size: 0.62rem;
  text-align: center;
  color: #9E8E85;
  line-height: 1.2;
  max-width: 56px;
  font-weight: 500;
  transition: color 0.2s;
}

.is-current .step-label {
  color: #1B8C5A;
  font-weight: 700;
}

.is-done .step-label {
  color: #1B8C5A;
}
</style>
