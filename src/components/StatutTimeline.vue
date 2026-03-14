<template>
  <div class="tm-tracker">
    <!-- ── Rail segmenté ── -->
    <div
      class="rail"
      role="progressbar"
      :aria-valuenow="currentIdx + 1"
      :aria-valuemax="STEPS.length"
    >
      <div
        v-for="(step, i) in STEPS"
        :key="step.key"
        class="rail-seg"
        :class="{
          'seg-done': i < currentIdx,
          'seg-active': i === currentIdx,
          'seg-future': i > currentIdx,
        }"
      >
        <div
          v-if="i === currentIdx"
          class="seg-pulse"
        />
      </div>
    </div>

    <!-- ── Hero étape courante ── -->
    <div
      :key="statut"
      class="hero"
    >
      <!-- Icône + info -->
      <div class="hero-main">
        <div class="hero-icon-wrap">
          <div class="hero-icon">
            <component :is="currentStep.icon" />
          </div>
        </div>

        <div class="hero-text">
          <div class="hero-label">
            {{ currentStep.label }}
          </div>
          <div class="hero-sub">
            {{ currentStep.sub }}
          </div>
        </div>

        <div class="hero-counter">
          <span class="counter-num">{{ currentIdx + 1 }}</span>
          <span class="counter-sep">/</span>
          <span class="counter-tot">{{ STEPS.length }}</span>
        </div>
      </div>

      <!-- Breadcrumb contextuel -->
      <div class="breadcrumb">
        <span
          v-if="prevStep"
          class="bc-prev"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          {{ prevStep.label }}
        </span>
        <span
          v-if="prevStep || nextStep"
          class="bc-dot"
        />
        <span
          v-if="nextStep"
          class="bc-next"
        >
          {{ nextStep.label }}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span
          v-if="!nextStep"
          class="bc-done-tag"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          Terminée
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import type { StatutDemande } from '../types/demande.types'

const props = defineProps<{ statut: StatutDemande }>()

// ── SVG icons as render functions ──────────────────────────────────────────

const IconClipboard = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M9 2h6a1 1 0 011 1v1H8V3a1 1 0 011-1z', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
  h('rect', { x: 4, y: 4, width: 16, height: 18, rx: 2, stroke: 'currentColor', 'stroke-width': '1.8' }),
  h('path', { d: 'M8 11h8M8 15h5', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
]) })

const IconBag = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M3 6h18M16 10a4 4 0 01-8 0', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
]) })

const IconTruck = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('rect', { x: 1, y: 3, width: 15, height: 13, rx: 1, stroke: 'currentColor', 'stroke-width': '1.8' }),
  h('path', { d: 'M16 8h4l3 5v4h-7V8z', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
  h('circle', { cx: 5.5, cy: 18.5, r: 2.5, stroke: 'currentColor', 'stroke-width': '1.8' }),
  h('circle', { cx: 18.5, cy: 18.5, r: 2.5, stroke: 'currentColor', 'stroke-width': '1.8' }),
]) })

const IconReady = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M22 11.08V12a10 10 0 11-5.93-9.14', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
  h('path', { d: 'M22 4L12 14.01l-3-3', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
]) })

const IconBox = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z', stroke: 'currentColor', 'stroke-width': '1.8' }),
  h('path', { d: 'M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
]) })

const IconCalendar = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('rect', { x: 3, y: 4, width: 18, height: 18, rx: 2, stroke: 'currentColor', 'stroke-width': '1.8' }),
  h('path', { d: 'M16 2v4M8 2v4M3 10h18', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
  h('circle', { cx: 12, cy: 16, r: 1.5, fill: 'currentColor' }),
]) })

const IconHome = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
  h('path', { d: 'M9 22V12h6v10', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round' }),
]) })

