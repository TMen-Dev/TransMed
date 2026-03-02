<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Nouvelle demande</ion-title>
        <ion-buttons slot="end">
          <button
            class="annuler-btn"
            type="button"
            @click="modalController.dismiss()"
          >
            Annuler
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="form-content">
        <!-- ── Médicaments ── -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon green">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="4"
                  y="2"
                  width="16"
                  height="20"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <path
                  d="M8 10h8M8 14h5"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <h3 class="section-title">
              Médicaments <span class="required">*</span>
            </h3>
          </div>

          <div class="meds-list">
            <div
              v-for="(med, index) in medicaments"
              :key="index"
              class="med-row"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <div class="med-inputs">
                <div class="field-wrap flex-grow">
                  <input
                    v-model="med.nom"
                    type="text"
                    class="field-input"
                    :placeholder="`Médicament ${index + 1}`"
                  >
                </div>
                <div class="field-wrap qty-wrap">
                  <input
                    v-model.number="med.quantite"
                    type="number"
                    class="field-input qty-input"
                    min="1"
                    placeholder="Qté"
                  >
                </div>
              </div>
              <button
                v-if="medicaments.length > 1"
                class="remove-btn"
                type="button"
                @click="retirerMed(index)"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          <button
            class="add-med-btn"
            type="button"
            @click="ajouterMed"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
              />
            </svg>
            Ajouter un médicament
          </button>
        </div>

        <!-- ── Adresse ── -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon terra">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 class="section-title">
              Adresse de livraison <span class="required">*</span>
            </h3>
          </div>
          <div class="field-wrap">
            <input
              v-model="adresse"
              type="text"
              class="field-input"
              placeholder="Ex: 5 rue des Lilas, Alger, Algérie"
            >
          </div>
        </div>

        <!-- ── Nom & Urgence ── -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon green">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle
                  cx="7"
                  cy="7"
                  r="1.5"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h3 class="section-title">
              Nom de la demande
            </h3>
          </div>
          <div class="field-wrap">
            <input
              v-model="nom"
              type="text"
              class="field-input"
              placeholder="Ex: Alice — Alger"
              @input="nomModifie = true"
            >
          </div>
          <div class="urgente-row">
            <button
              class="urgente-toggle"
              :class="{ active: urgente }"
              type="button"
              @click="urgente = !urgente"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
            <span class="urgente-label">Demande urgente</span>
            <span
              v-if="urgente"
              class="urgente-chip"
            >URGENT</span>
          </div>
        </div>

        <!-- ── Ordonnance ── -->
        <div class="form-section">
          <div class="section-header">
            <div class="section-icon blue">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linejoin="round"
                />
                <path
                  d="M14 2v6h6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </div>
            <h3 class="section-title">
              Ordonnance <span class="required">*</span>
            </h3>
          </div>
          <OrdonanceUploader v-model="ordonance" />
          <p
            v-if="!ordonance"
            class="ordonance-hint"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              style="flex-shrink:0"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            L'ordonnance est obligatoire pour publier la demande
          </p>
        </div>

        <!-- ── Erreur ── -->
        <div
          v-if="erreur"
          class="erreur-msg"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          {{ erreur }}
        </div>

        <!-- ── Submit ── -->
        <button
          class="submit-btn"
          :class="{ loading }"
          :disabled="loading || !ordonance"
          type="button"
          @click="soumettre"
        >
          <svg
            v-if="!loading"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <span>{{ loading ? 'Publication…' : 'Publier la demande' }}</span>
        </button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, modalController } from '@ionic/vue'
import OrdonanceUploader from '../components/OrdonanceUploader.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import type { Medicament } from '../types/medicament.types'
import type { Ordonance } from '../types/ordonance.types'

const demandeStore = useDemandeStore()
const { currentUser } = useCurrentUser()

const medicaments = ref<Medicament[]>([{ nom: '', quantite: 1 }])
const adresse = ref(currentUser.value?.adresseDefaut ?? '')
const nom = ref('')
const nomModifie = ref(false)
const urgente = ref(false)
const ordonance = ref<Ordonance | null>(null)
const erreur = ref('')
const loading = ref(false)

watch(adresse, (addr) => {
  if (!nomModifie.value) {
    const ville = addr.split(',')[1]?.trim() ?? ''
    nom.value = `${currentUser.value?.prenom ?? ''} — ${ville || 'Médicaments'}`
  }
}, { immediate: true })

function ajouterMed() { medicaments.value.push({ nom: '', quantite: 1 }) }

function retirerMed(index: number) {
  if (medicaments.value.length > 1) medicaments.value.splice(index, 1)
}

