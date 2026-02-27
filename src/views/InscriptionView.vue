<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="inscription-container">

        <div class="logo-section">
          <div class="logo-mark">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="14" fill="#1B8C5A"/>
              <path d="M22 10v24M10 22h24" stroke="white" stroke-width="4" stroke-linecap="round"/>
            </svg>
          </div>
          <h1 class="app-title">TransMed</h1>
          <p class="app-subtitle">Mise en relation patients et aidants</p>
        </div>

        <div class="inscription-card">
          <div class="card-header">
            <h2 class="card-title">Bienvenue</h2>
            <p class="card-subtitle">Créez votre profil pour commencer</p>
          </div>

          <div class="card-body">
            <!-- Champ prénom -->
            <div class="field-group">
              <label class="field-label" for="prenom-input">Votre prénom</label>
              <div class="input-wrapper" :class="{ 'input-focused': inputFocused }">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                </svg>
                <input
                  id="prenom-input"
                  v-model="prenom"
                  type="text"
                  class="text-input"
                  placeholder="Ex: Amina"
                  :maxlength="50"
                  autocomplete="given-name"
                  @focus="inputFocused = true"
                  @blur="inputFocused = false"
                />
                <button
                  v-if="prenom"
                  class="clear-btn"
                  type="button"
                  @click="prenom = ''"
                  aria-label="Effacer"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Sélection du rôle — FIX : cartes natives, pas d'ion-radio -->
            <div class="field-group">
              <label class="field-label">Vous êtes :</label>
              <div class="role-cards" role="radiogroup" aria-label="Choisissez votre rôle">

                <button
                  class="role-card"
                  :class="{ selected: role === 'patient' }"
                  type="button"
                  aria-role="radio"
                  :aria-checked="role === 'patient'"
                  @click="selectRole('patient')"
                >
                  <div class="role-icon-wrap patient-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                      <path d="M17 13v4M15 15h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="role-text">
                    <span class="role-name">Patient</span>
                    <span class="role-desc">Je cherche des médicaments</span>
                  </div>
                  <div class="radio-dot" aria-hidden="true">
                    <div class="radio-inner" />
                  </div>
                </button>

                <button
                  class="role-card"
                  :class="{ selected: role === 'aidant' }"
                  type="button"
                  aria-role="radio"
                  :aria-checked="role === 'aidant'"
                  @click="selectRole('aidant')"
                >
                  <div class="role-icon-wrap aidant-icon">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div class="role-text">
                    <span class="role-name">Aidant</span>
                    <span class="role-desc">Je peux aider à acheter / transporter</span>
                  </div>
                  <div class="radio-dot" aria-hidden="true">
                    <div class="radio-inner" />
                  </div>
                </button>

              </div>
            </div>

            <!-- Erreur -->
            <div v-if="erreur" class="erreur-msg" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              {{ erreur }}
            </div>

            <!-- Bouton -->
            <button
              class="submit-btn"
              :class="{ 'submit-disabled': !formValide }"
              :disabled="!formValide"
              type="button"
              @click="valider"
            >
              <span>Commencer</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonContent } from '@ionic/vue'
import { useAuthStore } from '../stores/auth.store'
import { userService } from '../services/index'
import type { RoleUtilisateur } from '../types/user.types'

const router = useRouter()
const authStore = useAuthStore()

const prenom = ref('')
const role = ref<RoleUtilisateur | ''>('')
const erreur = ref('')
const inputFocused = ref(false)

// Méthode explicite pour éviter l'ambiguïté de l'assignation inline dans le template
function selectRole(r: RoleUtilisateur) {
  role.value = r
}

// Computed explicite pour éviter l'évaluation inline dans le template
const formValide = computed(() => prenom.value.trim().length > 0 && role.value !== '')

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
/* ── Tokens — palette médicale solidaire africaine ── */
.inscription-container {
  --tm-primary:       #1B8C5A;   /* vert médical chaleureux */
  --tm-primary-light: #E8F7F0;   /* vert très pâle */
  --tm-primary-dark:  #146B45;   /* vert foncé pour hover */
  --tm-patient:       #2B7CC1;   /* bleu accessible */
  --tm-patient-bg:    #EAF3FB;
  --tm-aidant:        #C8521A;   /* terracotta solidarité */
  --tm-aidant-bg:     #FDF0E8;
  --tm-text:          #1A1510;   /* brun-noir chaud */
  --tm-muted:         #7A6E65;   /* gris chaud */
  --tm-border:        #E8E1D9;   /* bordure sable */
  --tm-surface:       #FFFFFF;
  --tm-danger:        #C0392B;
  --tm-radius:        16px;
  --tm-shadow:        0 4px 24px rgba(0,0,0,0.10);
}

