<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/app/demandes" />
        </ion-buttons>
        <ion-title>{{ demande?.nom ?? 'Détail demande' }}</ion-title>
        <ion-buttons slot="end">
          <button
            class="chat-btn"
            @click="naviguerChat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div
        v-if="!demande && !demandeStore.loading"
        class="center-content"
      >
        <p class="not-found">
          Demande introuvable.
        </p>
      </div>

      <div
        v-if="demandeStore.loading"
        class="loading-pad"
      >
        <div class="skeleton-tall" />
        <div class="skeleton-card" />
        <div class="skeleton-card" />
      </div>

      <div
        v-if="demande"
        class="detail-content"
      >
        <!-- ── Urgence banner ── -->
        <div
          class="urgence-banner"
          :class="demande.urgente ? 'urgente' : 'normale'"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              v-if="demande.urgente"
              d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              v-else
              d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            />
          </svg>
          {{ demande.urgente ? 'Demande urgente' : 'Demande non urgente' }}
        </div>

        <!-- ── Dernière connexion patient (visible pour les aidants) ── -->
        <div v-if="isAidant && demande.patientId" class="last-seen-row">
          <LastSeenBadge :user-id="demande.patientId" size="sm" />
        </div>

        <!-- ── Statut + Timeline ── -->
        <div class="section" style="animation-delay: 0ms">
          <StatutBadge :statut="demande.statut" class="statut-badge" />
          <StatutTimeline :statut="demande.statut" class="timeline-wrap" />

          <div v-if="notifTriggered && isAidant" class="notif-success-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Notification envoyée par email
          </div>
          <div v-if="notifEchec && isAidant" class="notif-echec-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
            Notification échouée — contactez directement
          </div>
        </div>

        <!-- ── Médicaments ── -->
        <div class="section card" style="animation-delay: 60ms">
          <div class="section-header">
            <div class="section-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" stroke-width="2" />
                <path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </div>
            <h3 class="section-title">Médicaments</h3>
          </div>
          <div class="meds-list">
            <MedicamentItem v-for="(med, i) in demande.medicaments" :key="i" :medicament="med" />
          </div>
          <div class="adresse-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor" />
            </svg>
            <span>{{ demande.adresseLivraison }}</span>
          </div>
        </div>

        <!-- ── Aidants engagés ── -->
        <div v-if="demande.propositions.length" class="section card" style="animation-delay: 120ms">
          <div class="section-header">
            <div class="section-icon terra">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <h3 class="section-title">Aidants engagés</h3>
          </div>
          <div class="aidants-list">
            <div
              v-for="(prop, idx) in demande.propositions"
              :key="prop.id"
              class="aidant-item"
              :style="{ animationDelay: `${idx * 60 + 120}ms` }"
            >
              <div class="aidant-avatar">{{ prop.aidantPrenom[0] }}</div>
              <div class="aidant-info">
                <span class="aidant-nom">{{ prop.aidantPrenom }}</span>
                <span class="aidant-type">{{ LIBELLES_PROP[prop.type] }}</span>
                <ConfianceBadges :user-id="prop.aidantId" :compact="true" />
              </div>
            </div>
          </div>
        </div>

        <!-- ── Ordonnance (aidant ayant proposé) ── -->
        <div v-if="isAidant && peutVoirOrdonnance" class="section card" style="animation-delay: 180ms">
          <div class="section-header">
            <div class="section-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <h3 class="section-title">Ordonnance</h3>
          </div>
          <div class="ordonance-actions">
            <button class="action-outline" type="button" @click="voirOrdonnance">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
              </svg>
              Voir l'ordonnance
            </button>
            <button v-if="peutTelechargerOrdonnance" class="action-outline download-btn" type="button" @click="telechargerOrdonnance">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              Télécharger
            </button>
          </div>
        </div>

        <!-- ── Ordonnance (transporteur assigné sans proposition directe) ── -->
        <div v-if="estTransporteur && !peutVoirOrdonnance" class="section card" style="animation-delay: 180ms">
          <div class="section-header">
            <div class="section-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
            </div>
            <h3 class="section-title">Ordonnance</h3>
          </div>
          <button class="action-outline download-btn" type="button" @click="telechargerOrdonnance">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Télécharger l'ordonnance
          </button>
        </div>

        <!-- ── D → E : Acheteur envoie médicaments au transporteur (scénarios 2/3) ── -->
        <div
          v-if="estAcheteur && !demande.singleAidant && demande.statut === 'transporteur_et_medicaments_prets'"
          class="section card action-card"
          style="animation-delay: 240ms"
        >
          <p class="confirm-text">
            <strong>{{ demande.transporteurPrenom }}</strong> est prêt à transporter. Confirmez l'envoi des médicaments.
          </p>
          <button
            class="action-btn blue"
            :disabled="envoiLoading"
            type="button"
            @click="envoyerMedicaments"
          >
            <svg v-if="!envoiLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ envoiLoading ? 'En cours…' : 'Médicaments envoyés au transporteur' }}</span>
          </button>
        </div>

        <!-- ── E → F : Transporteur confirme réception des médicaments ── -->
        <div
          v-if="estTransporteur && demande.statut === 'en_cours_livraison_transporteur'"
          class="section card action-card"
          style="animation-delay: 240ms"
        >
          <p class="confirm-text">
            Confirmez la réception des médicaments et de l'ordonnance pour notifier le patient.
          </p>
          <button
            class="action-btn terra"
            :disabled="receptionTransporteurLoading"
            type="button"
            @click="confirmerReceptionTransporteur"
          >
            <svg v-if="!receptionTransporteurLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ receptionTransporteurLoading ? 'En cours…' : 'Médicaments reçus' }}</span>
          </button>
        </div>

        <!-- ── F → G : Patient confirme RDV fixé ── -->
        <div
          v-if="isPatient && demande.statut === 'rdv_a_fixer'"
          class="section card confirm-card"
          style="animation-delay: 240ms"
        >
          <p class="confirm-text">
            <strong>{{ demande.transporteurPrenom }}</strong> va vous livrer vos médicaments. Confirmez quand le RDV est fixé.
          </p>
          <button
            class="action-btn green"
            :disabled="rdvLoading"
            type="button"
            @click="confirmerRdv"
          >
            <svg v-if="!rdvLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ rdvLoading ? 'En cours…' : 'RDV fixé avec le transporteur' }}</span>
          </button>
        </div>

        <!-- ── G → H : Patient confirme réception des médicaments ── -->
        <div
          v-if="isPatient && demande.statut === 'en_cours_livraison_patient'"
          class="section card reception-card"
          style="animation-delay: 240ms"
        >
          <p class="confirm-text">
            Les médicaments sont en route. Confirmez la réception pour clôturer la demande.
          </p>
          <button
            class="action-btn green"
            :disabled="receptionLoading"
            type="button"
            @click="recevoirMedicaments"
          >
            <svg v-if="!receptionLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>{{ receptionLoading ? 'En cours…' : 'Médicaments reçus' }}</span>
          </button>
        </div>

        <!-- ── Message de remerciement (statut traitee) ── -->
        <div
          v-if="demande.statut === 'traitee' && demande.messageRemerciement"
          class="section card merci-card"
          style="animation-delay: 240ms"
        >
          <div class="section-header">
            <div class="section-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="section-title">Message du patient</h3>
          </div>
          <p class="merci-text">"{{ demande.messageRemerciement }}"</p>
        </div>

        <!-- ── Bouton "Poser une question" (aidant, pré-chat) ── -->
        <div
          v-if="isAidant && demande.statut === 'nouvelle_demande'"
          class="section"
          style="animation-delay: 280ms"
        >
          <button class="pre-chat-btn" type="button" @click="ouvrirPreChat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Poser une question au patient
          </button>
        </div>

        <!-- ── Panel propositions (aidant) ── -->
        <div
          v-if="isAidant && peutProposer"
          class="section"
          style="animation-delay: 300ms"
        >
          <PropositionPanel :demande="demande" />
        </div>

        <!-- ── Erreur action ── -->
        <div v-if="actionError" class="action-erreur">
          {{ actionError }}
        </div>
      </div>
    </ion-content>

    <!-- ── CharteModal (programmatique via v-if + modalController) ── -->
    <CharteModal
      v-if="showCharteModal"
      @accepter="onCharteAcceptee"
      @fermer="fermerCharte"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonButtons, toastController, modalController, alertController,
} from '@ionic/vue'
import StatutBadge from '../components/StatutBadge.vue'
import OrdonanceModal from '../components/OrdonanceModal.vue'
import StatutTimeline from '../components/StatutTimeline.vue'
import MedicamentItem from '../components/MedicamentItem.vue'
import PropositionPanel from '../components/PropositionPanel.vue'
import CharteModal from '../components/CharteModal.vue'
import LastSeenBadge from '../components/LastSeenBadge.vue'
import ConfianceBadges from '../components/ConfianceBadges.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useDemandeRealtime } from '../composables/useDemandeRealtime'
import { useCharteAidant } from '../composables/useCharteAidant'
import { ordonanceService } from '../services/index'
import type { Ordonance } from '../types/ordonance.types'
import type { TypeProposition } from '../types/proposition.types'
import { canTransition } from '../services/demandeStateMachine'
import { useNotification } from '../composables/useNotification'

