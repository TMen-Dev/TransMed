<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <!-- FR-107 ✓ — bouton retour haut gauche, style uniforme via App.vue ion-back-button -->
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/app/demandes/${demandeId}`" />
        </ion-buttons>
        <ion-title>
          <div class="chat-title">
            <div class="chat-dot" />
            <div class="chat-title-text">
              <span class="chat-nom-demande">{{ demandeNom }}</span>
              <span class="chat-sous-titre">Discussion en cours</span>
            </div>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      ref="ionContentRef"
      :fullscreen="true"
    >
      <div class="messages-container">
        <!-- État vide -->
        <div
          v-if="messages.length === 0 && !loading"
          class="empty-chat"
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
            Aucun message
          </p>
          <p class="empty-hint">
            Posez votre première question !
          </p>
        </div>

        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>
    </ion-content>

    <!-- Footer input ── -->
    <ion-footer>
      <!-- T035 — suggestions de messages rapides (visibles si chat vide) -->
      <QuickReplies
        v-if="currentUser"
        :role="currentUser.role"
        :visible="showSuggestions"
        @select="onSuggestionSelected"
      />
      <div class="chat-footer">
        <div
          class="input-wrap"
          :class="{ focused: inputFocused }"
        >
          <input
            v-model="contenu"
            type="text"
            class="chat-input"
            placeholder="Votre message…"
            :maxlength="1000"
            @focus="inputFocused = true"
            @blur="inputFocused = false"
            @keyup.enter="envoyer"
          >
        </div>
        <button
          class="send-btn"
          :class="{ active: contenu.trim() && !sending }"
          :disabled="!contenu.trim() || sending"
          type="button"
          @click="envoyer"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
      </div>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonBackButton, IonButtons, toastController, onIonViewWillEnter,
} from '@ionic/vue'
import MessageBubble from '../components/MessageBubble.vue'
import QuickReplies from '../components/QuickReplies.vue'
import { useChat } from '../composables/useChat'
import { useCurrentUser } from '../composables/useCurrentUser'
import { useChatStore } from '../stores/chat.store'
import { useDemandeStore } from '../stores/demandes.store'

const route = useRoute()
const demandeId = route.params.id as string
const { currentUser } = useCurrentUser()
const { messages, loading, fetchMessages, sendMessage } = useChat(demandeId)
const chatStore = useChatStore()
const demandeStore = useDemandeStore()

const demandeNom = computed(() => demandeStore.getById(demandeId)?.nom ?? 'Chat')

const contenu = ref('')
const sending = ref(false)
const inputFocused = ref(false)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ionContentRef = ref<any>(null)
const hasSentMessage = ref(false)

function scrollToBottom(): void {
  // ion-content gère le scroll via son shadow DOM — scrollToBottom(0) = instantané sans animation
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  void ionContentRef.value?.$el?.scrollToBottom(0)
}

// T035 — suggestions visibles uniquement si chat vide et aucun message envoyé
const showSuggestions = computed(() => messages.value.length === 0 && !hasSentMessage.value)

function onSuggestionSelected(texte: string): void {
  contenu.value = texte
}

onMounted(async () => {
  await fetchMessages()
  await nextTick()
  scrollToBottom()
})

// T018 — marquer les messages comme lus à chaque fois que la vue devient active
// onIonViewWillEnter couvre le premier rendu ET les retours depuis le cache Ionic
onIonViewWillEnter(() => {
  if (currentUser.value) {
    void chatStore.markAsRead(demandeId, currentUser.value.id)
  }
})

watch(messages, async () => {
  await nextTick()
  scrollToBottom()
})

async function envoyer() {
  if (!contenu.value.trim() || !currentUser.value) return
  sending.value = true
  const texte = contenu.value.trim()
  try {
    await sendMessage({
      auteurId: currentUser.value.id,
      auteurPrenom: currentUser.value.prenom,
      auteurRole: currentUser.value.role,
      contenu: texte,
    })
    contenu.value = ''
    hasSentMessage.value = true
  } catch {
    const toast = await toastController.create({
      message: 'Impossible d\'envoyer le message. Réessayez.',
      duration: 3000,
      color: 'danger',
      position: 'bottom',
    })
    await toast.present()
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
/* ── Titre ── */
.chat-title {
  display: flex;
  align-items: center;
  gap: 9px;
}

.chat-dot {
  width: 9px;
  height: 9px;
  background: #1B8C5A;
  border-radius: 50%;
  flex-shrink: 0;
  animation: tmPulseRing 2s ease-in-out infinite;
}

.chat-title-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.chat-nom-demande {
  font-size: 0.95rem;
  font-weight: 700;
  color: #1A1510;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 220px;
}

.chat-sous-titre {
  font-size: 0.68rem;
  color: #1B8C5A;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

/* ── Messages ── */
.messages-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 12px 0 24px;
  background-image: radial-gradient(#E8E1D9 1px, transparent 1px);
  background-size: 24px 24px;
  background-color: #F7F3ED;
}

/* ── État vide ── */
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 80px 24px;
  text-align: center;
  gap: 10px;
  animation: tmFadeUp 0.4s ease both;
}

.empty-icon {
  width: 72px;
  height: 72px;
  background: #E8F7F0;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: tmFloat 3s ease-in-out infinite;
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

/* ── Footer ── */
.chat-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  background: #FFFFFF;
  border-top: 1px solid #E8E1D9;
}

.input-wrap {
  flex: 1;
  border: 1.5px solid #E8E1D9;
  border-radius: 22px;
  background: #F7F3ED;
  transition: border-color 0.2s, box-shadow 0.2s;
  overflow: hidden;
}

.input-wrap.focused {
  border-color: #1B8C5A;
  background: #FFFFFF;
  box-shadow: 0 0 0 3px rgba(27, 140, 90, 0.1);
}

.chat-input {
  width: 100%;
  padding: 11px 16px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.93rem;
  font-family: inherit;
  color: #1A1510;
}

.chat-input::placeholder { color: #C4B8AE; }

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: #E8E1D9;
  color: #9E8E85;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s, transform 0.14s, box-shadow 0.2s;
}

.send-btn.active {
  background: #1B8C5A;
  color: white;
  box-shadow: 0 3px 12px rgba(27, 140, 90, 0.35);
}

.send-btn.active:hover { background: #146B45; }
.send-btn.active:active { transform: scale(0.93); }
</style>
