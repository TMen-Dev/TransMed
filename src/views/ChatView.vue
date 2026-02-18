<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :default-href="`/app/demandes/${demandeId}`" />
        </ion-buttons>
        <ion-title>Chat</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Chat messages container -->
      <div ref="messagesContainer" class="messages-container">
        <!-- État vide -->
        <div v-if="messages.length === 0 && !loading" class="empty-chat">
          <ion-icon :icon="chatbubblesOutline" size="large" color="medium" />
          <p>Aucun message pour le moment.</p>
          <p class="empty-hint">Posez votre première question !</p>
        </div>

        <MessageBubble
          v-for="message in messages"
          :key="message.id"
          :message="message"
        />
      </div>
    </ion-content>

    <!-- Footer avec input -->
    <ion-footer>
      <ion-toolbar class="chat-footer">
        <ion-input
          v-model="contenu"
          placeholder="Votre message..."
          class="chat-input"
          :maxlength="1000"
          @keyup.enter="envoyer"
        />
        <ion-buttons slot="end">
          <ion-button
            :disabled="!contenu.trim() || sending"
            color="primary"
            @click="envoyer"
          >
            <ion-spinner v-if="sending" name="crescent" />
            <ion-icon v-else :icon="sendOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
  IonBackButton, IonButtons, IonButton, IonIcon, IonInput, IonSpinner,
} from '@ionic/vue'
import { sendOutline, chatbubblesOutline } from 'ionicons/icons'
import MessageBubble from '../components/MessageBubble.vue'
import { useChat } from '../composables/useChat'
import { useCurrentUser } from '../composables/useCurrentUser'

const route = useRoute()
const demandeId = route.params.id as string
const { currentUser } = useCurrentUser()
const { messages, loading, fetchMessages, sendMessage, scrollToBottom } = useChat(demandeId)

const contenu = ref('')
const sending = ref(false)
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
.messages-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 8px 0 16px;
  overflow-y: auto;
}
.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 60px 24px;
  text-align: center;
  color: var(--ion-color-medium);
  gap: 8px;
}
.empty-hint {
  font-size: 0.85rem;
}
.chat-footer {
  --padding-start: 8px;
  --padding-end: 8px;
}
.chat-input {
  --padding-start: 12px;
  background: var(--ion-color-light);
  border-radius: 20px;
}
</style>