const LIBELLES_PROP: Record<TypeProposition, string> = {
  prop_achat_envoi:    'Achat + envoi au transporteur',
  prop_transport:      'Transport',
  prop_achat_transport:'Achat + Transport',
}

const route = useRoute()
const router = useRouter()
const demandeStore = useDemandeStore()
const { currentUser, isPatient, isAidant } = useCurrentUser()
const { showCharteModal, verifierEtProceder, accepterCharte, fermerCharte } = useCharteAidant()

const ordonanceData = ref<Ordonance | null>(null)
const envoiLoading = ref(false)
const receptionTransporteurLoading = ref(false)
const rdvLoading = ref(false)
const receptionLoading = ref(false)
const actionError = ref('')

async function showToast(message: string, color = 'success', duration = 4000) {
  const toast = await toastController.create({ message, color, duration, position: 'bottom' })
  await toast.present()
}

const { notifTriggered, notifMessage, notifEchec, startListening, stopListening, resetNotif } = useNotification()

const demande = computed(() => demandeStore.getById(route.params.id as string))

const estTransporteur = computed(() =>
  currentUser.value && demande.value?.transporteurId === currentUser.value.id
)

// Computed pour l'aidant-acheteur assigné (FR-005)
const estAcheteur = computed(() =>
  currentUser.value && demande.value?.acheteurId === currentUser.value.id
)

