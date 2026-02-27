<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/app/demandes" />
        </ion-buttons>
        <ion-title>Détail demande</ion-title>
        <ion-buttons slot="end">
          <button class="chat-btn" @click="naviguerChat">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="!demande && !demandeStore.loading" class="center-content">
        <p class="not-found">Demande introuvable.</p>
      </div>

      <div v-if="demandeStore.loading" class="loading-pad">
        <div class="skeleton-tall" />
        <div class="skeleton-card" />
        <div class="skeleton-card" />
      </div>

      <div v-if="demande" class="detail-content">

        <!-- ── Statut + Timeline ── -->
        <div class="section" style="animation-delay: 0ms">
          <StatutBadge :statut="demande.statut" class="statut-badge" />
          <StatutTimeline :statut="demande.statut" class="timeline-wrap" />
        </div>

        <!-- ── Médicaments ── -->
        <div class="section card" style="animation-delay: 60ms">
          <div class="section-header">
            <div class="section-icon green">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" stroke-width="2"/>
                <path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="section-title">Médicaments</h3>
          </div>
          <div class="meds-list">
            <MedicamentItem v-for="(med, i) in demande.medicaments" :key="i" :medicament="med" />
          </div>
          <div class="adresse-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" fill="currentColor"/>
            </svg>
            <span>{{ demande.adresseLivraison }}</span>
          </div>
        </div>

        <!-- ── Cagnotte ── -->
        <div v-if="cagnotte" class="section" style="animation-delay: 120ms">
          <CagnotteProgress :cagnotte="cagnotte" />
        </div>

        <!-- ── Aidants engagés ── -->
        <div v-if="demande.propositions.length" class="section card" style="animation-delay: 180ms">
          <div class="section-header">
            <div class="section-icon terra">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="section-title">Aidants engagés</h3>
          </div>
          <div class="aidants-list">
            <div
              v-for="(prop, idx) in demande.propositions"
              :key="prop.id"
              class="aidant-item"
              :style="{ animationDelay: `${idx * 60 + 180}ms` }"
            >
              <div class="aidant-avatar">{{ prop.aidantPrenom[0] }}</div>
              <div class="aidant-info">
                <span class="aidant-nom">{{ prop.aidantPrenom }}</span>
                <span class="aidant-type">{{ LIBELLES_PROP[prop.type] }}</span>
                <span v-if="prop.montantContribue" class="aidant-montant">{{ prop.montantContribue }} €</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Ordonnance (acheteur) ── -->
        <div v-if="isAidant && peutVoirOrdonnance" class="section card" style="animation-delay: 240ms">
          <div class="section-header">
            <div class="section-icon blue">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                <path d="M14 2v6h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </div>
            <h3 class="section-title">Ordonnance</h3>
          </div>
          <button class="action-outline" type="button" @click="voirOrdonnance">
            Voir l'ordonnance
          </button>
        </div>

        <!-- ── Confirmer (patient, statut 6) ── -->
        <div
          v-if="isPatient && demande.statut === 'pret_acceptation_patient'"
          class="section card confirm-card"
          style="animation-delay: 300ms"
        >
          <p class="confirm-text">
            Tout est prêt ! <strong>{{ demande.transporteurPrenom }}</strong> va récupérer et livrer vos médicaments.
          </p>
          <button class="action-btn green" :disabled="confirmLoading" type="button" @click="confirmer">
            <svg v-if="!confirmLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ confirmLoading ? 'En cours…' : 'Confirmer la livraison' }}</span>
          </button>
        </div>

        <!-- ── Marquer livré (aidant, statut 7) ── -->
        <div
          v-if="isAidant && demande.statut === 'en_cours_livraison' && estTransporteur"
          class="section card"
          style="animation-delay: 300ms"
        >
          <button class="action-btn terra" :disabled="livraisonLoading" type="button" @click="marquerLivree">
            <svg v-if="!livraisonLoading" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>{{ livraisonLoading ? 'En cours…' : 'Médicaments livrés' }}</span>
          </button>
        </div>

        <!-- ── Panel propositions ── -->
        <div v-if="isAidant && peutProposer" class="section" style="animation-delay: 360ms">
          <PropositionPanel :demande="demande" :cagnotte="cagnotte" />
        </div>

        <!-- ── Erreur action ── -->
        <div v-if="actionError" class="action-erreur">
          {{ actionError }}
        </div>

      </div>

      <!-- Modal ordonnance -->
      <ion-modal :is-open="ordonanceModalOpen" @didDismiss="ordonanceModalOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Ordonnance</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="ordonanceModalOpen = false">Fermer</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <img
            v-if="ordonanceData && ordonanceData.mimeType !== 'application/pdf'"
            :src="ordonanceData.base64Data"
            style="width: 100%; height: auto"
            alt="Ordonnance"
          />
          <iframe
            v-else-if="ordonanceData"
            :src="ordonanceData.base64Data"
            style="width: 100%; height: 100%; border: none"
            title="Ordonnance PDF"
          />
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonBackButton,
  IonButtons, IonButton, IonModal,
} from '@ionic/vue'
import StatutBadge from '../components/StatutBadge.vue'
import StatutTimeline from '../components/StatutTimeline.vue'
import MedicamentItem from '../components/MedicamentItem.vue'
import CagnotteProgress from '../components/CagnotteProgress.vue'
import PropositionPanel from '../components/PropositionPanel.vue'
import { useDemandeStore } from '../stores/demandes.store'
import { useCagnotteStore } from '../stores/cagnotte.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { ordonanceService } from '../services/index'
import type { Ordonance } from '../types/ordonance.types'
import type { TypeProposition } from '../types/proposition.types'
import { canTransition } from '../services/demandeStateMachine'

