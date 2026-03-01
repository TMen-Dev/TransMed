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
            <span>Chat</span>
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div
        ref="messagesContainer"
        class="messages-container"
      >
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
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonBackButton, IonButtons,
} from '@ionic/vue'
import MessageBubble from '../components/MessageBubble.vue'
import { useChat } from '../composables/useChat'
import { useCurrentUser } from '../composables/useCurrentUser'

const route = useRoute()
const demandeId = route.params.id as string
const { currentUser } = useCurrentUser()
const { messages, loading, fetchMessages, sendMessage, scrollToBottom } = useChat(demandeId)

const contenu = ref('')
const sending = ref(false)
const inputFocused = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

onMounted(async () => {
  await fetchMessages()
  await nextTick()
  scrollToBottom(messagesContainer)
})

watch(messages, async () => {
  await nextTick()
  scrollToBottom(messagesContainer)
})

async function envoyer() {
  if (!contenu.value.trim() || !currentUser.value) return
  sending.value = true
  try {
    await sendMessage({
      auteurId: currentUser.value.id,
      auteurPrenom: currentUser.value.prenom,
      auteurRole: currentUser.value.role,
      contenu: contenu.value.trim(),
    })
    contenu.value = ''
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
  gap: 7px;
}

.chat-dot {
  width: 8px;
  height: 8px;
  background: #1B8C5A;
  border-radius: 50%;
  animation: tmPulseRing 2s ease-in-out infinite;
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