const peutProposer = computed(() => {
  if (!demande.value) return false
  return canTransition(demande.value.statut, 'prop_achat_envoi') ||
         canTransition(demande.value.statut, 'prop_transport') ||
         canTransition(demande.value.statut, 'prop_achat_transport')
})

const peutVoirOrdonnance = computed(() => {
  if (!demande.value || !currentUser.value) return false
  return demande.value.propositions.some((p) => p.aidantId === currentUser.value!.id)
})

const peutTelechargerOrdonnance = computed(() => {
  if (!demande.value || !currentUser.value) return false
  return peutVoirOrdonnance.value || !!estTransporteur.value
})

onMounted(async () => {
  const id = route.params.id as string
  if (!demandeStore.getById(id)) await demandeStore.fetchAll()
  useDemandeRealtime(id)
  startListening(id)
})

onUnmounted(() => { stopListening() })

watch(notifTriggered, async (triggered) => {
  if (triggered) {
    await showToast(notifMessage.value, 'success', 5000)
    resetNotif()
  }
})

function naviguerChat() { router.push(`/app/demandes/${route.params.id}/chat`) }

// T017 — pré-chat : vérifier charte puis naviguer vers le chat
function ouvrirPreChat() {
  verifierEtProceder(() => {
    router.push(`/app/demandes/${route.params.id}/chat`)
  })
}

async function onCharteAcceptee() {
  await accepterCharte()
  // La navigation sera déclenchée par pendingAction dans useCharteAidant
}

function telechargerOrdonnance() {
  showToast('Téléchargement simulé — ordonnance.jpg', 'success', 3000)
}

