<template>
  <div class="ordonance-uploader">
    <!-- Input file caché — déclenché directement pour garantir le user gesture sur web -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/jpeg,image/png,application/pdf"
      style="display:none"
      @change="onFileInputChange"
    >

    <button
      class="upload-btn"
      :class="{ 'is-done': modelValue }"
      type="button"
      @click="onUploadClick"
    >
      <div class="upload-icon">
        <svg
          v-if="!modelValue"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div class="upload-text">
        <span class="upload-title">{{ modelValue ? 'Ordonnance jointe' : 'Joindre une ordonnance *' }}</span>
        <span class="upload-sub">{{ modelValue ? 'Toucher pour changer' : 'Photo ou PDF' }}</span>
      </div>
    </button>

    <div
      v-if="pickError"
      class="erreur-msg"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="2"
        />
        <path
          d="M12 8v4M12 16h.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      {{ pickError }}
    </div>

    <!-- Aperçu -->
    <div
      v-if="modelValue"
      class="apercu"
      :class="{ 'apercu-animate': modelValue }"
    >
      <img
        v-if="modelValue.mimeType !== 'application/pdf'"
        :src="modelValue.base64Data"
        class="apercu-image"
        alt="Aperçu ordonnance"
      >
      <div
        v-else
        class="apercu-pdf"
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M14 2v6h6M16 13H8M16 17H8M10 9H8"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        <p>Ordonnance PDF jointe</p>
      </div>
    </div>

    <!-- Action sheet natif uniquement -->
    <ion-action-sheet
      v-if="isNative"
      :is-open="actionSheetOpen"
      header="Joindre une ordonnance"
      :buttons="actionSheetButtons"
      @did-dismiss="actionSheetOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonActionSheet } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import { cameraOutline, imagesOutline, documentOutline } from 'ionicons/icons'
import type { Ordonance, MimeTypeOrdonance } from '../types/ordonance.types'

defineProps<{ modelValue: Ordonance | null }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: Ordonance | null): void }>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const pickError = ref<string | null>(null)
const actionSheetOpen = ref(false)
const isNative = Capacitor.isNativePlatform()

function onUploadClick() {
  pickError.value = null
  if (isNative) {
    // Sur natif : proposer caméra/galerie/fichier via action sheet
    actionSheetOpen.value = true
  } else {
    // Sur web : déclencher directement le sélecteur de fichier (user gesture garanti)
    fileInputRef.value?.click()
  }
}

function onFileInputChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  // Reset input value pour permettre de re-sélectionner le même fichier
  ;(event.target as HTMLInputElement).value = ''

  if (file.size > 10 * 1024 * 1024) {
    pickError.value = 'Fichier trop volumineux (max 10 Mo).'
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    emit('update:modelValue', {
      id: '',
      demandeId: '',
      storagePath: '',
      base64Data: reader.result as string,
      mimeType: file.type as MimeTypeOrdonance,
      createdAt: new Date().toISOString(),
    })
    pickError.value = null
  }
  reader.onerror = () => { pickError.value = 'Impossible de lire le fichier.' }
  reader.readAsDataURL(file)
}

async function pickFromCameraOrGallery(source: 'CAMERA' | 'PHOTOS') {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const photo = await Camera.getPhoto({
      quality: 80,
      resultType: CameraResultType.DataUrl,
      source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
      allowEditing: false,
    })
    if (!photo.dataUrl) throw new Error('Aucune donnée retournée par la caméra.')
    const mimeType: MimeTypeOrdonance = photo.format === 'png' ? 'image/png' : 'image/jpeg'
    emit('update:modelValue', {
      id: '',
      demandeId: '',
      storagePath: '',
      base64Data: photo.dataUrl,
      mimeType,
      createdAt: new Date().toISOString(),
    })
    pickError.value = null
  } catch {
    pickError.value = 'Impossible de sélectionner la photo.'
  }
}

function pickFromFilesNative() {
  fileInputRef.value?.click()
}

const actionSheetButtons = [
  { text: 'Prendre une photo',       icon: cameraOutline,   handler: () => pickFromCameraOrGallery('CAMERA') },
  { text: 'Choisir dans la galerie', icon: imagesOutline,   handler: () => pickFromCameraOrGallery('PHOTOS') },
  { text: 'Choisir un fichier PDF',  icon: documentOutline, handler: () => pickFromFilesNative() },
  { text: 'Annuler', role: 'cancel' },
]
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
