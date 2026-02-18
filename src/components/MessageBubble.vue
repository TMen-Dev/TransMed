<template>
  <div class="bubble-wrapper" :class="{ 'is-mine': isMine }">
    <div class="bubble">
      <p class="contenu">{{ message.contenu }}</p>
      <div class="meta">
        <span class="auteur">{{ message.auteurPrenom }}</span>
        <span class="separator">·</span>
        <span class="horodatage">{{ formatDate(message.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Message } from '../types/message.types'

const props = defineProps<{
  message: Message
}>()

const { currentUser } = useCurrentUser()
const isMine = computed(() => props.message.auteurId === currentUser.value?.id)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  })
}
</script>

<style scoped>
.bubble-wrapper {
  display: flex;
  justify-content: flex-start;
  margin: 6px 16px;
}
.bubble-wrapper.is-mine {
  justify-content: flex-end;
}
.bubble {
  max-width: 75%;
  background: var(--ion-color-light);
  border-radius: 16px 16px 16px 4px;
  padding: 10px 14px;
}
.is-mine .bubble {
  background: var(--ion-color-primary);
  color: white;
  border-radius: 16px 16px 4px 16px;
}
.contenu {
  margin: 0 0 4px;
  font-size: 0.95rem;
  line-height: 1.4;
}
.meta {
  font-size: 0.7rem;
  opacity: 0.7;
  display: flex;
  gap: 4px;
}
.is-mine .meta {
  opacity: 0.8;
}
</style>
