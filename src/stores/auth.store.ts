// src/stores/auth.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Utilisateur } from '../types/user.types'

export const useAuthStore = defineStore('auth', () => {
  // Pas de persist en mode mock — spec: "aucune session persistante"
  const currentUser = ref<Utilisateur | null>(null)

  function setUser(user: Utilisateur) {
    currentUser.value = user
  }

  function logout() {
    currentUser.value = null
  }

  return { currentUser, setUser, logout }
})
