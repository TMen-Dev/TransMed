<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ isPatient ? 'Mes demandes' : 'Demandes actives' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">
            <ion-icon :icon="logOutOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="rafraichir($event)">
        <ion-refresher-content />
      </ion-refresher>

      <!-- État chargement -->
      <div v-if="demandeStore.loading" class="center-content">
        <ion-spinner name="crescent" />
      </div>

      <!-- État vide -->
      <div
        v-else-if="listeDemandes.length === 0"
        class="center-content empty-state"
      >
        <ion-icon :icon="documentOutline" size="large" color="medium" />
        <p v-if="isPatient">Vous n'avez pas encore de demande.</p>
        <p v-else>Aucune demande active pour le moment.</p>
        <ion-button v-if="isPatient" @click="ouvrirCreation">
          <ion-icon :icon="addOutline" slot="start" />
          Créer ma première demande
        </ion-button>
      </div>

      <!-- Liste demandes -->
      <ion-list v-else lines="none">
        <DemandeCard
          v-for="demande in listeDemandes"
          :key="demande.id"
          :demande="demande"
          @click="naviguerVersDetail(demande.id)"
        />
      </ion-list>

      <!-- FAB Patient -->
      <ion-fab v-if="isPatient" slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button @click="ouvrirCreation">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>

      <!-- Modal création -->
      <ion-modal :is-open="modalOuverte" @didDismiss="modalOuverte = false">
        <CreationDemandeView
          @close="modalOuverte = false"
          @created="onDemandeCreee"
        />
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonButtons, IonButton, IonIcon, IonFab, IonFabButton,
  IonModal, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/vue'
import { addOutline, documentOutline, logOutOutline } from 'ionicons/icons'
import DemandeCard from '../components/DemandeCard.vue'
import CreationDemandeView from './CreationDemandeView.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useAuthStore } from '../stores/auth.store'
import { useCurrentUser } from '../composables/useCurrentUser'

const router = useRouter()
const demandeStore = useDemandeStore()
const authStore = useAuthStore()
const { isPatient, currentUser } = useCurrentUser()

const modalOuverte = ref(false)

const listeDemandes = computed(() => {
  if (isPatient.value) {
    return [...demandeStore.demandes].sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    )
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
  ;(event.target as any).complete()
}

function ouvrirCreation() {
  modalOuverte.value = true
}

function onDemandeCreee() {
  modalOuverte.value = false
}

function naviguerVersDetail(id: string) {
  router.push(`/app/demandes/${id}`)
}

function logout() {
  authStore.logout()
  router.replace('/inscription')
}
</script>

<style scoped>
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  gap: 16px;
}
.empty-state {
  color: var(--ion-color-medium);
}
</style>
