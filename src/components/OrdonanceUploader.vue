<template>
  <div class="ordonance-uploader">
    <ion-button
      expand="block"
      :fill="modelValue ? 'solid' : 'outline'"
      :color="modelValue ? 'success' : 'primary'"
      @click="ouvrirActionSheet"
    >
      <ion-icon :icon="modelValue ? checkmarkCircleOutline : attachOutline" slot="start" />
      {{ modelValue ? 'Ordonnance jointe ✓' : 'Joindre une ordonnance *' }}
    </ion-button>

    <ion-note v-if="pickError" color="danger" class="erreur-note">{{ pickError }}</ion-note>

    <!-- Aperçu ordonnance -->
    <div v-if="modelValue" class="apercu">
      <img
        v-if="modelValue.mimeType !== 'application/pdf'"
        :src="modelValue.base64Data"
        class="apercu-image"
        alt="Aperçu ordonnance"
      />
      <div v-else class="apercu-pdf">
        <ion-icon :icon="documentOutline" size="large" color="medium" />
        <p>Ordonnance PDF jointe</p>
      </div>
    </div>

    <ion-action-sheet
      :is-open="actionSheetOpen"
      header="Joindre une ordonnance"
      :buttons="actionSheetButtons"
      @didDismiss="actionSheetOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import {
  IonButton,
  IonIcon,
  IonNote,
  IonActionSheet,
} from '@ionic/vue'
import {
  attachOutline,
  checkmarkCircleOutline,
  cameraOutline,
  imagesOutline,
  documentOutline,
} from 'ionicons/icons'
import { useOrdonance } from '../composables/useOrdonance'
import type { Ordonance } from '../types/ordonance.types'

defineProps<{
  modelValue: Ordonance | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: Ordonance | null): void
}>()

const { ordonance, pickError, pickFromCameraOrGallery, pickFromFiles } = useOrdonance()
const actionSheetOpen = ref(false)

// Propager la sélection au parent
watch(ordonance, (val) => {
  if (val) emit('update:modelValue', val)
})

const actionSheetButtons = [
  {
    text: 'Prendre une photo',
    icon: cameraOutline,
    handler: () => pickFromCameraOrGallery('CAMERA'),
  },
  {
    text: 'Choisir dans la galerie',
    icon: imagesOutline,
    handler: () => pickFromCameraOrGallery('PHOTOS'),
  },
  {
    text: 'Choisir un fichier (PDF)',
    icon: documentOutline,
    handler: () => pickFromFiles(),
  },
  {
    text: 'Annuler',
    role: 'cancel',
  },
]

function ouvrirActionSheet() {
  actionSheetOpen.value = true
}
</script>

<style scoped>
.ordonance-uploader {
  margin: 12px 0;
}
.erreur-note {
  display: block;
  margin-top: 6px;
  font-size: 0.85rem;
}
.apercu {
  margin-top: 12px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--ion-color-light-shade);
}
.apercu-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  background: var(--ion-color-light);
}
.apercu-pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: var(--ion-color-light);
  gap: 8px;
  color: var(--ion-color-medium);
}
</style>
