<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>{{ titre }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div
        v-if="loading"
        class="loading-pad"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="skeleton-row"
        />
      </div>

      <div
        v-else-if="conversations.length === 0"
        class="empty-state"
      >
        <div class="empty-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
              stroke="#1B8C5A"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="empty-title">
          Aucune conversation
        </p>
        <p class="empty-hint">
          Vos échanges avec les aidants ou patients apparaîtront ici.
        </p>
      </div>

      <div
        v-else
        class="conv-list"
      >
        <div
          v-for="conv in conversations"
          :key="conv.demandeId"
          class="conv-card"
          :class="{ 'has-unread': conv.unreadCount > 0, 'is-urgent': conv.hasUrgent }"
          @click="ouvrirChat(conv.demandeId)"
        >
          <!-- Initiale de la demande -->
          <div class="conv-avatar">
            {{ conv.nomDemande[0]?.toUpperCase() }}
          </div>

          <div class="conv-body">
            <!-- Ligne 1 : nom + badge non-lus -->
            <div class="conv-top">
              <span
                class="conv-nom"
                :class="{ 'conv-nom--unread': conv.unreadCount > 0 }"
              >
                {{ conv.nomDemande }}
              </span>
              <span
                v-if="conv.unreadCount > 0"
                class="unread-badge"
                :class="{ urgent: conv.hasUrgent }"
              >
                {{ conv.unreadCount }}
              </span>
            </div>

            <!-- Ligne 2 : aperçu du message · heure -->
            <div class="conv-bottom">
              <span class="conv-apercu">{{ conv.lastMessage }}</span>
              <span class="conv-sep">·</span>
              <span class="conv-date">{{ formatDate(conv.lastMessageAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  onIonViewWillEnter,
} from '@ionic/vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth.store'

interface Conversation {
  demandeId: string
  nomDemande: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  hasUrgent: boolean
}

const router = useRouter()
const authStore = useAuthStore()
const conversations = ref<Conversation[]>([])
const loading = ref(true)

const titre = computed(() =>
  loading.value ? 'Discussions' : `Discussions (${conversations.value.length})`
)

// onIonViewWillEnter couvre le premier rendu ET les retours depuis le cache Ionic (pas besoin de onMounted)
onIonViewWillEnter(async () => {
  await chargerConversations()
})

// Realtime — rafraîchir silencieusement quand un nouveau message arrive (sans skeleton)
const channel = supabase
  .channel('messages-view-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
    void chargerConversations(true)
  })
  .subscribe()

onUnmounted(() => {
  channel.unsubscribe()
})

async function chargerConversations(silent = false): Promise<void> {
  const userId = authStore.currentUser?.id
  if (!userId) {
    loading.value = false
    return
  }

  if (!silent) loading.value = true
  try {
    // Récupérer les demandes assignées (patient / acheteur / transporteur)
    const { data: demandesAssignees } = await supabase
      .from('demandes')
      .select('id, nom, urgente')
      .or(`patient_id.eq.${userId},acheteur_id.eq.${userId},transporteur_id.eq.${userId}`)

    // Récupérer les demandes où l'utilisateur a participé via messages (aidant pré-assigné)
    const { data: msgParticipation } = await supabase
      .from('messages')
      .select('demande_id')
      .eq('auteur_id', userId)

    const extraIds = [...new Set((msgParticipation ?? []).map((m) => m.demande_id))]
    const assigneeIds = new Set((demandesAssignees ?? []).map((d) => d.id))
    const missingIds = extraIds.filter((id) => !assigneeIds.has(id))

    let demandesExtra: { id: string; nom: string; urgente: boolean }[] = []
    if (missingIds.length > 0) {
      const { data } = await supabase
        .from('demandes')
        .select('id, nom, urgente')
        .in('id', missingIds)
      demandesExtra = data ?? []
    }

    const demandes = [...(demandesAssignees ?? []), ...demandesExtra]

    if (!demandes.length) {
      conversations.value = []
      return
    }

    const demandeIds = demandes.map((d) => d.id)

    // Pour chaque demande, récupérer le dernier message et le count non-lus
    const { data: messages } = await supabase
      .from('messages')
      .select('demande_id, contenu, created_at, auteur_id, is_read')
      .in('demande_id', demandeIds)
      .order('created_at', { ascending: false })

    if (!messages?.length) {
      conversations.value = []
      return
    }

    // Grouper par demande et prendre le dernier message
    const convMap = new Map<string, Conversation>()

    for (const msg of messages) {
      if (!convMap.has(msg.demande_id)) {
        const demande = demandes.find((d) => d.id === msg.demande_id)
        if (!demande) continue

        const unreadCount = messages.filter(
          (m) => m.demande_id === msg.demande_id && m.auteur_id !== userId && !m.is_read
        ).length

        convMap.set(msg.demande_id, {
          demandeId: msg.demande_id,
          nomDemande: demande.nom,
          lastMessage: msg.contenu,
          lastMessageAt: msg.created_at,
          unreadCount,
          hasUrgent: demande.urgente && unreadCount > 0,
        })
      }
    }

    // Trier par date du dernier message décroissant
    conversations.value = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )
  } finally {
    loading.value = false
  }
}

function ouvrirChat(demandeId: string): void {
  router.push(`/app/demandes/${demandeId}/chat`)
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - date.getTime()) / 3600000
  if (diffH < 24) {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
</script>

<style scoped>
/* ── Skeleton ── */
.loading-pad {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-row {
  height: 68px;
  background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%);
  background-size: 200% 100%;
  border-radius: 14px;
  animation: skeletonWave 1.6s ease-in-out infinite;
}

@keyframes skeletonWave {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  gap: 10px;
  text-align: center;
}

.empty-icon {
  width: 72px;
  height: 72px;
  background: #E8F7F0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1A1510;
  margin: 0;
}

.empty-hint {
  font-size: 0.85rem;
  color: #7A6E65;
  margin: 0;
}

/* ── Liste ── */
.conv-list {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

/* ── Carte conversation ── */
.conv-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #FFFFFF;
  border-radius: 14px;
  padding: 13px 14px;
  /* Ombre + bordure subtile pour séparation claire des items */
  box-shadow: 0 1px 5px rgba(26, 21, 16, 0.07), 0 0 0 1px rgba(232, 225, 217, 0.6);
  cursor: pointer;
  position: relative;
  transition: transform 0.14s ease, box-shadow 0.14s ease;
  overflow: hidden;
}

.conv-card:active {
  transform: scale(0.988);
  box-shadow: 0 1px 2px rgba(26, 21, 16, 0.05), 0 0 0 1px rgba(232, 225, 217, 0.6);
}

/* Barre latérale gauche : indicateur message non-lu */
.conv-card.has-unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: #D68910;
}

.conv-card.is-urgent::before {
  background: #C0392B;
}

/* ── Avatar initiale ── */
.conv-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #D4F0E2, #D4E8F5);
  border: 1.5px solid #C0E8D4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: #1B8C5A;
  flex-shrink: 0;
}

/* ── Corps de la carte ── */
.conv-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Ligne 1 : nom de la demande + badge */
.conv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-nom {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3A3028;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-nom--unread {
  font-weight: 700;
  color: #1A1510;
}

/* Ligne 2 : aperçu du message · heure — sur une seule ligne */
.conv-bottom {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
}

.conv-apercu {
  font-size: 0.8rem;
  color: #7A6E65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.conv-sep {
  font-size: 0.78rem;
  color: #C4B8AE;
  flex-shrink: 0;
  padding: 0 5px;
}

.conv-date {
  font-size: 0.78rem;
  color: #9E8E85;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Badge non-lus ── */
.unread-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #D68910;
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  flex-shrink: 0;
}

.unread-badge.urgent {
  background: #C0392B;
}
</style>
