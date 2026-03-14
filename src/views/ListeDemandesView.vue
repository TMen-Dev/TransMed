<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ isPatient ? 'Mes demandes' : 'Propositions actives' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ion-refresh="rafraichir($event)"
      >
        <ion-refresher-content />
      </ion-refresher>

      <!-- ── Filtre aidant (chips scrollables) ── -->
      <div
        v-if="!isPatient"
        class="filter-bar"
      >
        <div class="filter-scroll">
          <button
            v-for="f in FILTRES"
            :key="f.key"
            class="filter-chip"
            :class="{ 'filter-chip--active': filtreActif === f.key }"
            type="button"
            @click="filtreActif = f.key"
          >
            {{ f.label }}
            <span
              v-if="countParFiltre[f.key] > 0"
              class="chip-count"
            >{{ countParFiltre[f.key] }}</span>
          </button>
        </div>
      </div>

      <!-- Chargement -->
      <div
        v-if="demandeStore.loading"
        class="loading-state"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="skeleton-card"
        />
      </div>

      <!-- État vide -->
      <div
        v-else-if="listeDemandes.length === 0"
        class="empty-state"
      >
        <div class="empty-illustration">
          <svg
            width="72"
            height="72"
            viewBox="0 0 80 80"
            fill="none"
          >
            <circle
              cx="40"
              cy="40"
              r="38"
              fill="#E8F7F0"
              stroke="#C6EADA"
              stroke-width="2"
            />
            <path
              d="M28 26h24a2 2 0 012 2v24a2 2 0 01-2 2H28a2 2 0 01-2-2V28a2 2 0 012-2z"
              fill="white"
              stroke="#1B8C5A"
              stroke-width="2"
            />
            <path
              d="M32 36h16M32 41h10M32 46h6"
              stroke="#1B8C5A"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle
              cx="52"
              cy="28"
              r="8"
              fill="#FEF9EC"
              stroke="#C9820A"
              stroke-width="2"
            />
            <path
              d="M52 25v3l2 1"
              stroke="#C9820A"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <p class="empty-title">
          {{ isPatient ? 'Aucune demande' : 'Aucune demande' }}
        </p>
        <p class="empty-sub">
          {{ isPatient
            ? 'Créez votre première demande pour trouver des aidants.'
            : filtreActif === 'toutes' ? 'Les demandes de patients apparaîtront ici.' : 'Aucune demande pour ce filtre.' }}
        </p>
        <button
          v-if="isPatient"
          class="empty-cta"
          type="button"
          @click="ouvrirCreation"
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
          Créer ma première demande
        </button>
      </div>

      <!-- Liste -->
      <div
        v-else
        class="demandes-list"
      >
        <template
          v-for="(demande, idx) in listeDemandes"
          :key="demande.id"
        >
          <!-- Swipe-to-delete patient -->
          <ion-item-sliding v-if="isPatient && STATUTS_ANNULABLES.includes(demande.statut)">
            <ion-item
              lines="none"
              style="--padding-start:0;--inner-padding-end:0;--background:transparent;--min-height:0;"
            >
              <div style="width:100%">
                <div
                  v-if="STATUTS_ACTION_PATIENT.has(demande.statut)"
                  class="action-requise-badge"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="2.5"
                    />
                    <path
                      d="M12 8v4M12 16h.01"
                      stroke="currentColor"
                      stroke-width="2.5"
                      stroke-linecap="round"
                    />
                  </svg>
                  Action requise
                </div>
                <DemandeCard
                  :demande="demande"
                  :style="{ animationDelay: `${idx * 60}ms` }"
                  @click="naviguerVersDetail(demande.id)"
                />
              </div>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option
                color="danger"
                @click.stop="confirmerSuppression(demande.id)"
              >
                <svg
                  slot="top"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                Supprimer
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>

          <!-- Carte standard -->
          <div
            v-else
            class="demande-item-wrap"
          >
            <div
              v-if="isPatient && STATUTS_ACTION_PATIENT.has(demande.statut)"
              class="action-requise-badge"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="2.5"
                />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                />
              </svg>
              Action requise
            </div>
            <DemandeCard
              :demande="demande"
              :style="{ animationDelay: `${idx * 60}ms` }"
              @click="naviguerVersDetail(demande.id)"
            />
          </div>
        </template>
      </div>

      <!-- FAB Patient -->
      <ion-fab
        v-if="isPatient"
        slot="fixed"
        vertical="bottom"
        horizontal="end"
      >
        <ion-fab-button @click="ouvrirCreation">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 5v14M5 12h14"
              stroke="white"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonFab, IonFabButton, IonRefresher, IonRefresherContent,
  IonItemSliding, IonItem, IonItemOptions, IonItemOption,
  modalController, alertController, toastController,
  onIonViewWillEnter,
} from '@ionic/vue'
import DemandeCard from '../components/DemandeCard.vue'
import CreationDemandeView from './CreationDemandeView.vue'
import { useDemandeStore, STATUTS_ACTIFS_AIDANT } from '../stores/demandes.store'
import { useCurrentUser } from '../composables/useCurrentUser'
import { STATUTS_ANNULABLES } from '../types/demande.types'
import { supabase } from '../lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