const IconStar = defineComponent({ render: () => h('svg', { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none' }, [
  h('path', { d: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linejoin': 'round' }),
]) })

// ── Steps data ─────────────────────────────────────────────────────────────

const STEPS: { key: StatutDemande; label: string; sub: string; icon: ReturnType<typeof defineComponent> }[] = [
  { key: 'nouvelle_demande',                        label: 'Nouvelle',    sub: 'Demande en attente d\'aidants',       icon: IconClipboard },
  { key: 'medicaments_achetes_attente_transporteur', label: 'Achetés',     sub: 'Médicaments prêts, cherche transporteur', icon: IconBag },
  { key: 'transporteur_disponible_attente_acheteur', label: 'Transporteur',sub: 'Transporteur dispo, cherche acheteur',    icon: IconTruck },
  { key: 'transporteur_et_medicaments_prets',        label: 'Prêt',        sub: 'Tous les rôles couverts',            icon: IconReady },
  { key: 'en_cours_livraison_transporteur',          label: 'En transit',  sub: 'Médicaments en route vers transporteur', icon: IconBox },
  { key: 'rdv_a_fixer',                              label: 'RDV',         sub: 'Rendez-vous patient à confirmer',    icon: IconCalendar },
  { key: 'en_cours_livraison_patient',               label: 'Livraison',   sub: 'Médicaments en route vers patient',  icon: IconHome },
  { key: 'traitee',                                  label: 'Traitée',     sub: 'Demande clôturée avec succès',       icon: IconStar },
]

const currentIdx = computed(() => STEPS.findIndex((s) => s.key === props.statut))
const currentStep = computed(() => STEPS[currentIdx.value] ?? STEPS[0])
const prevStep = computed(() => currentIdx.value > 0 ? STEPS[currentIdx.value - 1] : null)
const nextStep = computed(() => currentIdx.value < STEPS.length - 1 ? STEPS[currentIdx.value + 1] : null)
</script>

<style scoped>
/* ── Container ─────────────────────────────────────────────────────────── */
.tm-tracker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 0 4px;
}

/* ── Rail segmenté ─────────────────────────────────────────────────────── */
.rail {
  display: flex;
  gap: 3px;
  align-items: center;
  padding: 2px 0;
}

.rail-seg {
  flex: 1;
  height: 5px;
  border-radius: 100px;
  position: relative;
  overflow: visible;
  transition: background 0.4s ease;
}

.seg-done {
  background: #1B8C5A;
}

.seg-active {
  background: #1B8C5A;
  box-shadow: 0 0 0 2px rgba(27, 140, 90, 0.18);
}

.seg-future {
  background: #E8E1D9;
}

/* Pulse ring sur le segment actif */
.seg-pulse {
  position: absolute;
  inset: -3px;
  border-radius: 100px;
  border: 1.5px solid rgba(27, 140, 90, 0.4);
  animation: segPulse 2s ease-in-out infinite;
}

@keyframes segPulse {
  0%, 100% { opacity: 1; transform: scaleX(1); }
  50%       { opacity: 0.4; transform: scaleX(1.04); }
}

/* ── Hero ──────────────────────────────────────────────────────────────── */
.hero {
  background: #FFFFFF;
  border: 1px solid #E8E1D9;
  border-radius: 12px;
  padding: 12px 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: heroIn 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
  box-shadow: 0 1px 6px rgba(26, 21, 16, 0.05);
}

@keyframes heroIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-main {
  display: flex;
  align-items: center;
  gap: 11px;
}

/* ── Icône ─────────────────────────────────────────────────────────────── */
.hero-icon-wrap {
  flex-shrink: 0;
}

.hero-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #E8F7F0;
  color: #1B8C5A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Texte ─────────────────────────────────────────────────────────────── */
.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-label {
  font-size: 0.97rem;
  font-weight: 700;
  color: #1A1510;
  line-height: 1.2;
}

.hero-sub {
  font-size: 0.76rem;
  color: #7A6E65;
  margin-top: 2px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Compteur ──────────────────────────────────────────────────────────── */
.hero-counter {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  gap: 1px;
  background: #F0EDE8;
  border-radius: 20px;
  padding: 3px 9px;
}

.counter-num {
  font-size: 0.88rem;
  font-weight: 800;
  color: #1B8C5A;
}

.counter-sep {
  font-size: 0.75rem;
  color: #B0A8A0;
  font-weight: 400;
}

.counter-tot {
  font-size: 0.75rem;
  font-weight: 500;
  color: #9E8E85;
}

/* ── Breadcrumb ────────────────────────────────────────────────────────── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 6px;
  border-top: 1px solid #F0EDE8;
}

.bc-prev,
.bc-next {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.73rem;
  font-weight: 500;
  color: #9E8E85;
  padding: 2px 8px;
  background: #F5F2EE;
  border-radius: 20px;
  white-space: nowrap;
}

.bc-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #D0C8C0;
  flex-shrink: 0;
}

.bc-done-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.73rem;
  font-weight: 600;
  color: #1B8C5A;
  padding: 2px 9px;
  background: #E8F7F0;
  border-radius: 20px;
}
</style>
