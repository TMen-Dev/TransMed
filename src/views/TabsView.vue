<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet />
      <!-- slot="bottom" requis pour web component Ionic (FR-106 ✓) -->
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          tab="demandes"
          href="/app/demandes"
          :selected="currentTab === 'demandes'"
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
          :selected="currentTab === 'messages'"
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
            <span
              v-if="unreadCount > 0"
              class="unread-tab-badge"
              :class="{ urgent: hasUrgent }"
            >
              {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
          </div>
          <ion-label>Messages</ion-label>
        </ion-tab-button>

        <ion-tab-button
          tab="profil"
          href="/app/profil"
          :selected="currentTab === 'profil'"
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
          :selected="currentTab === 'apropos'"
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonTabs, IonTabBar, IonTabButton, IonLabel, IonRouterOutlet,
} from '@ionic/vue'
import { useUnreadMessages } from '../composables/useUnreadMessages'

const { unreadCount, hasUrgent } = useUnreadMessages()

const route = useRoute()
const currentTab = computed(() => {
  const p = route.path
  if (p.startsWith('/app/messages')) return 'messages'
  if (p.startsWith('/app/profil')) return 'profil'
  if (p.startsWith('/app/apropos')) return 'apropos'
  return 'demandes'
})
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
  /* Taille fixe pour les chiffres simples, pill pour 2+ chiffres */
  min-width: 15px;
  height: 15px;
  padding: 0 3px;
  box-sizing: border-box;
  border-radius: 8px;
  /* Centrage parfait du chiffre */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* Typographie serrée */
  font-size: 0.58rem;
  font-weight: 700;
  line-height: 1;
  /* Couleurs */
  background: #D68910;
  color: #ffffff;
  /* Séparation visuelle de l'icône */
  border: 1.5px solid #ffffff;
  animation: tmPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.unread-tab-badge.urgent {
  background: #C0392B;
}
</style>
