// src/composables/useCharteAidant.ts
// feature 009 — vérification charte aidant one-time

import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'
import { userService } from '../services/index'

export function useCharteAidant() {
  const authStore = useAuthStore()
  const showCharteModal = ref(false)
  let pendingAction: (() => void) | null = null

  const charteAcceptee = computed(() =>
    !!authStore.currentUser?.charteAcceptedAt
  )

  function verifierEtProceder(action: () => void): void {
    if (charteAcceptee.value) {
      action()
    } else {
      pendingAction = action
      showCharteModal.value = true
    }
  }

  async function accepterCharte(): Promise<void> {
    const userId = authStore.currentUser?.id
    if (!userId) return

    await userService.accepterCharte(userId)

    // Mettre à jour le store localement
    if (authStore.currentUser) {
      authStore.setUser({
        ...authStore.currentUser,
        charteAcceptedAt: new Date().toISOString(),
      })
    }

    showCharteModal.value = false

    // Exécuter l'action en attente
    if (pendingAction) {
      const action = pendingAction
      pendingAction = null
      action()
    }
  }

  function fermerCharte(): void {
    showCharteModal.value = false
    pendingAction = null
  }

  return {
    charteAcceptee,
    showCharteModal,
    verifierEtProceder,
    accepterCharte,
    fermerCharte,
  }
}
