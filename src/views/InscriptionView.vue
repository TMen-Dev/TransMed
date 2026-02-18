<template>
  <ion-page>
    <ion-content class="ion-padding" :fullscreen="true">
      <div class="inscription-container">
        <div class="logo-section">
          <h1 class="app-title">TransMed</h1>
          <p class="app-subtitle">Mise en relation patients et aidants</p>
        </div>

        <ion-card class="inscription-card">
          <ion-card-header>
            <ion-card-title>Bienvenue</ion-card-title>
            <ion-card-subtitle>Créez votre profil pour commencer</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-input
                  v-model="prenom"
                  label="Votre prénom"
                  label-placement="floating"
                  placeholder="Ex: Amina"
                  :maxlength="50"
                  clearInput
                />
              </ion-item>

              <ion-item class="role-item">
                <ion-label>Vous êtes :</ion-label>
              </ion-item>

              <ion-radio-group v-model="role">
                <ion-item>
                  <ion-radio value="patient" slot="start" />
                  <ion-label>
                    <h3>Patient</h3>
                    <p>Je cherche des médicaments</p>
                  </ion-label>
                </ion-item>
                <ion-item>
                  <ion-radio value="aidant" slot="start" />
                  <ion-label>
                    <h3>Aidant</h3>
                    <p>Je peux aider à acheter / transporter</p>
                  </ion-label>
                </ion-item>
              </ion-radio-group>
            </ion-list>

            <ion-note v-if="erreur" color="danger" class="erreur-note">
              {{ erreur }}
            </ion-note>

            <ion-button
              expand="block"
              class="ion-margin-top"
              :disabled="!prenom.trim() || !role"
              @click="valider"
            >
              Commencer
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonInput,
  IonLabel,
  IonRadioGroup,
  IonRadio,
  IonButton,
  IonNote,
} from '@ionic/vue'
import { useAuthStore } from '../stores/auth.store'
import { userService } from '../services/index'
import type { RoleUtilisateur } from '../types/user.types'

const router = useRouter()
const authStore = useAuthStore()

const prenom = ref('')
const role = ref<RoleUtilisateur | ''>('')
const erreur = ref('')

async function valider() {
  if (!prenom.value.trim()) {
    erreur.value = 'Veuillez saisir votre prénom.'
    return
  }
  if (!role.value) {
    erreur.value = 'Veuillez choisir votre rôle.'
    return
  }
  erreur.value = ''

  const utilisateur = await userService.create({
    prenom: prenom.value.trim(),
    role: role.value as RoleUtilisateur,
  })

  authStore.setUser(utilisateur)
  await router.replace('/app/demandes')
}
</script>

<style scoped>
.inscription-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px 0;
}

.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.app-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0;
}

.app-subtitle {
  color: var(--ion-color-medium);
  margin-top: 8px;
}

.inscription-card {
  width: 100%;
  max-width: 480px;
}

.role-item {
  margin-top: 16px;
}

.erreur-note {
  display: block;
  margin-top: 8px;
  font-size: 0.85rem;
}
</style>