/* ── Layout ──────────────────────────────────────────── */
ion-content {
  --background: #F7F3ED;         /* fond sable chaud */
}

.inscription-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 32px 20px;
  gap: 28px;
}

/* ── Logo ────────────────────────────────────────────── */
.logo-section {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: fadeDown 0.5s ease both;
}

.logo-mark {
  margin-bottom: 4px;
  filter: drop-shadow(0 4px 12px rgba(27, 140, 90, 0.30));
}

.app-title {
  font-size: 2.2rem;
  font-weight: 800;
  color: var(--tm-text);
  letter-spacing: -0.5px;
  margin: 0;
}

.app-subtitle {
  font-size: 0.92rem;
  color: var(--tm-muted);
  margin: 0;
}

/* ── Card ────────────────────────────────────────────── */
.inscription-card {
  width: 100%;
  max-width: 460px;
  background: var(--tm-surface);
  border-radius: var(--tm-radius);
  box-shadow: var(--tm-shadow);
  overflow: hidden;
  animation: fadeUp 0.5s ease 0.1s both;
}

.card-header {
  padding: 28px 28px 0;
  border-bottom: 1px solid var(--tm-border);
  padding-bottom: 20px;
}

.card-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--tm-text);
  margin: 0 0 4px;
}

.card-subtitle {
  font-size: 0.88rem;
  color: var(--tm-muted);
  margin: 0;
}

.card-body {
  padding: 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Champ texte ─────────────────────────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--tm-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid var(--tm-border);
  border-radius: 10px;
  padding: 0 14px;
  height: 50px;
  background: #FAFBFD;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.input-wrapper.input-focused {
  border-color: var(--tm-primary);
  background: var(--tm-surface);
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.14);
}

.input-icon {
  color: var(--tm-muted);
  flex-shrink: 0;
}

.text-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  color: var(--tm-text);
  font-family: inherit;
}

.text-input::placeholder {
  color: #C4C9D4;
}

.clear-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--tm-muted);
  display: flex;
  align-items: center;
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
}

.clear-btn:hover {
  color: var(--tm-text);
  background: var(--tm-border);
}

/* ── Role cards ──────────────────────────────────────── */
.role-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.role-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border: 1.5px solid var(--tm-border);
  border-radius: 12px;
  background: #FAFBFD;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  width: 100%;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;
  position: relative;
}

.role-card:hover {
  border-color: #A8D4BF;
  background: #F0FAF5;
  transform: translateY(-1px);
}

.role-card:active {
  transform: translateY(0);
}

.role-card.selected {
  border-color: var(--tm-primary);
  background: var(--tm-primary-light);
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.12);
}

/* icon wrappers */
.role-icon-wrap {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}

.patient-icon {
  background: var(--tm-patient-bg);
  color: var(--tm-patient);
}

.role-card.selected .patient-icon {
  background: #BAE6FD;
  color: #0369A1;
}

.aidant-icon {
  background: var(--tm-aidant-bg);
  color: var(--tm-aidant);
}

.role-card.selected .aidant-icon {
  background: #FDDAB6;
  color: #C2410C;
}

/* text */
.role-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-name {
  font-size: 0.97rem;
  font-weight: 600;
  color: var(--tm-text);
  line-height: 1.2;
}

.role-desc {
  font-size: 0.8rem;
  color: var(--tm-muted);
  line-height: 1.3;
}

/* radio indicator */
.radio-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--tm-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s;
}

.role-card.selected .radio-dot {
  border-color: var(--tm-primary);
}

.radio-inner {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--tm-primary);
  transform: scale(0);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.role-card.selected .radio-inner {
  transform: scale(1);
}

/* ── Erreur ──────────────────────────────────────────── */
.erreur-msg {
  display: flex;
  align-items: center;
  gap: 7px;
  color: var(--tm-danger);
  font-size: 0.85rem;
  background: #FEF2F2;
  border: 1px solid #FECACA;
  border-radius: 8px;
  padding: 10px 14px;
}

/* ── Submit — couleurs hardcodées ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  background: #1B8C5A;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 18px rgba(27, 140, 90, 0.35);
}

.submit-btn:hover:not(:disabled) {
  background: #146B45;
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(27, 140, 90, 0.45);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

/* État désactivé : vert clair avec texte visible — contraste suffisant */
.submit-btn.submit-disabled,
.submit-btn:disabled {
  background: #8FC9AF;
  color: #ffffff;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
  opacity: 1;
}

/* ── Animations ──────────────────────────────────────── */
@keyframes fadeDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
