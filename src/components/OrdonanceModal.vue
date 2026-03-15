<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Ordonnance</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="modalController.dismiss()">
            Fermer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="ordonance-container">
        <img
          v-if="mimeType !== 'application/pdf'"
          :src="signedUrl || base64Data"
          class="ordonance-img"
          alt="Ordonnance"
        >
        <!-- PDF : <object> fonctionne sur Android et iOS WKWebView -->
        <div
          v-else
          class="ordonance-pdf-wrapper"
        >
          <object
            :data="signedUrl || base64Data"
            type="application/pdf"
            class="ordonance-pdf"
          >
            <!-- Fallback iOS : lien direct si <object> non supporté -->
            <div class="pdf-fallback">
              <p>Votre appareil ne peut pas afficher ce PDF directement.</p>
              <a
                :href="signedUrl || base64Data"
                target="_blank"
                rel="noopener"
                class="pdf-open-link"
              >Ouvrir le PDF</a>
            </div>
          </object>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, modalController } from '@ionic/vue'

defineProps<{
  signedUrl?: string   // Supabase Storage signed URL (préféré)
  base64Data?: string  // Compatibilité transitoire : prévisualisation locale
  mimeType: string
}>()
</script>

<style scoped>
.ordonance-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  height: 100%;
}

.ordonance-img {
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(26, 21, 16, 0.12);
}

.ordonance-pdf-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ordonance-pdf {
  width: 100%;
  height: 100%;
  border: none;
  flex: 1;
}

.pdf-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
  color: var(--ion-color-medium);
}

.pdf-open-link {
  display: inline-block;
  padding: 10px 24px;
  background: var(--ion-color-primary);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}
</style>