async function voirOrdonnance() {
  if (!demande.value) return
  try {
    ordonanceData.value = await ordonanceService.getByDemandeId(demande.value.id)
    const modal = await modalController.create({
      component: OrdonanceModal,
      componentProps: {
        signedUrl: ordonanceData.value.signedUrl,
        base64Data: ordonanceData.value.base64Data,
        mimeType: ordonanceData.value.mimeType,
      },
    })
    await modal.present()
  } catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur ordonnance' }
}

// D→E : Acheteur confirme envoi (scénarios 2/3)
async function envoyerMedicaments() {
  if (!demande.value) return
  envoiLoading.value = true; actionError.value = ''
  try { await demandeStore.confirmerEnvoiMedicaments(demande.value.id) }
  catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
  finally { envoiLoading.value = false }
}

// E→F : Transporteur confirme réception des médicaments
async function confirmerReceptionTransporteur() {
  if (!demande.value) return
  receptionTransporteurLoading.value = true; actionError.value = ''
  try { await demandeStore.confirmerReceptionTransporteur(demande.value.id) }
  catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
  finally { receptionTransporteurLoading.value = false }
}

// F→G : Patient confirme RDV fixé
async function confirmerRdv() {
  if (!demande.value) return
  rdvLoading.value = true; actionError.value = ''
  try { await demandeStore.confirmerRdvFixe(demande.value.id) }
  catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
  finally { rdvLoading.value = false }
}

