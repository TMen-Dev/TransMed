<template>
  <ion-page class="charte-modal-page">
    <ion-header>
      <ion-toolbar>
        <ion-title>Charte TransMed</ion-title>
        <ion-buttons slot="end">
          <button class="close-btn" type="button" @click="$emit('fermer')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="charte-content">
      <div class="charte-body">
        <div class="charte-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#1B8C5A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <h2 class="charte-titre">Engagements de l'aidant</h2>
        <p class="charte-intro">
          En vous proposant ou en posant une question, vous acceptez de respecter ces engagements :
        </p>

        <div class="charte-items">
          <div class="charte-item">
            <div class="item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="11" width="18" height="11" rx="2" stroke="#1B8C5A" stroke-width="1.8" />
                <path d="M7 11V7a5 5 0 0110 0v4" stroke="#1B8C5A" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <div class="item-content">
              <strong>Confidentialité médicale</strong>
              <p>Les informations médicales partagées restent strictement confidentielles et ne seront jamais divulguées à des tiers.</p>
            </div>
          </div>

          <div class="charte-item">
            <div class="item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#1B8C5A" stroke-width="1.8" />
                <path d="M12 6v6l4 2" stroke="#1B8C5A" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <div class="item-content">
              <strong>Respect des délais</strong>
              <p>Je m'engage à respecter les délais convenus et à prévenir rapidement le patient en cas de retard.</p>
            </div>
          </div>

          <div class="charte-item">
            <div class="item-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke="#1B8C5A" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <div class="item-content">
              <strong>Signalement d'imprévu</strong>
              <p>En cas d'empêchement, je contacte immédiatement le patient via le chat pour lui permettre de trouver une autre solution.</p>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="charte-footer">
      <button class="btn-annuler" type="button" @click="$emit('fermer')">
        Annuler
      </button>
      <button class="btn-accepter" type="button" @click="$emit('accepter')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        J'accepte et je continue
      </button>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonButtons } from '@ionic/vue'

defineEmits<{
  (e: 'accepter'): void
  (e: 'fermer'): void
}>()
</script>

<style scoped>
.charte-modal-page {
  --background: #F7F3ED;
}

.charte-content {
  --background: #F7F3ED;
}

.close-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #7A6E65;
  display: flex;
  align-items: center;
  border-radius: 8px;
}

.charte-body {
  padding: 24px 20px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.charte-icon {
  width: 72px;
  height: 72px;
  background: #E8F7F0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: tmPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.charte-titre {
  font-size: 1.2rem;
  font-weight: 800;
  color: #1A1510;
  margin: 0;
  text-align: center;
}

.charte-intro {
  font-size: 0.88rem;
  color: #7A6E65;
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.charte-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.charte-item {
  display: flex;
  gap: 14px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 14px;
  border: 1px solid #E8E1D9;
  animation: tmFadeUp 0.35s ease both;
}

.item-icon {
  width: 36px;
  height: 36px;
  background: #E8F7F0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-content strong {
  font-size: 0.9rem;
  color: #1A1510;
}

.item-content p {
  font-size: 0.82rem;
  color: #7A6E65;
  margin: 0;
  line-height: 1.4;
}

.charte-footer {
  display: flex;
  gap: 10px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  background: #FFFFFF;
  border-top: 1px solid #E8E1D9;
}

.btn-annuler {
  flex: 0 0 auto;
  height: 50px;
  padding: 0 20px;
  background: transparent;
  border: 1.5px solid #E8E1D9;
  border-radius: 12px;
  color: #7A6E65;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s;
}

.btn-annuler:hover {
  background: #F0EDE8;
}

.btn-accepter {
  flex: 1;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1B8C5A;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27, 140, 90, 0.35);
  transition: background 0.18s, transform 0.14s;
}

.btn-accepter:hover {
  background: #146B45;
}

.btn-accepter:active {
  transform: scale(0.97);
}
</style>
