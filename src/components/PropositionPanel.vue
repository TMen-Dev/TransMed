<template>
  <div class="proposition-panel">
    <div class="panel-header">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Proposer mon aide</span>
    </div>

    <!-- Définir montant cible -->
    <div v-if="cagnotte && cagnotte.statut === 'en_attente_evaluation'" class="definir-section">
      <p class="info-text">
        En tant qu'acheteur, définissez le montant nécessaire pour l'achat.
      </p>
      <div class="amount-input-wrap" :class="{ focused: montantFocused }">
        <span class="euro-sym">€</span>
        <input
          v-model.number="montantCible"
          type="number"
          class="amount-input"
          placeholder="Ex: 120"
          min="1"
          @focus="montantFocused = true"
          @blur="montantFocused = false"
        />
      </div>
      <button class="action-btn green" type="button" @click="handleDefinirMontant">
        Définir le montant cible
      </button>
      <div class="divider"><span>ou</span></div>
    </div>

    <!-- Prop1 : Cagnotte -->
    <div v-if="canProp1 && cagnotte && cagnotte.statut !== 'en_attente_evaluation'" class="prop-section">
      <button
        class="action-btn outline-green"
        type="button"
        @click="showContribForm = !showContribForm"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C10.34 2 9 3.34 9 5H4v2h1l1 12h12l1-12h1V5h-5c0-1.66-1.34-3-3-3z" stroke="currentColor" stroke-width="1.8" fill="none"/>
        </svg>
        Contribuer à la cagnotte
        <svg class="chevron" :class="{ open: showContribForm }" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <div v-if="showContribForm" class="contrib-form-wrap">
        <ContributionForm @submit="handleProp1" />
      </div>
    </div>

    <!-- Prop2 : Transport -->
    <div v-if="canProp2" class="prop-section">
      <button class="action-btn outline-blue" type="button" @click="handleProp2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          <circle cx="5.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="18.5" cy="18.5" r="2.5" stroke="currentColor" stroke-width="1.8"/>
        </svg>
        Proposer le transport
      </button>
    </div>

    <!-- Prop3 : Achat + Transport -->
    <div v-if="canProp3" class="prop-section">
      <button class="action-btn terra" type="button" @click="handleProp3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" stroke-width="1.8" stroke-linejoin="round"/>
          <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
        Acheter et transporter
      </button>
    </div>

    <!-- Feedback -->
    <div v-if="erreur" class="feedback erreur">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      {{ erreur }}
    </div>
    <div v-if="succes" class="feedback succes">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      {{ succes }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ContributionForm from './ContributionForm.vue'
import { usePropositionsStore } from '../stores/propositions.store'
import { useCagnotteStore } from '../stores/cagnotte.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { canTransition } from '../services/demandeStateMachine'
import type { Demande } from '../types/demande.types'
import type { Cagnotte } from '../types/cagnotte.types'

const props = defineProps<{ demande: Demande; cagnotte: Cagnotte | null }>()

const { currentUser } = useCurrentUser()
const propositionsStore = usePropositionsStore()
const cagnotteStore = useCagnotteStore()

const showContribForm = ref(false)
const montantCible = ref<number | undefined>(undefined)
const montantFocused = ref(false)
const erreur = ref('')
const succes = ref('')

const canProp1 = computed(() => canTransition(props.demande.statut, 'prop1_contribution'))
const canProp2 = computed(() => canTransition(props.demande.statut, 'prop2_transport'))
const canProp3 = computed(() => canTransition(props.demande.statut, 'prop3_achat_transport'))

async function handleDefinirMontant() {
  if (montantCible.value === undefined || montantCible.value <= 0) {
    erreur.value = 'Veuillez saisir un montant supérieur à 0.'; return
  }
  if (!props.cagnotte) return
  erreur.value = ''
  try {
    await cagnotteStore.definirMontantCible({ cagnotteId: props.cagnotte.id, montantCible: montantCible.value }, props.demande.id)
    succes.value = 'Montant cible défini.'
    montantCible.value = undefined
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
}

async function handleProp1(montant: number) {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({ demandeId: props.demande.id, aidantId: currentUser.value.id, aidantPrenom: currentUser.value.prenom, type: 'prop1_cagnotte', montantContribue: montant })
    succes.value = `Contribution de ${montant} € enregistrée.`
    showContribForm.value = false
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
}

async function handleProp2() {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({ demandeId: props.demande.id, aidantId: currentUser.value.id, aidantPrenom: currentUser.value.prenom, type: 'prop2_transport' })
    succes.value = 'Proposition de transport enregistrée.'
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
}

async function handleProp3() {
  if (!currentUser.value) return
  erreur.value = ''
  try {
    await propositionsStore.createProposition({ demandeId: props.demande.id, aidantId: currentUser.value.id, aidantPrenom: currentUser.value.prenom, type: 'prop3_achat_transport' })
    succes.value = 'Proposition achat + transport enregistrée.'
  } catch (e) { erreur.value = e instanceof Error ? e.message : 'Erreur' }
}
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
  color: #1A1510;
  margin-bottom: 14px;
  color: #C8521A;
}

/* ── Input montant ── */
.definir-section {
  margin-bottom: 12px;
}

.info-text {
  font-size: 0.84rem;
  color: #7A6E65;
  margin: 0 0 10px;
  line-height: 1.4;
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid #E8E1D9;
  border-radius: 10px;
  padding: 0 14px;
  height: 48px;
  background: #FAFAF8;
  margin-bottom: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.amount-input-wrap.focused {
  border-color: #1B8C5A;
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.12);
}

.euro-sym { font-size: 1.1rem; font-weight: 700; color: #1B8C5A; }

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1rem;
  font-weight: 600;
  color: #1A1510;
  font-family: inherit;
}

/* ── Divider ── */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0;
  font-size: 0.8rem;
  color: #C4B8AE;
}
.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #E8E1D9;
}

/* ── Sections prop ── */
.prop-section {
  margin-bottom: 10px;
}

.contrib-form-wrap {
  border-top: 1px solid #F0EDE8;
  margin-top: 4px;
  animation: tmFadeUp 0.25s ease both;
}

/* ── Boutons d'action ── */
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

.action-btn.green {
  background: #1B8C5A;
  color: white;
  box-shadow: 0 3px 12px rgba(27, 140, 90, 0.28);
}
.action-btn.green:hover { background: #146B45; }

.action-btn.outline-green {
  background: transparent;
  color: #1B8C5A;
  border: 1.5px solid #1B8C5A;
}
.action-btn.outline-green:hover { background: #E8F7F0; }

.action-btn.outline-blue {
  background: transparent;
  color: #2B7CC1;
  border: 1.5px solid #2B7CC1;
}
.action-btn.outline-blue:hover { background: #EAF3FB; }

.action-btn.terra {
  background: #C8521A;
  color: white;
  box-shadow: 0 3px 12px rgba(200, 82, 26, 0.28);
}
.action-btn.terra:hover { background: #A94517; }

.chevron { margin-left: auto; transition: transform 0.2s ease; }
.chevron.open { transform: rotate(180deg); }

/* ── Feedback ── */
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
