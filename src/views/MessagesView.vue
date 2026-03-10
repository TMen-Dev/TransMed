<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Messages</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-pad">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="conversations.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="#1B8C5A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <p class="empty-title">Aucune conversation</p>
        <p class="empty-hint">Vos échanges avec les aidants ou patients apparaîtront ici.</p>
      </div>

      <ion-list v-else class="conv-list">
        <ion-item
          v-for="conv in conversations"
          :key="conv.demandeId"
          class="conv-item"
          button
          :detail="false"
          @click="ouvrirChat(conv.demandeId)"
        >
          <div class="conv-avatar" slot="start">
            <span>{{ conv.nomDemande[0]?.toUpperCase() }}</span>
          </div>

          <div class="conv-body">
            <div class="conv-header-row">
              <span class="conv-nom">{{ conv.nomDemande }}</span>
              <span class="conv-date">{{ formatDate(conv.lastMessageAt) }}</span>
            </div>
            <div class="conv-footer-row">
              <span class="conv-apercu">{{ conv.lastMessage }}</span>
              <span v-if="conv.unreadCount > 0" class="unread-badge" :class="conv.hasUrgent ? 'urgent' : ''">
                {{ conv.unreadCount }}
              </span>
            </div>
          </div>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem,
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

onMounted(async () => {
  await chargerConversations()
})

async function chargerConversations(): Promise<void> {
  const userId = authStore.currentUser?.id
  if (!userId) return

  loading.value = true
  try {
    // Récupérer les demandes de l'utilisateur
    const { data: demandes } = await supabase
      .from('demandes')
      .select('id, nom, urgente')
      .or(`patient_id.eq.${userId},acheteur_id.eq.${userId},transporteur_id.eq.${userId}`)

    if (!demandes?.length) {
      conversations.value = []
      return
    }

    const demandeIds = demandes.map((d) => d.id)

    // Pour chaque demande, récupérer le dernier message et le count non-lus
    // Triés par MAX(created_at) décroissant
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

        // Compter les non-lus pour cette demande
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
.loading-pad {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-row {
  height: 72px;
  background: linear-gradient(90deg, #ECE8E0 25%, #F5F1EB 50%, #ECE8E0 75%);
  background-size: 200% 100%;
  border-radius: 12px;
  animation: skeletonWave 1.6s ease-in-out infinite;
}

@keyframes skeletonWave {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

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

.conv-list {
  padding: 8px 0;
}

.conv-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --inner-padding-end: 0;
  --background: transparent;
  --border-color: #F0EDE8;
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #E8F7F0, #EAF3FB);
  border: 1.5px solid #C6EADA;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1B8C5A;
  margin-right: 12px;
  flex-shrink: 0;
}

.conv-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  min-width: 0;
}

.conv-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conv-nom {
  font-size: 0.92rem;
  font-weight: 700;
  color: #1A1510;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-date {
  font-size: 0.75rem;
  color: #9E8E85;
  white-space: nowrap;
  flex-shrink: 0;
}

.conv-footer-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.conv-apercu {
  font-size: 0.82rem;
  color: #7A6E65;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  background: #D68910;
  color: white;
  font-size: 0.72rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  flex-shrink: 0;
}

.unread-badge.urgent {
  background: #C0392B;
}
</style>
