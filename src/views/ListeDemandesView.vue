<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ isPatient ? 'Mes demandes' : 'Propositions actives' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ion-refresh="rafraichir($event)"
      >
        <ion-refresher-content />
      </ion-refresher>

      <!-- Chargement -->
      <div
        v-if="demandeStore.loading"
        class="loading-state"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="skeleton-card"
        />
      </div>

      <!-- État vide -->
      <div
        v-else-if="listeDemandes.length === 0"
        class="empty-state"
      >
        <div class="empty-illustration">
          <svg
            width="72"
            height="72"
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="38"
              fill="#E8F7F0"
              stroke="#C6EADA"
              stroke-width="2"
            />
            <path
              d="M28 26h24a2 2 0 012 2v24a2 2 0 01-2 2H28a2 2 0 01-2-2V28a2 2 0 012-2z"
              fill="white"
              stroke="#1B8C5A"
              stroke-width="2"
            />
            <path
              d="M32 36h16M32 41h10M32 46h6"
              stroke="#1B8C5A"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="52"
              cy="28"
              r="8"
              fill="#FEF9EC"
              stroke="#C9820A"
              stroke-width="2"
            />
            <path
              d="M52 25v3l2 1"
              stroke="#C9820A"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <p class="empty-title">
          {{ isPatient ? 'Aucune demande' : 'Aucune demande active' }}
        </p>
        <p class="empty-sub">
          {{ isPatient
            ? 'Créez votre première demande pour trouver des aidants.'
            : 'Les demandes de patients apparaîtront ici.' }}
        </p>
        <button
          v-if="isPatient"
          class="empty-cta"
          type="button"
          @click="ouvrirCreation"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
          Créer ma première demande
        </button>
      </div>

      <!-- Liste -->
      <div
        v-else
        class="demandes-list"
      >
        <DemandeCard
          v-for="(demande, idx) in listeDemandes"
          :key="demande.id"
          :demande="demande"
          :style="{ animationDelay: `${idx * 60}ms` }"
          @click="naviguerVersDetail(demande.id)"
        />
      </div>

      <!-- FAB Patient -->
      <ion-fab
        v-if="isPatient"
        slot="fixed"
        vertical="bottom"
        horizontal="end"
      >
        <ion-fab-button @click="ouvrirCreation">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  modalController,
} from '@ionic/vue'
import DemandeCard from '../components/DemandeCard.vue'
import CreationDemandeView from './CreationDemandeView.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCurrentUser } from '../composables/useCurrentUser'

const router = useRouter()
const demandeStore = useDemandeStore()
const { isPatient, currentUser } = useCurrentUser()

const listeDemandes = computed(() => {
  if (isPatient.value) {
    return [...demandeStore.demandes].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return demandeStore.demandesActivesAidant
})

onMounted(async () => {
  if (isPatient.value && currentUser.value) {
    await demandeStore.fetchForPatient(currentUser.value.id)
  } else {
    await demandeStore.fetchAll()
  }
})

async function rafraichir(event: CustomEvent) {
  if (isPatient.value && currentUser.value) {
    await demandeStore.fetchForPatient(currentUser.value.id)
  } else {
    await demandeStore.fetchAll()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (event.target as any).complete()
}

async function ouvrirCreation() {
  const modal = await modalController.create({ component: CreationDemandeView })
  await modal.present()
}
function naviguerVersDetail(id: string) { router.push(`/app/demandes/${id}`) }
</script>

<style scoped>
/* ── Loading skeletons ── */
.loading-state {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-card {
  height: 82px;
  background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%);
  background-size: 200% 100%;
  border-radius: 14px;
  animation: skeletonWave 1.6s ease-in-out infinite;
}

.skeleton-card:nth-child(2) { animation-delay: 0.2s; }
.skeleton-card:nth-child(3) { animation-delay: 0.4s; }

@keyframes skeletonWave {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── État vide ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 62vh;
  padding: 32px 24px;
  text-align: center;
  gap: 10px;
  animation: tmFadeUp 0.4s ease both;
}

.empty-illustration {
  animation: tmFloat 3.5s ease-in-out infinite;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1A1510;
  margin: 0;
}

.empty-sub {
  font-size: 0.88rem;
  color: #7A6E65;
  margin: 0;
  max-width: 260px;
  line-height: 1.5;
}

.empty-cta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 22px;
  background: #1B8C5A;
  color: white;
  border: none;
  border-radius: 100px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27, 140, 90, 0.35);
  transition: background 0.18s, transform 0.14s;
}
.empty-cta:hover { background: #146B45; }
.empty-cta:active { transform: scale(0.97); }

/* ── Liste ── */
.demandes-list {
  padding: 8px 0 100px;
}
</style>