async function soumettre() {
  const medsValides = medicaments.value.filter((m) => m.nom.trim() && m.quantite > 0)
  if (!medsValides.length) { erreur.value = 'Veuillez saisir au moins un médicament avec nom et quantité.'; return }
  if (!adresse.value.trim()) { erreur.value = "L'adresse de livraison est obligatoire."; return }
  if (!ordonance.value) { erreur.value = "L'ordonnance est obligatoire (FR-016). Veuillez la joindre."; return }
  if (!currentUser.value) return

  erreur.value = ''
  loading.value = true
  try {
    await demandeStore.createDemande({
      patientId: currentUser.value.id,
      patientPrenom: currentUser.value.prenom,
      nom: nom.value.trim() || `${currentUser.value.prenom} — Médicaments`,
      urgente: urgente.value,
      medicaments: medsValides,
      adresseLivraison: adresse.value.trim(),
      ordonanceBase64: ordonance.value.base64Data ?? ordonance.value.signedUrl,
      ordonanceMimeType: ordonance.value.mimeType,
    })
    await modalController.dismiss(null, 'created')
  } catch (e) {
    erreur.value = e instanceof Error ? e.message : 'Erreur lors de la création.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* ── Annuler ── */
.annuler-btn {
  background: none;
  border: none;
  color: #C0392B;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: 8px;
  transition: background 0.15s;
}
.annuler-btn:hover { background: #FDEDEC; }

/* ── Form content ── */
.form-content {
  padding: 16px 16px 100px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ── Sections ── */
.form-section {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 10px rgba(26, 21, 16, 0.06);
  padding: 14px;
  margin-bottom: 10px;
  animation: tmFadeUp 0.3s ease both;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-icon {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.section-icon.green { background: #E8F7F0; color: #1B8C5A; }
.section-icon.terra { background: #FDF0E8; color: #C8521A; }
.section-icon.blue  { background: #EAF3FB; color: #2B7CC1; }

.section-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1A1510;
  margin: 0;
}

.required { color: #C0392B; }

/* ── Médicaments ── */
.meds-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }

.med-row {
  display: flex;
  align-items: center;
  gap: 8px;
  animation: tmSlideRight 0.3s ease both;
}

.med-inputs { display: flex; gap: 6px; flex: 1; }
.flex-grow { flex: 1; }
.qty-wrap { width: 68px; flex-shrink: 0; }

/* ── Champs ── */
.field-wrap {
  display: flex;
  flex-direction: column;
}

.field-input {
  height: 44px;
  border: 1.5px solid #E8E1D9;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 0.92rem;
  font-family: inherit;
  color: #1A1510;
  background: #FAFAF8;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.field-input:focus {
  border-color: #1B8C5A;
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.12);
  background: #FFFFFF;
}

.field-input::placeholder { color: #C4B8AE; }

.qty-input { text-align: center; font-weight: 700; }

/* ── Bouton supprimer ── */
.remove-btn {
  width: 36px;
  height: 36px;
  background: #FDEDEC;
  border: none;
  border-radius: 8px;
  color: #C0392B;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s;
}
.remove-btn:hover { background: #FBD5D2; }

/* ── Ajouter médicament ── */
.add-med-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  width: 100%;
  height: 42px;
  background: transparent;
  color: #1B8C5A;
  border: 1.5px dashed #A8D4BF;
  border-radius: 10px;
  font-size: 0.88rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  justify-content: center;
  transition: background 0.18s, border-color 0.18s;
}
.add-med-btn:hover { background: #E8F7F0; border-color: #1B8C5A; }

/* ── Erreur ── */
.erreur-msg {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #C0392B;
  font-size: 0.84rem;
  background: #FDEDEC;
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 8px;
  animation: tmShake 0.4s ease;
}

/* ── Hint ordonnance obligatoire ── */
.ordonance-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #7A6E65;
  margin: 6px 0 0;
}

/* ── Urgente row ── */
.urgente-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #F0EDE8;
}

.urgente-toggle {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1.5px solid #E8E1D9;
  background: #FAFAF8;
  color: #9E8E85;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s;
  flex-shrink: 0;
}
.urgente-toggle.active {
  background: #FDF0E8;
  border-color: #C8521A;
  color: #C8521A;
}

.urgente-label {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1A1510;
  flex: 1;
}

.urgente-chip {
  background: #C0392B;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: 100px;
  animation: tmPop 0.25s ease;
}

/* ── Submit ── */
.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 54px;
  background: #1B8C5A;
  color: white;
  border: none;
  border-radius: 14px;
  font-size: 1rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(27, 140, 90, 0.38);
  transition: background 0.18s, transform 0.14s;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) { background: #146B45; transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: scale(0.97); }
.submit-btn:disabled, .submit-btn.loading {
  background: #8FC9AF;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
