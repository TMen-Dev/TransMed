<template>
  <div class="contribution-form">
    <label class="field-label">Votre contribution (€)</label>
    <div class="amount-input-wrap" :class="{ focused: isFocused }">
      <span class="euro-symbol">€</span>
      <input
        v-model.number="montant"
        type="number"
        class="amount-input"
        placeholder="0"
        min="1"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
    </div>
    <div v-if="erreur" class="erreur-msg">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      {{ erreur }}
    </div>
    <button class="contrib-btn" type="button" @click="soumettre">
      Contribuer à la cagnotte
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M12 5l7 7-7 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ (e: 'submit', montant: number): void }>()

const montant = ref<number | undefined>(undefined)
const erreur = ref('')
const isFocused = ref(false)

function soumettre() {
  if (montant.value === undefined || montant.value <= 0) {
    erreur.value = 'Veuillez saisir un montant supérieur à 0.'
    return
  }
  erreur.value = ''
  emit('submit', montant.value)
  montant.value = undefined
}
</script>

<style scoped>
.contribution-form {
  padding: 12px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: tmFadeUp 0.3s ease both;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: #7A6E65;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.amount-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1.5px solid #E8E1D9;
  border-radius: 10px;
  padding: 0 14px;
  height: 52px;
  background: #FAFAF8;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.amount-input-wrap.focused {
  border-color: #1B8C5A;
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.12);
  background: #FFFFFF;
}

.euro-symbol {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1B8C5A;
}

.amount-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1A1510;
  font-family: inherit;
}

.amount-input::placeholder {
  color: #C4B8AE;
  font-weight: 400;
}

.erreur-msg {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #C0392B;
  font-size: 0.82rem;
  background: #FDEDEC;
  border-radius: 8px;
  padding: 8px 12px;
  animation: tmShake 0.4s ease;
}

.contrib-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 48px;
  background: #1B8C5A;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  font-size: 0.92rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.18s, transform 0.14s;
  box-shadow: 0 3px 14px rgba(27, 140, 90, 0.32);
}

.contrib-btn:hover { background: #146B45; }
.contrib-btn:active { transform: scale(0.97); }
</style>
