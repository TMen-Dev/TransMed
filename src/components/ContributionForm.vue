<template>
  <div class="contribution-form">
    <ion-item>
      <ion-input
        v-model.number="montant"
        type="number"
        label="Votre contribution (€)"
        label-placement="floating"
        :min="1"
        placeholder="Ex: 30"
      />
    </ion-item>
    <ion-note v-if="erreur" color="danger" class="erreur-note">{{ erreur }}</ion-note>
    <ion-button expand="block" class="ion-margin-top" @click="soumettre">
      Contribuer à la cagnotte
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { IonItem, IonInput, IonButton, IonNote } from '@ionic/vue'

const emit = defineEmits<{
  (e: 'submit', montant: number): void
}>()

const montant = ref<number | undefined>(undefined)
const erreur = ref('')

function soumettre() {
  if (montant.value === undefined || montant.value <= 0) {
    erreur.value = 'Veuillez saisir un montant supérieur à 0.'
    return
  }
  erreur.value = ''
  emit('submit', montant.value)
  montant.value = undefined
}
</script>

<style scoped>
.erreur-note {
  display: block;
  margin-top: 4px;
  font-size: 0.85rem;
}
</style>
