<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>À propos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="apropos-content">
        <!-- ── Hero ── -->
        <div class="hero">
          <div class="hero-logo">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
            >
              <rect
                width="48"
                height="48"
                rx="15"
                fill="#1B8C5A"
              />
              <path
                d="M24 11v26M11 24h26"
                stroke="white"
                stroke-width="4.5"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h1 class="hero-title">
            TransMed
          </h1>
          <p class="hero-sub">
            Mise en relation de patients et d'aidants pour l'accès aux médicaments
          </p>
          <div class="hero-badges">
            <span class="hero-badge">🌍 Algérie ↔ France</span>
            <span class="hero-badge">❤️ Solidaire</span>
            <span class="hero-badge">🏥 Médical</span>
          </div>
        </div>

        <!-- ── Étapes ── -->
        <div class="section-title-row">
          <span class="section-label">Comment ça marche ?</span>
        </div>

        <div
          v-for="(etape, idx) in ETAPES"
          :key="etape.numero"
          class="etape-card"
          :style="{ animationDelay: `${idx * 70}ms` }"
        >
          <div class="etape-left">
            <div
              class="etape-num"
              :class="`color-${etape.colorKey}`"
            >
              {{ etape.numero }}
            </div>
            <div
              v-if="idx < ETAPES.length - 1"
              class="etape-line"
            />
          </div>
          <div class="etape-body">
            <div
              class="etape-icon-wrap"
              :class="`color-${etape.colorKey}`"
            >
              <component
                :is="'span'"
                class="etape-emoji"
              >
                {{ etape.emoji }}
              </component>
            </div>
            <div class="etape-text">
              <h3 class="etape-titre">
                {{ etape.titre }}
              </h3>
              <p class="etape-desc">
                {{ etape.description }}
              </p>
            </div>
          </div>
        </div>

        <!-- ── Contexte ── -->
        <div class="context-card">
          <div class="context-header">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#2B7CC1"
                stroke-width="2"
              />
              <path
                d="M12 16v-4M12 8h.01"
                stroke="#2B7CC1"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            <span>Contexte</span>
          </div>
          <p>
            TransMed aide des patients situés à l'étranger (ex. Algérie) à accéder à des médicaments
            disponibles uniquement en France, grâce à des aidants bénévoles basés sur place.
          </p>
          <p class="context-mvp">
            <strong>Les données présentées sont fictives.</strong> Cette application est un MVP avec
            données simulées, conçu pour être connecté à une base de données réelle ultérieurement.
          </p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'

const ETAPES = [
  { numero: 1, titre: 'Le patient crée une demande',    emoji: '📋', colorKey: 'green',  description: 'Le patient liste ses médicaments, joint son ordonnance obligatoire et son adresse de livraison.' },
  { numero: 2, titre: 'Les aidants se mobilisent',      emoji: '🤝', colorKey: 'terra',  description: 'Des aidants bénévoles contribuent à la cagnotte (Prop1), proposent le transport (Prop2) ou s\'engagent à acheter et livrer (Prop3).' },
  { numero: 3, titre: 'La cagnotte est financée',       emoji: '💰', colorKey: 'gold',   description: 'Un acheteur définit le montant nécessaire. Plusieurs aidants peuvent contribuer jusqu\'à atteindre l\'objectif.' },
  { numero: 4, titre: 'Le patient confirme',            emoji: '✅', colorKey: 'green',  description: 'Quand fonds et transporteur sont disponibles, le patient valide le lancement de la livraison.' },
  { numero: 5, titre: 'Livraison en cours',             emoji: '🚗', colorKey: 'blue',   description: 'L\'aidant transporteur récupère les médicaments et les achemine jusqu\'au patient.' },
  { numero: 6, titre: 'Demande traitée',                emoji: '🎉', colorKey: 'green',  description: 'L\'aidant confirme la livraison. La demande est clôturée et le patient a ses médicaments.' },
]
</script>

<style scoped>
.apropos-content {
  padding: 0 16px 80px;
}

/* ── Hero ── */
.hero {
  text-align: center;
  padding: 28px 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: tmFadeUp 0.4s ease both;
}

.hero-logo {
  filter: drop-shadow(0 6px 14px rgba(27, 140, 90, 0.3));
  animation: tmFloat 4s ease-in-out infinite;
}

.hero-title {
  font-size: 2rem;
  font-weight: 800;
  color: #1A1510;
  letter-spacing: -0.5px;
  margin: 0;
}

.hero-sub {
  font-size: 0.88rem;
  color: #7A6E65;
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 4px;
}

.hero-badge {
  background: #FFFFFF;
  border: 1px solid #E8E1D9;
  border-radius: 100px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 500;
  color: #4A3F38;
  box-shadow: 0 1px 4px rgba(26, 21, 16, 0.06);
}

/* ── Section label ── */
.section-title-row {
  margin: 8px 0 14px;
  animation: tmFadeIn 0.4s ease 0.2s both;
}

.section-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #9E8E85;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Étapes ── */
.etape-card {
  display: flex;
  gap: 0;
  margin-bottom: 4px;
  animation: tmFadeUp 0.35s ease both;
}

.etape-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 40px;
  flex-shrink: 0;
}

.etape-num {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.78rem;
  font-weight: 800;
  flex-shrink: 0;
}

.etape-line {
  width: 2px;
  flex: 1;
  background: #E8E1D9;
  margin: 4px 0;
  min-height: 24px;
}

.etape-body {
  display: flex;
  gap: 12px;
  padding: 0 0 20px 10px;
  flex: 1;
}

.etape-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1.2rem;
  margin-top: -4px;
}

.etape-emoji { line-height: 1; }

.etape-text { flex: 1; }

.etape-titre {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1A1510;
  margin: 0 0 4px;
}

.etape-desc {
  font-size: 0.82rem;
  color: #7A6E65;
  margin: 0;
  line-height: 1.45;
}

/* ── Couleurs ── */
.color-green { background: #E8F7F0; color: #1B8C5A; }
.color-terra { background: #FDF0E8; color: #C8521A; }
.color-gold  { background: #FEF9EC; color: #C9820A; }
.color-blue  { background: #EAF3FB; color: #2B7CC1; }

/* ── Contexte ── */
.context-card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.07);
  padding: 16px;
  margin-top: 8px;
  animation: tmFadeUp 0.4s ease 0.4s both;
}

.context-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.92rem;
  font-weight: 700;
  color: #2B7CC1;
  margin-bottom: 10px;
}

.context-card p {
  font-size: 0.86rem;
  color: #4A3F38;
  margin: 0;
  line-height: 1.5;
}

.context-mvp {
  margin-top: 10px !important;
  color: #7A6E65 !important;
  font-size: 0.8rem !important;
  padding-top: 10px;
  border-top: 1px solid #F0EDE8;
}
</style>
