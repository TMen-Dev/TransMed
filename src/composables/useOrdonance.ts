// src/composables/useOrdonance.ts

import { ref } from 'vue'
import type { Ordonance, MimeTypeOrdonance } from '../types/ordonance.types'

export function useOrdonance() {
  const ordonance = ref<Ordonance | null>(null)
  const pickError = ref<string | null>(null)

  function _buildOrdonance(base64Data: string, mimeType: MimeTypeOrdonance): void {
    ordonance.value = {
      id: '', // sera défini lors de l'upload via ordonanceService
      demandeId: '',
      storagePath: '',       // sera défini après upload
      base64Data,            // prévisualisation locale avant upload
      mimeType,
      createdAt: new Date().toISOString(),
    }
    pickError.value = null
  }

  /**
   * Prend une photo ou sélectionne depuis la galerie.
   * Utilise @capacitor/camera en production (natif + web).
   * Fallback : input file pour les environnements sans Camera plugin.
   */
  async function pickFromCameraOrGallery(source: 'CAMERA' | 'PHOTOS'): Promise<void> {
    try {
      // Import dynamique pour éviter les erreurs si le plugin n'est pas disponible en dev
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.DataUrl,
        source: source === 'CAMERA' ? CameraSource.Camera : CameraSource.Photos,
        allowEditing: false,
      })
      if (!photo.dataUrl) throw new Error('Aucune donnée retournée par la caméra.')
      const mimeType: MimeTypeOrdonance =
        photo.format === 'png' ? 'image/png' : 'image/jpeg'
      _buildOrdonance(photo.dataUrl, mimeType)
    } catch (_e) {
      pickError.value = 'Impossible de sélectionner la photo. Essayez un fichier PDF.'
    }
  }

  /**
   * Sélectionne un fichier depuis le système (image ou PDF).
   * Utilise <input type="file"> natif — fonctionne partout.
   */
  function pickFromFiles(): Promise<void> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,application/pdf'
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (!file) {
          resolve()
          return
        }
        if (file.size > 10 * 1024 * 1024) {
          pickError.value = 'Fichier trop volumineux (max 10 Mo).'
          resolve()
          return
        }
        const reader = new FileReader()
        reader.onload = () => {
          _buildOrdonance(
            reader.result as string,
            file.type as MimeTypeOrdonance
          )
          resolve()
        }
        reader.onerror = () => {
          pickError.value = 'Impossible de lire le fichier.'
          resolve()
        }
        reader.readAsDataURL(file)
      }
      input.click()
    })
  }

  function reset(): void {
    ordonance.value = null
    pickError.value = null
  }

  return { ordonance, pickError, pickFromCameraOrGallery, pickFromFiles, reset }
}
