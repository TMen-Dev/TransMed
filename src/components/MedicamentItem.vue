<template>
  <div class="med-item">
    <div class="med-icon">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="4"
          y="2"
          width="16"
          height="20"
          rx="3"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="M8 10h8M8 14h5"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <circle
          cx="12"
          cy="6"
          r="1.5"
          fill="currentColor"
        />
      </svg>
    </div>
    <span class="med-nom">{{ medicament.nom }}</span>
    <span class="med-qty">× {{ medicament.quantite }}</span>
  </div>
</template>

<script setup lang="ts">
import type { Medicament } from '../types/medicament.types'
defineProps<{ medicament: Medicament }>()
</script>

<style scoped>
.med-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #F0EDE8;
  animation: tmSlideRight 0.3s ease both;
}

.med-item:last-child {
  border-bottom: none;
}

.med-icon {
  width: 30px;
  height: 30px;
  background: #E8F7F0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1B8C5A;
  flex-shrink: 0;
}

.med-nom {
  flex: 1;
  font-size: 0.92rem;
  font-weight: 500;
  color: #1A1510;
}

.med-qty {
  font-size: 0.82rem;
  font-weight: 700;
  color: #1B8C5A;
  background: #E8F7F0;
  border-radius: 100px;
  padding: 2px 8px;
}
</style>
