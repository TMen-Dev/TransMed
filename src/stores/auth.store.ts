// src/stores/auth.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Utilisateur } from '../types/user.types'
import { userService } from '../services/index'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<Utilisateur | null>(null)

  async function initSession(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      try {
        currentUser.value = await userService.getById(session.user.id)
        // feature 009 — mise à jour last_seen à chaque démarrage de session
        void userService.mettreAJourLastSeen(session.user.id)
      } catch {
        currentUser.value = null
      }
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        currentUser.value = null
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.user) {
        try {
          currentUser.value = await userService.getById(session.user.id)
        } catch {
          currentUser.value = null
        }
      }
    })
  }

  async function login(email: string, password: string): Promise<void> {
    const utilisateur = await userService.authenticate(email, password)
    currentUser.value = utilisateur
  }

  async function register(
    prenom: string,
    role: 'patient' | 'aidant',
    email: string,
    password: string
  ): Promise<void> {
    const utilisateur = await userService.create({ prenom, role, email, password })
    currentUser.value = utilisateur
  }

  function setUser(user: Utilisateur) {
    currentUser.value = user
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut()
    currentUser.value = null
  }

  return { currentUser, initSession, login, register, setUser, logout }
})