const LIBELLES_PROP: Record<TypeProposition, string> = {
  prop1_cagnotte: 'Contribution cagnotte',
  prop2_transport: 'Transport',
  prop3_achat_transport: 'Achat + Transport',
}

const route = useRoute()
const router = useRouter()
const demandeStore = useDemandeStore()
const cagnotteStore = useCagnotteStore()
const { currentUser, isPatient, isAidant } = useCurrentUser()

const ordonanceModalOpen = ref(false)
const ordonanceData = ref<Ordonance | null>(null)
const confirmLoading = ref(false)
const livraisonLoading = ref(false)
const actionError = ref('')

const demande = computed(() => demandeStore.getById(route.params.id as string))
const cagnotte = computed(() => demande.value ? (cagnotteStore.getForDemande(demande.value.id) ?? null) : null)
const estTransporteur = computed(() => currentUser.value && demande.value?.transporteurId === currentUser.value.id)

const peutProposer = computed(() => {
  if (!demande.value) return false
  return canTransition(demande.value.statut, 'prop1_contribution') ||
         canTransition(demande.value.statut, 'prop2_transport') ||
         canTransition(demande.value.statut, 'prop3_achat_transport')
})

const peutVoirOrdonnance = computed(() => {
  if (!demande.value || !currentUser.value) return false
  return demande.value.propositions.some(
    (p) => p.aidantId === currentUser.value!.id &&
           (p.type === 'prop3_achat_transport' || p.type === 'prop1_cagnotte')
  )
})

onMounted(async () => {
  const id = route.params.id as string
  if (!demandeStore.getById(id)) await demandeStore.fetchAll()
  if (demande.value) await cagnotteStore.fetchForDemande(demande.value.id)
})

function naviguerChat() { router.push(`/app/demandes/${route.params.id}/chat`) }

async function voirOrdonnance() {
  if (!demande.value) return
  try {
    ordonanceData.value = await ordonanceService.getByDemandeId(demande.value.id)
    ordonanceModalOpen.value = true
  } catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
}

async function confirmer() {
  if (!demande.value) return
  confirmLoading.value = true; actionError.value = ''
  try { await demandeStore.confirmerParPatient(demande.value.id) }
  catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
  finally { confirmLoading.value = false }
}