// G→H : Patient confirme réception finale
async function recevoirMedicaments() {
  if (!demande.value) return
  const alert = await alertController.create({
    header: 'Médicaments reçus',
    message: 'Laissez un message de remerciement (optionnel) pour les aidants.',
    inputs: [{ name: 'message', type: 'textarea', placeholder: 'Merci infiniment…' }],
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Confirmer',
        handler: async (data: { message?: string }) => {
          receptionLoading.value = true; actionError.value = ''
          try {
            await demandeStore.recevoirMedicaments(demande.value!.id, data.message?.trim() || undefined)
          } catch (e) {
            actionError.value = e instanceof Error ? e.message : 'Erreur'
          } finally {
            receptionLoading.value = false
          }
        },
      },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
.chat-btn {
  background: none; border: none; padding: 8px; cursor: pointer;
  color: #1B8C5A; display: flex; align-items: center;
  border-radius: 8px; transition: background 0.15s;
}
.chat-btn:hover { background: #E8F7F0; }

.loading-pad { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.skeleton-tall { height: 100px; background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%); background-size: 200% 100%; border-radius: 14px; animation: skeletonWave 1.6s ease-in-out infinite; }
.skeleton-card { height: 80px; background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%); background-size: 200% 100%; border-radius: 14px; animation: skeletonWave 1.6s ease-in-out infinite; }
.skeleton-card:nth-child(2) { animation-delay: 0.2s; }
@keyframes skeletonWave { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

.detail-content { padding: 12px 16px 100px; display: flex; flex-direction: column; gap: 4px; }
.section { animation: tmFadeUp 0.35s ease both; }
.card { background: #FFFFFF; border-radius: 14px; border: 1px solid #E8E1D9; box-shadow: 0 2px 12px rgba(26, 21, 16, 0.06); padding: 14px 14px 10px; margin-bottom: 8px; }

.section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.section-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.section-icon.green  { background: #E8F7F0; color: #1B8C5A; }
.section-icon.terra  { background: #FDF0E8; color: #C8521A; }
.section-icon.blue   { background: #EAF3FB; color: #2B7CC1; }
.section-title { font-size: 0.95rem; font-weight: 700; color: #1A1510; margin: 0; }

.statut-badge { margin-bottom: 6px; }
.timeline-wrap { margin-top: 6px; }

.meds-list { margin-bottom: 10px; }
.adresse-row { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; color: #7A6E65; padding-top: 8px; border-top: 1px solid #F0EDE8; }
.adresse-row svg { flex-shrink: 0; color: #9E8E85; }

.aidants-list { display: flex; flex-direction: column; gap: 10px; }
.aidant-item { display: flex; align-items: flex-start; gap: 10px; animation: tmSlideRight 0.3s ease both; }
.aidant-avatar { width: 36px; height: 36px; border-radius: 50%; background: #E8F7F0; color: #1B8C5A; font-size: 0.9rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1.5px solid #C6EADA; }
.aidant-info { display: flex; flex-direction: column; gap: 2px; }
.aidant-nom { font-size: 0.9rem; font-weight: 600; color: #1A1510; }
.aidant-type { font-size: 0.8rem; color: #7A6E65; }

.ordonance-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.action-outline { flex: 1; min-width: 120px; height: 44px; display: flex; align-items: center; justify-content: center; gap: 6px; background: transparent; color: #2B7CC1; border: 1.5px solid #2B7CC1; border-radius: 10px; font-size: 0.88rem; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.18s; }
.action-outline:hover { background: #EAF3FB; }
.download-btn { color: #1B8C5A; border-color: #1B8C5A; }
.download-btn:hover { background: #E8F7F0; }

.action-card { background: #F0F7FF; border-color: #B0D4F0; }
.confirm-card { background: #E8F7F0; border-color: #C6EADA; }
.reception-card { background: #EAF3FB; border-color: #B0D4F0; }
.confirm-text { font-size: 0.9rem; color: #1A1510; margin: 0 0 12px; line-height: 1.45; }

.action-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; border: none; border-radius: 12px; font-size: 0.95rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.18s, transform 0.14s; }
.action-btn:active { transform: scale(0.97); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn.green { background: #1B8C5A; color: white; box-shadow: 0 4px 16px rgba(27,140,90,0.35); }
.action-btn.green:hover:not(:disabled) { background: #146B45; }
.action-btn.terra { background: #C8521A; color: white; box-shadow: 0 4px 16px rgba(200,82,26,0.3); }
.action-btn.terra:hover:not(:disabled) { background: #A94517; }
.action-btn.blue { background: #2B7CC1; color: white; box-shadow: 0 4px 16px rgba(43,124,193,0.3); }
.action-btn.blue:hover:not(:disabled) { background: #1A5C96; }

.action-erreur { background: #FDEDEC; color: #C0392B; border-radius: 8px; padding: 10px 14px; font-size: 0.84rem; }

.urgence-banner { display: flex; align-items: center; gap: 8px; border-radius: 10px; padding: 10px 14px; font-size: 0.86rem; font-weight: 700; margin-bottom: 6px; animation: tmFadeUp 0.3s ease both; }
.urgence-banner.urgente { background: #FDEDEC; color: #C0392B; border: 1.5px solid #F1AAA5; }
.urgence-banner.normale { background: #F0EDE8; color: #9E8E85; border: 1.5px solid #E0D8D0; }

.merci-card { background: #F0FAF5; border-color: #C6EADA; }
.merci-text { font-size: 0.9rem; color: #1A1510; font-style: italic; line-height: 1.5; margin: 0; }

.not-found { color: #7A6E65; }
.center-content { display: flex; justify-content: center; align-items: center; height: 50vh; }

.pre-chat-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; height: 50px; background: #EAF3FB; border: 1.5px solid #B0D4F0; border-radius: 12px; color: #2B7CC1; font-size: 0.93rem; font-weight: 700; font-family: inherit; cursor: pointer; transition: background 0.18s, transform 0.14s; animation: tmFadeUp 0.35s ease both; }
.pre-chat-btn:hover { background: #D5E9F8; }
.pre-chat-btn:active { transform: scale(0.97); }

.last-seen-row { padding: 6px 0 2px; animation: tmFadeUp 0.3s ease both; }

.notif-success-badge { display: inline-flex; align-items: center; gap: 6px; margin-top: 10px; padding: 6px 12px; background: #E8F7F0; border: 1px solid #B2DFC8; border-radius: 20px; font-size: 0.82rem; font-weight: 600; color: #146B45; animation: tmPop 0.3s ease both; }
.notif-echec-banner { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding: 10px 14px; background: #FDF0E8; border: 1px solid #E8C4A8; border-radius: 10px; font-size: 0.83rem; font-weight: 500; color: #C8521A; }
</style>
