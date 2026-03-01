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
          :src="base64Data"
          class="ordonance-img"
          alt="Ordonnance"
        >
        <iframe
          v-else
          :src="base64Data"
          class="ordonance-pdf"
          title="Ordonnance PDF"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, modalController } from '@ionic/vue'

defineProps<{
  base64Data: string
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

.ordonance-pdf {
  width: 100%;
  height: 100%;
  border: none;
}
</style>