const router = useRouter()
const demandeStore = useDemandeStore()
const { isPatient, currentUser } = useCurrentUser()

const STATUTS_ACTION_PATIENT = new Set(['rdv_a_fixer', 'en_cours_livraison_patient'])

// ── Filtres aidant ──────────────────────────────────────────────────────────
type FiltreKey = 'toutes' | 'nouvelles' | 'en_cours' | 'engagements' | 'traitees'

const FILTRES: { key: FiltreKey; label: string }[] = [
  { key: 'toutes',       label: 'Toutes' },
  { key: 'nouvelles',    label: 'Nouvelles' },
  { key: 'en_cours',     label: 'En cours' },
  { key: 'engagements',  label: 'Mes engagements' },
  { key: 'traitees',     label: 'Traitées' },
]

const filtreActif = ref<FiltreKey>('toutes')

// ── Helpers ─────────────────────────────────────────────────────────────────

function estImplique(d: (typeof demandeStore.demandes)[0], uid: string): boolean {
  return d.acheteurId === uid ||
    d.transporteurId === uid ||
    d.propositions.some((p) => p.aidantId === uid)
}

// ── Liste calculée ──────────────────────────────────────────────────────────

const listeDemandes = computed(() => {
  if (isPatient.value) {
    return [...demandeStore.demandes].sort((a, b) => {
      const aPriority = STATUTS_ACTION_PATIENT.has(a.statut) ? 0 : 1
      const bPriority = STATUTS_ACTION_PATIENT.has(b.statut) ? 0 : 1
      if (aPriority !== bPriority) return aPriority - bPriority
      return b.createdAt.localeCompare(a.createdAt)
    })
  }

  const uid = currentUser.value?.id
  if (!uid) return []

  const base = demandeStore.demandes.filter((d) => {
    // Toujours visible : demandes ouvertes (tout aidant)
    if (STATUTS_ACTIFS_AIDANT.includes(d.statut)) return true
    // Toujours visible : demandes où l'aidant est impliqué (tous statuts)
    if (estImplique(d, uid)) return true
    return false
  })

  const sorted = [...base].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  switch (filtreActif.value) {
    case 'nouvelles':
      return sorted.filter((d) => d.statut === 'nouvelle_demande')
    case 'en_cours':
      return sorted.filter((d) =>
        STATUTS_ACTIFS_AIDANT.includes(d.statut) ||
        (estImplique(d, uid) && d.statut !== 'traitee')
      )
    case 'engagements':
      return sorted.filter((d) =>
        d.statut !== 'traitee' && (d.acheteurId === uid || d.transporteurId === uid)
      )
    case 'traitees':
      return sorted.filter((d) => d.statut === 'traitee' && estImplique(d, uid))
    default: // 'toutes'
      return sorted
  }
})

// Compteurs par filtre (pour les badges sur les chips)
const countParFiltre = computed<Record<FiltreKey, number>>(() => {
  const uid = currentUser.value?.id
  if (!uid || isPatient.value) return { toutes: 0, nouvelles: 0, en_cours: 0, engagements: 0, traitees: 0 }
  const all = demandeStore.demandes.filter((d) =>
    STATUTS_ACTIFS_AIDANT.includes(d.statut) || estImplique(d, uid)
  )
  return {
    toutes:      all.length,
    nouvelles:   all.filter((d) => d.statut === 'nouvelle_demande').length,
    en_cours:    all.filter((d) => STATUTS_ACTIFS_AIDANT.includes(d.statut) || (estImplique(d, uid) && d.statut !== 'traitee')).length,
    engagements: all.filter((d) => d.statut !== 'traitee' && (d.acheteurId === uid || d.transporteurId === uid)).length,
    traitees:    all.filter((d) => d.statut === 'traitee' && estImplique(d, uid)).length,
  }
})

// ── Data fetching ───────────────────────────────────────────────────────────

onIonViewWillEnter(async () => {
  if (isPatient.value && currentUser.value) {
    await demandeStore.fetchForPatient(currentUser.value.id)
  } else {
    await demandeStore.fetchAll()
  }
})

