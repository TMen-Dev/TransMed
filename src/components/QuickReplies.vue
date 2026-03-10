<template>
  <div v-if="visible" class="quick-replies">
    <span class="quick-label">Suggestions :</span>
    <div class="quick-chips">
      <button
        v-for="texte in suggestions"
        :key="texte"
        class="quick-chip"
        type="button"
        @click="$emit('select', texte)"
      >
        {{ texte }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getSuggestions } from '../constants/messageSuggestions'

const props = defineProps<{
  role: 'aidant' | 'patient'
  visible: boolean
}>()

defineEmits<{ (e: 'select', texte: string): void }>()

const suggestions = computed(() => getSuggestions(props.role))
</script>

<style scoped>
.quick-replies {
  padding: 8px 12px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: tmFadeUp 0.3s ease both;
}

.quick-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #9E8E85;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.quick-chips {
  display: flex;
  gap: 7px;
  overflow-x: auto;
  padding-bottom: 2px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.quick-chips::-webkit-scrollbar {
  display: none;
}

.quick-chip {
  flex-shrink: 0;
  padding: 7px 13px;
  background: #F0FAF5;
  border: 1px solid #C6EADA;
  border-radius: 100px;
  color: #146B45;
  font-size: 0.82rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, transform 0.12s;
}

.quick-chip:hover {
  background: #D7F0E4;
}

.quick-chip:active {
  transform: scale(0.96);
}
</style>
