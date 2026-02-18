<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouvelle demande</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('close')">Annuler</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Médicaments -->
      <ion-list-header>
        <ion-label>Médicaments *</ion-label>
      </ion-list-header>

      <ion-list>
        <ion-item
          v-for="(med, index) in medicaments"
          :key="index"
        >
          <ion-input
            v-model="med.nom"
            :label="`Médicament ${index + 1}`"
            label-placement="stacked"
            placeholder="Nom du médicament"
          />
          <ion-input
            v-model.number="med.quantite"
            type="number"
            label="Qté"
            label-placement="stacked"
            :min="1"
            style="max-width: 70px"
          />
          <ion-button slot="end" fill="clear" color="danger" @click="retirerMed(index)">
            <ion-icon :icon="trashOutline" />
          </ion-button>
        </ion-item>
      </ion-list>

      <ion-button expand="block" fill="outline" @click="ajouterMed">
        <ion-icon :icon="addOutline" slot="start" />
        Ajouter un médicament
      </ion-button>

      <!-- Adresse -->
      <ion-item class="ion-margin-top">
        <ion-input
          v-model="adresse"
          label="Adresse de livraison *"
          label-placement="stacked"
          placeholder="Ex: 5 rue des Lilas, Alger"
        />
      </ion-item>

      <!-- Ordonnance -->
      <ion-list-header class="ion-margin-top">
        <ion-label>Ordonnance *</ion-label>
      </ion-list-header>
      <OrdonanceUploader v-model="ordonance" />

      <!-- Erreurs -->
      <ion-note v-if="erreur" color="danger" class="erreur-note">{{ erreur }}</ion-note>

      <!-- Soumettre -->
      <ion-button
        expand="block"
        class="ion-margin-top"
        :disabled="loading"
        @click="soumettre"
      >
        <ion-spinner v-if="loading" slot="start" name="crescent" />
        {{ loading ? 'Envoi...' : 'Publier la demande' }}
      </ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonListHeader, IonItem, IonLabel, IonInput,
  IonButton, IonButtons, IonIcon, IonNote, IonSpinner,
} from '@ionic/vue'
import { addOutline, trashOutline } from 'ionicons/icons'
import OrdonanceUploader from '../components/OrdonanceUploader.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Medicament } from '../types/medicament.types'
import type { Ordonance } from '../types/ordonance.types'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const demandeStore = useDemandeStore()
const { currentUser } = useCurrentUser()

const medicaments = ref<Medicament[]>([{ nom: '', quantite: 1 }])
const adresse = ref(currentUser.value?.adresseDefaut ?? '')
const ordonance = ref<Ordonance | null>(null)
const erreur = ref('')
const loading = ref(false)

function ajouterMed() {
  medicaments.value.push({ nom: '', quantite: 1 })
}

function retirerMed(index: number) {
  if (medicaments.value.length > 1) {
    medicaments.value.splice(index, 1)
  }
}

async function soumettre() {
  // Validation FR-001 / FR-016
  const medsValides = medicaments.value.filter((m) => m.nom.trim() && m.quantite > 0)
  if (!medsValides.length) {
    erreur.value = 'Veuillez saisir au moins un médicament avec son nom et sa quantité.'
    return
  }
  if (!adresse.value.trim()) {
    erreur.value = "L'adresse de livraison est obligatoire."
    return
  }
  if (!ordonance.value) {
    erreur.value = "L'ordonnance est obligatoire (FR-016). Veuillez joindre votre ordonnance."
    return
  }
  if (!currentUser.value) return

  erreur.value = ''
  loading.value = true
  try {
    await demandeStore.createDemande({
      patientId: currentUser.value.id,
      patientPrenom: currentUser.value.prenom,
      medicaments: medsValides,
      adresseLivraison: adresse.value.trim(),
      ordonanceBase64: ordonance.value.base64Data,
      ordonanceMimeType: ordonance.value.mimeType,
    })
    emit('created')
    emit('close')
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur lors de la création.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.erreur-note {
  display: block;
  margin-top: 8px;
  font-size: 0.85rem;
}
</style>
