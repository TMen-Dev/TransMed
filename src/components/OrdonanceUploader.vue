<template>
  <div class="ordonance-uploader">
    <button
      class="upload-btn"
      :class="{ 'is-done': modelValue }"
      type="button"
      @click="ouvrirActionSheet"
    >
      <div class="upload-icon">
        <svg v-if="!modelValue" width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="upload-text">
        <span class="upload-title">{{ modelValue ? 'Ordonnance jointe' : 'Joindre une ordonnance *' }}</span>
        <span class="upload-sub">{{ modelValue ? 'Toucher pour changer' : 'Photo, galerie ou PDF' }}</span>
      </div>
    </button>

    <div v-if="pickError" class="erreur-msg">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      {{ pickError }}
    </div>

    <!-- Aperçu -->
    <div v-if="modelValue" class="apercu" :class="{ 'apercu-animate': modelValue }">
      <img
        v-if="modelValue.mimeType !== 'application/pdf'"
        :src="modelValue.base64Data"
        class="apercu-image"
        alt="Aperçu ordonnance"
      />
      <div v-else class="apercu-pdf">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
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
import { IonActionSheet } from '@ionic/vue'
import { cameraOutline, imagesOutline, documentOutline } from 'ionicons/icons'
import { useOrdonance } from '../composables/useOrdonance'
import type { Ordonance } from '../types/ordonance.types'

defineProps<{ modelValue: Ordonance | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Ordonance | null): void }>()

const { ordonance, pickError, pickFromCameraOrGallery, pickFromFiles } = useOrdonance()
const actionSheetOpen = ref(false)

watch(ordonance, (val) => { if (val) emit('update:modelValue', val) })

const actionSheetButtons = [
  { text: 'Prendre une photo',       icon: cameraOutline,   handler: () => pickFromCameraOrGallery('CAMERA') },
  { text: 'Choisir dans la galerie', icon: imagesOutline,   handler: () => pickFromCameraOrGallery('PHOTOS') },
  { text: 'Choisir un fichier PDF',  icon: documentOutline, handler: () => pickFromFiles() },
  { text: 'Annuler', role: 'cancel' },
]

function ouvrirActionSheet() { actionSheetOpen.value = true }
</script>

<style scoped>
.ordonance-uploader {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: 2px dashed #C6EADA;
  border-radius: 12px;
  background: #F2FAF6;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: border-color 0.2s, background 0.2s;
}

.upload-btn:hover {
  border-color: #1B8C5A;
  background: #E8F7F0;
}

.upload-btn.is-done {
  border-style: solid;
  border-color: #1B8C5A;
  background: #E8F7F0;
}

.upload-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #1B8C5A;
  background: #FFFFFF;
  border: 1px solid #C6EADA;
  transition: background 0.2s;
}

.upload-btn.is-done .upload-icon {
  background: #1B8C5A;
  color: white;
  border-color: transparent;
  animation: tmPop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.upload-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.upload-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1A1510;
}

.upload-sub {
  font-size: 0.78rem;
  color: #7A6E65;
}

.erreur-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #C0392B;
  font-size: 0.82rem;
  background: #FDEDEC;
  border-radius: 8px;
  padding: 8px 12px;
}

/* ── Aperçu ── */
.apercu {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #C6EADA;
  animation: tmFadeIn 0.3s ease both;
}

.apercu-image {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  background: #F2FAF6;
}

.apercu-pdf {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: #F2FAF6;
  gap: 8px;
  color: #1B8C5A;
  font-size: 0.85rem;
  font-weight: 500;
}
</style>
