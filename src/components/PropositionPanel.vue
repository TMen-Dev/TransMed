<template>
  <div class="proposition-panel">
    <div class="panel-header">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span>Proposer mon aide</span>
    </div>

    <!-- Prop : Achat + Envoi au transporteur -->
    <div
      v-if="canPropAchatEnvoi"
      class="prop-section"
    >
      <button
        class="action-btn outline-green"
        type="button"
        :disabled="loading"
        @click="handlePropAchatEnvoi"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M3 6h18"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        Acheter et envoyer au transporteur
      </button>
    </div>

    <!-- Prop : Transport jusqu'au patient -->
    <div
      v-if="canPropTransport"
      class="prop-section"
    >
      <button
        class="action-btn outline-blue"
        type="button"
        :disabled="loading"
        @click="handlePropTransport"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <circle
            cx="5.5"
            cy="18.5"
            r="2.5"
            stroke="currentColor"
            stroke-width="1.8"
          />
          <circle
            cx="18.5"
            cy="18.5"
            r="2.5"
            stroke="currentColor"
            stroke-width="1.8"
          />
        </svg>
        Proposer le transport
      </button>
    </div>

    <!-- Prop : Achat + Transport (aidant unique) -->
    <div
      v-if="canPropAchatTransport"
      class="prop-section"
    >
      <button
        class="action-btn terra"
        type="button"
        :disabled="loading"
        @click="handlePropAchatTransport"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
            stroke="white"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M3 6h18M16 10a4 4 0 01-8 0"
            stroke="white"
            stroke-width="1.8"
            stroke-linecap="round"
          />
        </svg>
        Acheter et transporter moi-même
      </button>
    </div>

    <!-- CharteModal -->
    <CharteModal
      v-if="showCharteModal"
      @accepter="onCharteAcceptee"
      @fermer="fermerCharte"
    />

    <!-- Feedback -->
    <div
      v-if="erreur"
      class="feedback erreur"
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
    <div
      v-if="succes"
      class="feedback succes"
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
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      {{ succes }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePropositionsStore } from '../stores/propositions.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useCharteAidant } from '../composables/useCharteAidant'
import { canTransition } from '../services/demandeStateMachine'
import type { Demande } from '../types/demande.types'
import CharteModal from './CharteModal.vue'

const props = defineProps<{ demande: Demande }>()

const { currentUser } = useCurrentUser()
const propositionsStore = usePropositionsStore()
const { showCharteModal, verifierEtProceder, accepterCharte, fermerCharte } = useCharteAidant()

const loading = ref(false)
const erreur = ref('')
const succes = ref('')

const canPropAchatEnvoi = computed(() =>
  canTransition(props.demande.statut, 'prop_achat_envoi')
)
const canPropTransport = computed(() =>
  canTransition(props.demande.statut, 'prop_transport')
)
const canPropAchatTransport = computed(() =>
  canTransition(props.demande.statut, 'prop_achat_transport')
)

async function onCharteAcceptee() {
  await accepterCharte()
}

async function doPropAchatEnvoi() {
  if (!currentUser.value) return
  loading.value = true; erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop_achat_envoi',
    })
    succes.value = 'Proposition d\'achat enregistrée — en attente d\'un transporteur.'
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
  finally { loading.value = false }
}

async function doPropTransport() {
  if (!currentUser.value) return
  loading.value = true; erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop_transport',
    })
    succes.value = 'Proposition de transport enregistrée.'
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
  finally { loading.value = false }
}

async function doPropAchatTransport() {
  if (!currentUser.value) return
  loading.value = true; erreur.value = ''
  try {
    await propositionsStore.createProposition({
      demandeId: props.demande.id,
      aidantId: currentUser.value.id,
      aidantPrenom: currentUser.value.prenom,
      type: 'prop_achat_transport',
    })
    succes.value = 'Prise en charge complète enregistrée. Le patient sera notifié pour fixer un RDV.'
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
  finally { loading.value = false }
}

// T019 — wrapper les boutons proposition avec verifierEtProceder (charte one-time)
function handlePropAchatEnvoi() { verifierEtProceder(doPropAchatEnvoi) }
function handlePropTransport() { verifierEtProceder(doPropTransport) }
function handlePropAchatTransport() { verifierEtProceder(doPropAchatTransport) }
</script>

<style scoped>
.proposition-panel {
  background: #FFFFFF;
  border-radius: 14px;
  border: 1px solid #E8E1D9;
  box-shadow: 0 2px 12px rgba(26, 21, 16, 0.07);
  padding: 16px;
  margin: 0 0 12px;
  animation: tmFadeUp 0.4s ease both;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #C8521A;
  margin-bottom: 14px;
}

.prop-section {
  margin-bottom: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: background 0.18s, transform 0.14s, box-shadow 0.18s;
}

.action-btn:active { transform: scale(0.97); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.action-btn.outline-green {
  background: transparent;
  color: #1B8C5A;
  border: 1.5px solid #1B8C5A;
}
.action-btn.outline-green:hover:not(:disabled) { background: #E8F7F0; }

.action-btn.outline-blue {
  background: transparent;
  color: #2B7CC1;
  border: 1.5px solid #2B7CC1;
}
.action-btn.outline-blue:hover:not(:disabled) { background: #EAF3FB; }

.action-btn.terra {
  background: #C8521A;
  color: white;
  box-shadow: 0 3px 12px rgba(200, 82, 26, 0.28);
}
.action-btn.terra:hover:not(:disabled) { background: #A94517; }

.feedback {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 0.83rem;
  border-radius: 8px;
  padding: 9px 12px;
  margin-top: 8px;
  animation: tmPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.erreur { background: #FDEDEC; color: #C0392B; }
.succes { background: #E8F7F0; color: #146B45; }
</style>
