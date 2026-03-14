// src/stores/auth.store.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Utilisateur } from '../types/user.types'
import { userService } from '../services/index'
import { supabase } from '../lib/supabase'

// Promesse résolue quand initSession() a terminé — utilisée par le guard de navigation
let _sessionReadyResolve!: () => void
export const sessionReadyPromise = new Promise<void>(resolve => { _sessionReadyResolve = resolve })

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

    _sessionReadyResolve()

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        currentUser.value = null
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session.user) {
        try {
          const fetched = await userService.getById(session.user.id)
          // Ne pas écraser un currentUser déjà complet (prenom renseigné) avec des données
          // incomplètes issues du trigger — race condition possible après verifyOtp()
          if (!currentUser.value?.prenom || fetched.prenom) {
            currentUser.value = fetched
          }
        } catch {
          // Si le profil n'est pas encore prêt, ne pas nullifier — conserver l'état actuel
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

  async function verifyEmailAndComplete(
    email: string,
    token: string,
    prenom: string,
    role: 'patient' | 'aidant'
  ): Promise<void> {
    const utilisateur = await userService.verifyOtpAndComplete(email, token, prenom, role)
    currentUser.value = utilisateur
  }

  function setUser(user: Utilisateur) {
    currentUser.value = user
  }

  async function logout(): Promise<void> {
    // Effacer l'état local AVANT signOut pour que le guard de navigation
    // voie immédiatement un utilisateur déconnecté (évite la race condition TOKEN_REFRESHED)
    currentUser.value = null
    try {
      await supabase.auth.signOut()
    } catch {
      // signOut peut échouer si la session est déjà expirée — on est déjà déconnecté localement
    }
  }

  return { currentUser, initSession, login, register, verifyEmailAndComplete, setUser, logout }
})
