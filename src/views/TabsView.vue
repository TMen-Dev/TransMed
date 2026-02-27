<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <template #bottom>
        <ion-tab-bar>
          <ion-tab-button
            tab="demandes"
            href="/app/demandes"
          >
            <div class="tab-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
                <path
                  d="M9 12h6M9 16h4"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <ion-label>Demandes</ion-label>
          </ion-tab-button>

          <ion-tab-button
            tab="apropos"
            href="/app/apropos"
          >
            <div class="tab-icon-wrap">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M12 16v-4M12 8h.01"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <ion-label>À propos</ion-label>
          </ion-tab-button>
        </ion-tab-bar>
      </template>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet,
} from '@ionic/vue'
</script>

<style scoped>
ion-tab-button {
  transition: color 0.2s;
}

.tab-icon-wrap {
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

ion-tab-button.tab-selected .tab-icon-wrap {
  transform: scale(1.15);
}
</style>