async function marquerLivree() {
  if (!demande.value) return
  livraisonLoading.value = true; actionError.value = ''
  try { await demandeStore.marquerLivree(demande.value.id) }
  catch (e) { actionError.value = e instanceof Error ? e.message : 'Erreur' }
  finally { livraisonLoading.value = false }
}
</script>

<style scoped>
/* ── Chat button ── */
.chat-btn {
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  color: #1B8C5A;
  display: flex;
  align-items: center;
  border-radius: 8px;
  transition: background 0.15s;
}
.chat-btn:hover { background: #E8F7F0; }

/* ── Loading ── */
.loading-pad { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.skeleton-tall { height: 100px; background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%); background-size: 200% 100%; border-radius: 14px; animation: skeletonWave 1.6s ease-in-out infinite; }
.skeleton-card { height: 80px; background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%); background-size: 200% 100%; border-radius: 14px; animation: skeletonWave 1.6s ease-in-out infinite; }
.skeleton-card:nth-child(2) { animation-delay: 0.2s; }
@keyframes skeletonWave { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Content ── */
.detail-content { padding: 12px 16px 100px; display: flex; flex-direction: column; gap: 4px; }

.section {
  animation: tmFadeUp 0.35s ease both;
}

/* ── Card sections ── */
.card {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.06);
  padding: 14px 14px 10px;
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.section-icon {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.section-icon.green  { background: #E8F7F0; color: #1B8C5A; }
.section-icon.terra  { background: #FDF0E8; color: #C8521A; }
.section-icon.blue   { background: #EAF3FB; color: #2B7CC1; }

.section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1A1510;
  margin: 0;
}

/* ── Statut ── */
.statut-badge { margin-bottom: 6px; }
.timeline-wrap { margin-top: 6px; }

/* ── Médicaments ── */
.meds-list { margin-bottom: 10px; }
.adresse-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: #7A6E65;
  padding-top: 8px;
  border-top: 1px solid #F0EDE8;
}
.adresse-row svg { flex-shrink: 0; color: #9E8E85; }

/* ── Aidants ── */
.aidants-list { display: flex; flex-direction: column; gap: 10px; }
.aidant-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  animation: tmSlideRight 0.3s ease both;
}
.aidant-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #E8F7F0;
  color: #1B8C5A;
  font-size: 0.9rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid #C6EADA;
}
.aidant-info { display: flex; flex-direction: column; gap: 2px; }
.aidant-nom { font-size: 0.9rem; font-weight: 600; color: #1A1510; }
.aidant-type { font-size: 0.8rem; color: #7A6E65; }
.aidant-montant { font-size: 0.8rem; font-weight: 700; color: #1B8C5A; }

/* ── Actions ── */
.action-outline {
  width: 100%;
  height: 44px;
  background: transparent;
  color: #2B7CC1;
  border: 1.5px solid #2B7CC1;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s;
}
.action-outline:hover { background: #EAF3FB; }

.confirm-card { background: #E8F7F0; border-color: #C6EADA; }
.confirm-text { font-size: 0.9rem; color: #1A1510; margin: 0 0 12px; line-height: 1.45; }

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s, transform 0.14s;
}
.action-btn:active { transform: scale(0.97); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.action-btn.green { background: #1B8C5A; color: white; box-shadow: 0 4px 16px rgba(27,140,90,0.35); }
.action-btn.green:hover:not(:disabled) { background: #146B45; }
.action-btn.terra { background: #C8521A; color: white; box-shadow: 0 4px 16px rgba(200,82,26,0.3); }
.action-btn.terra:hover:not(:disabled) { background: #A94517; }

.action-erreur {
  background: #FDEDEC;
  color: #C0392B;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.84rem;
}

.not-found { color: #7A6E65; }
.center-content { display: flex; justify-content: center; align-items: center; height: 50vh; }
</style>
