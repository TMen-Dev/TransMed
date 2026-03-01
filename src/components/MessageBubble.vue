<template>
  <div
    class="bubble-wrapper"
    :class="{ 'is-mine': isMine }"
  >
    <div
      v-if="!isMine"
      class="avatar"
    >
      {{ message.auteurPrenom[0] }}
    </div>
    <div class="bubble">
      <p class="contenu">
        {{ message.contenu }}
      </p>
      <div class="meta">
        <span
          v-if="!isMine"
          class="auteur"
        >{{ message.auteurPrenom }}</span>
        <span class="horodatage">{{ formatDate(message.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Message } from '../types/message.types'

const props = defineProps<{ message: Message }>()
const { currentUser } = useCurrentUser()
const isMine = computed(() => props.message.auteurId === currentUser.value?.id)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<style scoped>
.bubble-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin: 4px 16px;
  animation: tmMessageIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.bubble-wrapper.is-mine {
  justify-content: flex-end;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E8F7F0;
  color: #1B8C5A;
  font-size: 0.75rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1px solid #C6EADA;
}

.bubble {
  max-width: 72%;
  background: #FFFFFF;
  border: 1px solid #E8E1D9;
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px;
  box-shadow: 0 1px 4px rgba(26, 21, 16, 0.06);
}

.is-mine .bubble {
  background: #1B8C5A;
  border-color: transparent;
  color: white;
  border-radius: 16px 16px 4px 16px;
  box-shadow: 0 2px 8px rgba(27, 140, 90, 0.25);
}

.contenu {
  margin: 0 0 5px;
  font-size: 0.93rem;
  line-height: 1.45;
  color: inherit;
}

.meta {
  font-size: 0.68rem;
  opacity: 0.65;
  display: flex;
  gap: 5px;
  align-items: center;
}

.auteur {
  font-weight: 600;
}
</style>
