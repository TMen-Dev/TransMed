<template>
  <span
    class="last-seen-badge"
    :class="[size, { online: isOnline }]"
    :style="{ color }"
  >
    <span
      v-if="isOnline"
      class="online-dot"
    />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { useLastSeen } from '../composables/useLastSeen'

const props = withDefaults(
  defineProps<{ userId: string; size?: 'sm' | 'md' }>(),
  { size: 'sm' }
)

const { label, isOnline, color } = useLastSeen(props.userId)
</script>

<style scoped>
.last-seen-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 500;
}

.last-seen-badge.sm {
  font-size: 0.75rem;
}

.last-seen-badge.md {
  font-size: 0.85rem;
}

.online-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #1B8C5A;
  display: inline-block;
  flex-shrink: 0;
  animation: tmPulseRing 2s ease-in-out infinite;
}
</style>
