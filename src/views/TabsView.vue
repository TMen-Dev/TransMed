<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <!-- slot="bottom" requis pour web component Ionic (FR-106 ✓) -->
      <ion-tab-bar slot="bottom">
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

        <!-- T025 — onglet Messages avec badge non-lus -->
        <ion-tab-button
          tab="messages"
          href="/app/messages"
        >
          <div class="tab-icon-wrap tab-messages-wrap">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <ion-badge
              v-if="unreadCount > 0"
              class="unread-tab-badge"
              :color="badgeColor"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </ion-badge>
          </div>
          <ion-label>Messages</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="profil"
          href="/app/profil"
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
                cy="8"
                r="4"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <ion-label>Profil</ion-label>
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
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet, IonBadge,
} from '@ionic/vue'
import { useUnreadMessages } from '../composables/useUnreadMessages'

const { unreadCount, badgeColor } = useUnreadMessages()
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

.tab-messages-wrap {
  position: relative;
}

.unread-tab-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  font-size: 0.65rem;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  animation: tmPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
</style>
