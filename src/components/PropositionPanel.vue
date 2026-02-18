<template>
  <ion-card class="proposition-panel">
    <ion-card-header>
      <ion-card-title>Proposer mon aide</ion-card-title>
    </ion-card-header>
    <ion-card-content>
      <!-- Définir montant cible (acheteur, cagnotte en_attente_evaluation) -->
      <div v-if="cagnotte && cagnotte.statut === 'en_attente_evaluation'" class="definir-montant">
        <p class="info-text">
          En tant qu'acheteur, définissez d'abord le montant nécessaire pour l'achat des médicaments.
        </p>
        <ion-item>
          <ion-input
            v-model.number="montantCible"
            type="number"
            label="Montant cible (€)"
            label-placement="floating"
            placeholder="Ex: 120"
            :min="1"
          />
        </ion-item>
        <ion-button expand="block" class="ion-margin-top" @click="handleDefinirMontant">
          Définir le montant cible
        </ion-button>
        <ion-item-divider class="ion-margin-top">
          <ion-label>Ou proposer directement :</ion-label>
        </ion-item-divider>
      </div>

      <!-- Prop1 : Contribuer à la cagnotte -->
      <div v-if="canProp1 && cagnotte && cagnotte.statut !== 'en_attente_evaluation'" class="prop-section">
        <ion-button expand="block" fill="outline" @click="showContribForm = !showContribForm">
          <ion-icon :icon="cashOutline" slot="start" />
          Contribuer à la cagnotte (Prop1)
        </ion-button>
        <ContributionForm v-if="showContribForm" @submit="handleProp1" />
      </div>

      <!-- Prop2 : Transport -->
      <div v-if="canProp2" class="prop-section">
        <ion-button expand="block" fill="outline" color="secondary" @click="handleProp2">
          <ion-icon :icon="carOutline" slot="start" />
          Proposer le transport (Prop2)
        </ion-button>
      </div>

      <!-- Prop3 : Achat + Transport -->
      <div v-if="canProp3" class="prop-section">
        <ion-button expand="block" color="tertiary" @click="handleProp3">
          <ion-icon :icon="bagHandleOutline" slot="start" />
          Acheter et transporter (Prop3)
        </ion-button>
      </div>

      <ion-note v-if="erreur" color="danger" class="erreur-note">{{ erreur }}</ion-note>
      <ion-note v-if="succes" color="success" class="erreur-note">{{ succes }}</ion-note>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonButton, IonIcon, IonItem, IonInput, IonLabel, IonItemDivider, IonNote,
} from '@ionic/vue'
import { cashOutline, carOutline, bagHandleOutline } from 'ionicons/icons'
import ContributionForm from './ContributionForm.vue'
import { usePropositionsStore } from '../stores/propositions.store'
import { useCagnotteStore } from '../stores/cagnotte.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { canTransition } from '../services/demandeStateMachine'
import type { Demande } from '../types/demande.types'
import type { Cagnotte } from '../types/cagnotte.types'

const props = defineProps<{
  demande: Demande
  cagnotte: Cagnotte | null
}>()

const { currentUser } = useCurrentUser()
const propositionsStore = usePropositionsStore()
const cagnotteStore = useCagnotteStore()

const showContribForm = ref(false)
const montantCible = ref<number | undefined>(undefined)
const erreur = ref('')
const succes = ref('')

const canProp1 = computed(() => canTransition(props.demande.statut, 'prop1_contribution'))
const canProp2 = computed(() => canTransition(props.demande.statut, 'prop2_transport'))
const canProp3 = computed(() => canTransition(props.demande.statut, 'prop3_achat_transport'))

async function handleDefinirMontant() {
  if (montantCible.value === undefined || montantCible.value <= 0) {
    erreur.value = 'Veuillez saisir un montant supérieur à 0.'
    return
  }
  if (!props.cagnotte) return
  erreur.value = ''
  try {
    await cagnotteStore.definirMontantCible(
      { cagnotteId: props.cagnotte.id, montantCible: montantCible.value },
      props.demande.id
    )
    succes.value = 'Montant cible défini. Les contributions Prop1 sont maintenant ouvertes.'
    montantCible.value = undefined
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur'
  }
}

async function handleProp1(montant: number) {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop1_cagnotte',
      montantContribue: montant,
    })
    succes.value = `Contribution de ${montant} € enregistrée.`
    showContribForm.value = false
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur'
  }
}

async function handleProp2() {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop2_transport',
    })
    succes.value = 'Proposition de transport enregistrée.'
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur'
  }
}

async function handleProp3() {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop3_achat_transport',
    })
    succes.value = 'Proposition achat + transport enregistrée.'
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur'
  }
}
</script>

<style scoped>
.proposition-panel {
  margin: 8px 0;
}
.prop-section {
  margin-bottom: 12px;
}
.info-text {
  font-size: 0.9rem;
  color: var(--ion-color-medium);
  margin-bottom: 12px;
}
.definir-montant {
  margin-bottom: 16px;
}
.erreur-note {
  display: block;
  margin-top: 8px;
  font-size: 0.85rem;
}
</style>
