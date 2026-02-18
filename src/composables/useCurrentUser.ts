// src/composables/useCurrentUser.ts

import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.store'

export function useCurrentUser() {
  const authStore = useAuthStore()

  const currentUser = computed(() => authStore.currentUser)
  const isPatient = computed(() => authStore.currentUser?.role === 'patient')
  const isAidant = computed(() => authStore.currentUser?.role === 'aidant')
  const isLoggedIn = computed(() => authStore.currentUser !== null)

  return { currentUser, isPatient, isAidant, isLoggedIn }
}