// Realtime : mise à jour automatique sans navigation
let realtimeChannel: RealtimeChannel | null = null

if (!isPatient.value) {
  realtimeChannel = supabase
    .channel('liste-demandes-aidant')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'demandes' },
      async () => { await demandeStore.fetchAll() }
    )
    .subscribe()
}

onUnmounted(() => { realtimeChannel?.unsubscribe() })

async function rafraichir(event: CustomEvent) {
  if (isPatient.value && currentUser.value) {
    await demandeStore.fetchForPatient(currentUser.value.id)
  } else {
    await demandeStore.fetchAll()
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (event.target as any).complete()
}

// ── Navigation / actions ────────────────────────────────────────────────────

async function ouvrirCreation() {
  const modal = await modalController.create({ component: CreationDemandeView })
  await modal.present()
}

function naviguerVersDetail(id: string) { router.push(`/app/demandes/${id}`) }

async function confirmerSuppression(id: string) {
  const alert = await alertController.create({
    header: 'Supprimer la demande',
    message: 'Cette action est irréversible. La demande et toutes ses données seront supprimées.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      {
        text: 'Supprimer',
        role: 'destructive',
        cssClass: 'alert-btn-danger',
        handler: async () => {
          try {
            await demandeStore.supprimerDemande(id)
            const toast = await toastController.create({ message: 'Demande supprimée.', color: 'success', duration: 3000, position: 'bottom' })
            await toast.present()
          } catch (e) {
            const toast = await toastController.create({ message: e instanceof Error ? e.message : 'Erreur lors de la suppression', color: 'danger', duration: 4000, position: 'bottom' })
            await toast.present()
          }
        },
      },
    ],
  })
  await alert.present()
}
</script>

<style scoped>
/* ── Filtre chips ── */
.filter-bar {
  padding: 10px 0 4px;
  border-bottom: 1px solid #F0EDE8;
  background: #FFFFFF;
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-scroll {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  overflow-x: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filter-scroll::-webkit-scrollbar { display: none; }

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 100px;
  border: 1.5px solid #E8E1D9;
  background: #F7F3ED;
  color: #7A6E65;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s, transform 0.1s;
}
.filter-chip:active { transform: scale(0.96); }

.filter-chip--active {
  background: #1B8C5A;
  color: #FFFFFF;
  border-color: #1B8C5A;
  box-shadow: 0 2px 8px rgba(27, 140, 90, 0.3);
}

.chip-count {
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(255,255,255,0.25);
  border-radius: 10px;
  padding: 1px 6px;
  line-height: 1.4;
}
.filter-chip:not(.filter-chip--active) .chip-count {
  background: #E8E1D9;
  color: #7A6E65;
}

/* ── Loading skeletons ── */
.loading-state { padding: 12px 16px; display: flex; flex-direction: column; gap: 10px; }

.skeleton-card {
  height: 82px;
  background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%);
  background-size: 200% 100%;
  border-radius: 14px;
  animation: skeletonWave 1.6s ease-in-out infinite;
}
.skeleton-card:nth-child(2) { animation-delay: 0.2s; }
.skeleton-card:nth-child(3) { animation-delay: 0.4s; }

@keyframes skeletonWave {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── État vide ── */
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 62vh; padding: 32px 24px; text-align: center; gap: 10px;
  animation: tmFadeUp 0.4s ease both;
}
.empty-illustration { animation: tmFloat 3.5s ease-in-out infinite; margin-bottom: 8px; }
.empty-title { font-size: 1.05rem; font-weight: 700; color: #1A1510; margin: 0; }
.empty-sub { font-size: 0.88rem; color: #7A6E65; margin: 0; max-width: 260px; line-height: 1.5; }

.empty-cta {
  display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 12px 22px;
  background: #1B8C5A; color: white; border: none; border-radius: 100px;
  font-size: 0.9rem; font-weight: 600; font-family: inherit; cursor: pointer;
  box-shadow: 0 4px 16px rgba(27, 140, 90, 0.35); transition: background 0.18s, transform 0.14s;
}
.empty-cta:hover { background: #146B45; }
.empty-cta:active { transform: scale(0.97); }

/* ── Liste ── */
.demandes-list { padding: 8px 0 100px; }

.demande-item-wrap { position: relative; }

.action-requise-badge {
  display: inline-flex; align-items: center; gap: 5px;
  margin: 8px 16px 0; padding: 5px 12px;
  background: #FDF0E8; border: 1px solid #E8C4A8; border-radius: 20px;
  font-size: 0.78rem; font-weight: 700; color: #C8521A;
  text-transform: uppercase; letter-spacing: 0.3px;
  animation: tmPop 0.3s ease both;
}
</style>
