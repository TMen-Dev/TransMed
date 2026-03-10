<template>
  <div class="confiance-badges" :class="{ compact }">
    <span v-if="badges.emailVerifie" class="badge badge-email" :class="{ compact }">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ compact ? 'Email' : 'Email vérifié' }}
    </span>

    <span v-if="badges.telephoneRenseigne" class="badge badge-tel" :class="{ compact }">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      {{ compact ? 'Tél.' : 'Téléphone renseigné' }}
    </span>

    <span v-if="badges.nbLivraisonsReussies > 0" class="badge badge-livraisons" :class="{ compact }">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8" />
        <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8" />
      </svg>
      {{ badges.nbLivraisonsReussies }} livraison{{ badges.nbLivraisonsReussies > 1 ? 's' : '' }}
    </span>

    <span v-if="!badges.emailVerifie && !badges.telephoneRenseigne && badges.nbLivraisonsReussies === 0" class="no-badges">
      Aucun badge pour l'instant
    </span>
  </div>
</template>

<script setup lang="ts">
import { useConfiance } from '../composables/useConfiance'

const props = withDefaults(
  defineProps<{ userId: string; compact?: boolean }>(),
  { compact: false }
)

const { badges } = useConfiance(props.userId)
</script>

<style scoped>
.confiance-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  animation: tmFadeUp 0.25s ease both;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 600;
}

.badge.compact {
  padding: 3px 8px;
  font-size: 0.72rem;
}

.badge-email {
  background: #E8F7F0;
  color: #146B45;
  border: 1px solid #B2DFC8;
}

.badge-tel {
  background: #EAF3FB;
  color: #1A5C96;
  border: 1px solid #A8CFEE;
}

.badge-livraisons {
  background: #FDF0E8;
  color: #A94517;
  border: 1px solid #E8C4A8;
}

.no-badges {
  font-size: 0.8rem;
  color: #9E8E85;
  font-style: italic;
}
</style>
