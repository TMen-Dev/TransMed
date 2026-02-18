<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="demandes" href="/app/demandes">
          <ion-icon :icon="listOutline" />
          <ion-label>Demandes</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="apropos" href="/app/apropos">
          <ion-icon :icon="informationCircleOutline" />
          <ion-label>À propos</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
} from '@ionic/vue'
import { listOutline, informationCircleOutline } from 'ionicons/icons'
</script>
