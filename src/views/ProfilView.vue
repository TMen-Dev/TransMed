<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Mon profil</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="profil-wrap">
        <!-- Avatar initiale -->
        <div class="avatar-bloc">
          <div class="avatar-ring">
            <div class="avatar-inner">
              <span class="avatar-initiale">{{ initiale }}</span>
            </div>
          </div>
          <h1 class="nom">
            {{ user?.prenom }}
          </h1>
          <span
            class="role-badge"
            :class="user?.role"
          >
            {{ user?.role === 'patient' ? 'Patient' : 'Aidant' }}
          </span>
        </div>

        <!-- Infos -->
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon green">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M2 8l10 7 10-7"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">Adresse e-mail</span>
              <span class="info-value">{{ user?.email ?? '—' }}</span>
            </div>
          </div>

          <div class="divider" />

          <div class="info-row">
            <div class="info-icon terra">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">Rôle</span>
              <span class="info-value">{{ user?.role === 'patient' ? 'Patient (bénéficiaire)' : 'Aidant (solidaire)' }}</span>
            </div>
          </div>

          <div class="divider" />

          <div class="info-row">
            <div class="info-icon blue">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="2"
                  stroke="currentColor"
                  stroke-width="1.8"
                />
                <path
                  d="M16 2v4M8 2v4M3 10h18"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">Membre depuis</span>
              <span class="info-value">{{ membreDepuis }}</span>
            </div>
          </div>
        </div>

        <!-- Badges de confiance -->
        <div v-if="user" class="confiance-section">
          <h3 class="section-label">Badges de confiance</h3>
          <ConfianceBadges :user-id="user.id" :compact="false" />
        </div>

        <!-- Téléphone -->
        <div v-if="user" class="tel-section">
          <h3 class="section-label">Téléphone</h3>
          <div class="tel-input-row">
            <input
              v-model="telephone"
              type="tel"
              class="tel-input"
              placeholder="+33 6 00 00 00 00"
              :maxlength="20"
            >
            <button
              class="tel-save-btn"
              :disabled="telLoading"
              type="button"
              @click="sauvegarderTelephone"
            >
              {{ telLoading ? '…' : 'Enregistrer' }}
            </button>
          </div>
          <p v-if="telSucces" class="tel-succes">✅ Téléphone enregistré</p>
          <p v-if="telErreur" class="tel-erreur">{{ telErreur }}</p>
        </div>

        <!-- Bouton déconnexion -->
        <button
          class="logout-btn"
          @click="handleLogout"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          Se déconnecter
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
import { useAuthStore } from '../stores/auth.store'
import ConfianceBadges from '../components/ConfianceBadges.vue'
import { userService } from '../services/index'

const authStore = useAuthStore()
const router = useRouter()

const user = computed(() => authStore.currentUser)
const initiale = computed(() => user.value?.prenom?.[0]?.toUpperCase() ?? '?')

const membreDepuis = computed(() => {
  if (!user.value?.createdAt) return '—'
  return new Date(user.value.createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
})

const telephone = ref(user.value?.telephone ?? '')
const telLoading = ref(false)
const telSucces = ref(false)
const telErreur = ref('')

async function sauvegarderTelephone() {
  const userId = user.value?.id
  if (!userId) return
  telLoading.value = true; telSucces.value = false; telErreur.value = ''
  try {
    await userService.mettreAJourTelephone(userId, telephone.value)
    telSucces.value = true
    // Mettre à jour le store local
    if (authStore.currentUser) {
      authStore.setUser({ ...authStore.currentUser, telephone: telephone.value.trim() || null })
    }
    setTimeout(() => { telSucces.value = false }, 3000)
  } catch (e) {
    telErreur.value = e instanceof Error ? e.message : 'Erreur'
  } finally {
    telLoading.value = false
  }
}

async function handleLogout() {
  try {
    await authStore.logout()
  } finally {
    router.replace('/inscription')
  }
}
</script>

<style scoped>
.profil-wrap {
  padding: 24px 16px 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-height: 100%;
}

/* ── Avatar ── */
.avatar-bloc {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding-top: 16px;
}

.avatar-ring {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1B8C5A 0%, #2B7CC1 100%);
  padding: 3px;
  animation: tmPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.avatar-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-initiale {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1B8C5A;
  line-height: 1;
}

.nom {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1A1510;
  margin: 0;
  letter-spacing: -0.02em;
}

.role-badge {
  display: inline-block;
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.role-badge.patient {
  background: #E8F7F0;
  color: #1B8C5A;
}

.role-badge.aidant {
  background: #FDF0E8;
  color: #C8521A;
}

/* ── Info card ── */
.info-card {
  width: 100%;
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.07);
  overflow: hidden;
  animation: tmFadeUp 0.35s 0.1s both;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
}

.info-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-icon.green  { background: #E8F7F0; color: #1B8C5A; }
.info-icon.terra  { background: #FDF0E8; color: #C8521A; }
.info-icon.blue   { background: #EAF3FB; color: #2B7CC1; }

.info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.info-label {
  font-size: 0.72rem;
  font-weight: 600;
  color: #7A6E65;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1A1510;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.divider {
  height: 1px;
  background: #E8E1D9;
  margin: 0 16px;
}

/* ── Confiance & Téléphone ── */
.confiance-section,
.tel-section {
  width: 100%;
  animation: tmFadeUp 0.35s 0.15s both;
}

.section-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: #7A6E65;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 0 10px;
}

.tel-input-row {
  display: flex;
  gap: 8px;
}

.tel-input {
  flex: 1;
  height: 46px;
  padding: 0 14px;
  border: 1.5px solid #E8E1D9;
  border-radius: 10px;
  background: #F7F3ED;
  font-size: 0.93rem;
  font-family: inherit;
  color: #1A1510;
  outline: none;
  transition: border-color 0.2s;
}

.tel-input:focus {
  border-color: #2B7CC1;
  background: #FFFFFF;
}

.tel-save-btn {
  height: 46px;
  padding: 0 16px;
  background: #2B7CC1;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s;
}

.tel-save-btn:hover:not(:disabled) { background: #1A5C96; }
.tel-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.tel-succes { font-size: 0.82rem; color: #146B45; margin: 6px 0 0; }
.tel-erreur { font-size: 0.82rem; color: #C0392B; margin: 6px 0 0; }

/* ── Bouton logout ── */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 15px 20px;
  background: #FDF0E8;
  border: 1.5px solid #C8521A;
  border-radius: 12px;
  color: #C8521A;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  animation: tmFadeUp 0.35s 0.2s both;
}

.logout-btn:active {
  transform: scale(0.97);
  background: #F9E5D6;
}
</style>
