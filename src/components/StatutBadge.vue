<template>
  <span
    class="statut-badge"
    :class="`statut-${statut}`"
  >
    <span class="badge-dot" />
    {{ libelle }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatutDemande } from '../types/demande.types'

const props = defineProps<{ statut: StatutDemande }>()

const LIBELLES: Record<StatutDemande, string> = {
  nouvelle_demande:                         'Nouvelle demande',
  medicaments_achetes_attente_transporteur:  'Médicaments achetés',
  transporteur_disponible_attente_acheteur:  'Transporteur disponible',
  transporteur_et_medicaments_prets:         'Prêt ✓',
  en_cours_livraison_transporteur:           'En transit',
  rdv_a_fixer:                               'RDV à fixer',
  en_cours_livraison_patient:                'En livraison',
  traitee:                                   'Traitée ✓',
}

const libelle = computed(() => LIBELLES[props.statut])
</script>

<style scoped>
.statut-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── A — Nouvelle demande ── */
.statut-nouvelle_demande {
  background: #F0EDE8;
  color: #6B5F58;
}
.statut-nouvelle_demande .badge-dot { background: #9E8E85; }

/* ── B — Médicaments achetés ── */
.statut-medicaments_achetes_attente_transporteur {
  background: #FEF9EC;
  color: #956208;
}
.statut-medicaments_achetes_attente_transporteur .badge-dot {
  background: #C9820A;
  animation: dotPulse 1.5s ease-in-out infinite;
}

/* ── C — Transporteur disponible ── */
.statut-transporteur_disponible_attente_acheteur {
  background: #EAF3FB;
  color: #1A5C96;
}
.statut-transporteur_disponible_attente_acheteur .badge-dot { background: #2B7CC1; }

/* ── D — Prêt ── */
.statut-transporteur_et_medicaments_prets {
  background: #E8F7F0;
  color: #146B45;
}
.statut-transporteur_et_medicaments_prets .badge-dot {
  background: #1B8C5A;
  animation: dotPulse 1.2s ease-in-out infinite;
}

/* ── E — En transit vers transporteur ── */
.statut-en_cours_livraison_transporteur {
  background: #FDF0E8;
  color: #A94517;
}
.statut-en_cours_livraison_transporteur .badge-dot {
  background: #C8521A;
  animation: dotPulse 1.3s ease-in-out infinite;
}

/* ── F — RDV à fixer ── */
.statut-rdv_a_fixer {
  background: #F3EDFB;
  color: #6B35A8;
}
.statut-rdv_a_fixer .badge-dot {
  background: #8B4CC8;
  animation: dotPulse 1.4s ease-in-out infinite;
}

/* ── G — En livraison patient ── */
.statut-en_cours_livraison_patient {
  background: #FEF9EC;
  color: #956208;
}
.statut-en_cours_livraison_patient .badge-dot {
  background: #C9820A;
  animation: dotPulse 1.5s ease-in-out infinite;
}

/* ── H — Traitée ── */
.statut-traitee {
  background: #E8F7F0;
  color: #146B45;
}
.statut-traitee .badge-dot { background: #1B8C5A; }

@keyframes dotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(1.3); }
}
</style>
