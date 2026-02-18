<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/app/demandes" />
        </ion-buttons>
        <ion-title>Détail demande</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="naviguerChat">
            <ion-icon :icon="chatbubbleOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div v-if="!demande && !demandeStore.loading" class="center-content">
        <p>Demande introuvable.</p>
      </div>

      <ion-spinner v-if="demandeStore.loading" />

      <template v-if="demande">
        <!-- Statut + Timeline -->
        <div class="statut-section">
          <StatutBadge :statut="demande.statut" />
          <StatutTimeline :statut="demande.statut" class="ion-margin-top" />
        </div>

        <!-- Médicaments -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Médicaments</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <MedicamentItem
              v-for="(med, i) in demande.medicaments"
              :key="i"
              :medicament="med"
            />
            <p class="adresse-text">
              <ion-icon :icon="locationOutline" />
              {{ demande.adresseLivraison }}
            </p>
          </ion-card-content>
        </ion-card>

        <!-- Cagnotte -->
        <CagnotteProgress v-if="cagnotte" :cagnotte="cagnotte" />

        <!-- Propositions reçues (FR-010) -->
        <ion-card v-if="demande.propositions.length">
          <ion-card-header>
            <ion-card-title>Aidants engagés</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item v-for="prop in demande.propositions" :key="prop.id">
                <ion-avatar slot="start">
                  <ion-icon :icon="personCircleOutline" size="large" />
                </ion-avatar>
                <ion-label>
                  <h3>{{ prop.aidantPrenom }}</h3>
                  <p>{{ LIBELLES_PROP[prop.type] }}</p>
                  <p v-if="prop.montantContribue">Contribution : {{ prop.montantContribue }} €</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

        <!-- Ordonnance (acheteur/Prop3 uniquement) -->
        <ion-card v-if="isAidant && peutVoirOrdonnance">
          <ion-card-header>
            <ion-card-title>Ordonnance</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" fill="outline" @click="voirOrdonnance">
              <ion-icon :icon="documentOutline" slot="start" />
              Voir l'ordonnance
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Action patient : confirmer (statut 6) (US3) -->
        <ion-card v-if="isPatient && demande.statut === 'pret_acceptation_patient'" color="primary">
          <ion-card-content>
            <p class="confirm-text">
              Tout est prêt ! <strong>{{ demande.transporteurPrenom }}</strong> va récupérer et livrer vos médicaments.
            </p>
            <ion-button expand="block" color="light" :disabled="confirmLoading" @click="confirmer">
              <ion-spinner v-if="confirmLoading" slot="start" name="crescent" />
              Confirmer la livraison
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Action aidant Prop3 : marquer livré (statut 7) (US4) -->
        <ion-card
          v-if="isAidant && demande.statut === 'en_cours_livraison' && estTransporteur"
        >
          <ion-card-content>
            <ion-button expand="block" color="success" :disabled="livraisonLoading" @click="marquerLivree">
              <ion-spinner v-if="livraisonLoading" slot="start" name="crescent" />
              <ion-icon :icon="checkmarkCircleOutline" slot="start" />
              Médicaments livrés
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Panel propositions (aidant uniquement) (US2) -->
        <PropositionPanel
          v-if="isAidant && peutProposer"
          :demande="demande"
          :cagnotte="cagnotte"
        />

        <!-- Modal ordonnance -->
        <ion-modal :is-open="ordonanceModalOpen" @didDismiss="ordonanceModalOpen = false">
          <ion-header>
            <ion-toolbar>
              <ion-title>Ordonnance</ion-title>
              <ion-buttons slot="end">
                <ion-button @click="ordonanceModalOpen = false">Fermer</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <img
              v-if="ordonanceData && ordonanceData.mimeType !== 'application/pdf'"
              :src="ordonanceData.base64Data"
              style="width: 100%; height: auto"
              alt="Ordonnance"
            />
            <iframe
              v-else-if="ordonanceData"
              :src="ordonanceData.base64Data"
              style="width: 100%; height: 100%; border: none"
              title="Ordonnance PDF"
            />
          </ion-content>
        </ion-modal>

        <ion-note v-if="actionError" color="danger" class="action-error">{{ actionError }}</ion-note>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonButtons, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonList, IonItem, IonLabel, IonAvatar, IonSpinner,
  IonModal, IonNote,
} from '@ionic/vue'
import {
  chatbubbleOutline, locationOutline, documentOutline,
  personCircleOutline, checkmarkCircleOutline,
} from 'ionicons/icons'
import StatutBadge from '../components/StatutBadge.vue'
import StatutTimeline from '../components/StatutTimeline.vue'
import MedicamentItem from '../components/MedicamentItem.vue'
import CagnotteProgress from '../components/CagnotteProgress.vue'
import PropositionPanel from '../components/PropositionPanel.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCagnotteStore } from '../stores/cagnotte.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { ordonanceService } from '../services/index'
import type { Ordonance } from '../types/ordonance.types'
import type { TypeProposition } from '../types/proposition.types'
import { canTransition } from '../services/demandeStateMachine'

