<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>À propos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <div class="hero">
        <h1>TransMed</h1>
        <p>Mise en relation de patients et d'aidants pour l'accès aux médicaments</p>
      </div>

      <ion-card v-for="etape in ETAPES" :key="etape.numero" class="etape-card">
        <ion-card-content>
          <div class="etape-header">
            <div class="etape-numero">{{ etape.numero }}</div>
            <ion-icon :icon="etape.icon" size="large" :color="etape.color" />
          </div>
          <h3>{{ etape.titre }}</h3>
          <p>{{ etape.description }}</p>
        </ion-card-content>
      </ion-card>

      <ion-card class="context-card">
        <ion-card-header>
          <ion-card-title>Contexte</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>
            TransMed aide des patients situés à l'étranger (ex. Algérie) à accéder à des médicaments
            disponibles uniquement en France, grâce à des aidants bénévoles basés sur place.
          </p>
          <p class="ion-margin-top">
            <strong>Les données présentées sont fictives.</strong> Cette application est un MVP avec
            des données simulées, conçu pour être connecté à une base de données réelle ultérieurement.
          </p>
        </ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon,
} from '@ionic/vue'
import {
  createOutline, peopleOutline, walletOutline,
  checkmarkDoneOutline, bicycleOutline, ribbonOutline,
} from 'ionicons/icons'

const ETAPES = [
  {
    numero: 1,
    titre: 'Le patient crée une demande',
    description: 'Le patient liste les médicaments dont il a besoin, fournit son ordonnance (obligatoire) et son adresse de livraison.',
    icon: createOutline,
    color: 'primary',
  },
  {
    numero: 2,
    titre: 'Les aidants se mobilisent',
    description: 'Des aidants bénévoles peuvent contribuer à la cagnotte (Prop1), proposer le transport (Prop2) ou s\'engager à acheter ET livrer (Prop3).',
    icon: peopleOutline,
    color: 'secondary',
  },
  {
    numero: 3,
    titre: 'La cagnotte est financée',
    description: 'Un acheteur définit le montant nécessaire. Plusieurs aidants peuvent contribuer jusqu\'à atteindre l\'objectif.',
    icon: walletOutline,
    color: 'success',
  },
  {
    numero: 4,
    titre: 'Le patient confirme',
    description: 'Quand les fonds sont atteints et qu\'un transporteur est disponible, le patient valide le lancement de la livraison.',
    icon: checkmarkDoneOutline,
    color: 'tertiary',
  },
  {
    numero: 5,
    titre: 'Livraison en cours',
    description: 'L\'aidant transporteur récupère les médicaments et les achemine jusqu\'au patient.',
    icon: bicycleOutline,
    color: 'warning',
  },
  {
    numero: 6,
    titre: 'Demande traitée',
    description: 'L\'aidant confirme la livraison. La demande est clôturée et le patient a ses médicaments.',
    icon: ribbonOutline,
    color: 'success',
  },
]
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 24px 0 16px;
}
.hero h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--ion-color-primary);
  margin: 0;
}
.hero p {
  color: var(--ion-color-medium);
  margin-top: 8px;
}
.etape-card {
  margin: 8px 0;
}
.etape-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
}
.etape-numero {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--ion-color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
}
.context-card {
  margin-top: 16px;
  margin-bottom: 32px;
}
</style>