const LIBELLES_PROP: Record<TypeProposition, string> = {
  prop1_cagnotte: 'Contribution cagnotte',
  prop2_transport: 'Transport',
  prop3_achat_transport: 'Achat + Transport',
}

const route = useRoute()
const router = useRouter()
const demandeStore = useDemandeStore()
const cagnotteStore = useCagnotteStore()
const { currentUser, isPatient, isAidant } = useCurrentUser()

const ordonanceModalOpen = ref(false)
const ordonanceData = ref<Ordonance | null>(null)
const confirmLoading = ref(false)
const livraisonLoading = ref(false)
const actionError = ref('')

const demande = computed(() => demandeStore.getById(route.params.id as string))
const cagnotte = computed(() =>
  demande.value ? (cagnotteStore.getForDemande(demande.value.id) ?? null) : null
)

const estTransporteur = computed(
  () => currentUser.value && demande.value?.transporteurId === currentUser.value.id
)

const peutProposer = computed(() => {
  if (!demande.value) return false
  return (
    canTransition(demande.value.statut, 'prop1_contribution') ||
    canTransition(demande.value.statut, 'prop2_transport') ||
    canTransition(demande.value.statut, 'prop3_achat_transport')
  )
})

const peutVoirOrdonnance = computed(() => {
  if (!demande.value || !currentUser.value) return false
  return demande.value.propositions.some(
    (p) =>
      p.aidantId === currentUser.value!.id &&
      (p.type === 'prop3_achat_transport' || p.type === 'prop1_cagnotte')
  )
})

onMounted(async () => {
  const id = route.params.id as string
  if (!demandeStore.getById(id)) {
    await demandeStore.fetchAll()
  }
  if (demande.value) {
    await cagnotteStore.fetchForDemande(demande.value.id)
  }
})

function naviguerChat() {
  router.push(`/app/demandes/${route.params.id}/chat`)
}

async function voirOrdonnance() {
  if (!demande.value) return
  try {
    ordonanceData.value = await ordonanceService.getByDemandeId(demande.value.id)
    ordonanceModalOpen.value = true
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Erreur'
  }
}

async function confirmer() {
  if (!demande.value) return
  confirmLoading.value = true
  actionError.value = ''
  try {
    await demandeStore.confirmerParPatient(demande.value.id)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    confirmLoading.value = false
  }
}

async function marquerLivree() {
  if (!demande.value) return
  livraisonLoading.value = true
  actionError.value = ''
  try {
    await demandeStore.marquerLivree(demande.value.id)
  } catch (e) {
    actionError.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    livraisonLoading.value = false
  }
}
</script>

<style scoped>
.statut-section {
  margin-bottom: 8px;
}
.adresse-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-medium);
  font-size: 0.9rem;
  margin-top: 8px;
}
.confirm-text {
  color: white;
  margin-bottom: 12px;
}
.center-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}
.action-error {
  display: block;
  margin-top: 8px;
}
</style>
