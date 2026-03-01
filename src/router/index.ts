// src/router/index.ts

import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth.store'
import { useDemandeStore } from '../stores/demandes.store'

// Flag module-level pour éviter la boucle de redirection post-login
let redirectionConfirmDone = false

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/inscription',
  },
  {
    path: '/inscription',
    component: () => import('../views/InscriptionView.vue'),
  },
  {
    path: '/app/',
    component: () => import('../views/TabsView.vue'),
    children: [
      {
        path: '',
        redirect: '/app/demandes',
      },
      {
        path: 'demandes',
        component: () => import('../views/ListeDemandesView.vue'),
      },
      {
        path: 'profil',
        component: () => import('../views/ProfilView.vue'),
      },
      {
        path: 'apropos',
        component: () => import('../views/AProposView.vue'),
      },
    ],
  },
  {
    path: '/app/demandes/:id',
    component: () => import('../views/DetailDemandeView.vue'),
  },
  {
    path: '/app/demandes/:id/chat',
    component: () => import('../views/ChatView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes,
})

// Gardes de navigation
router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.currentUser !== null

  // Non authentifié → toujours /inscription (reset le flag au logout)
  if (!isAuthenticated && to.path !== '/inscription') {
    redirectionConfirmDone = false
    return '/inscription'
  }
  // Déjà authentifié → évite retour sur /inscription
  if (isAuthenticated && to.path === '/inscription') {
    return '/app/demandes'
  }

  // FR-120 — redirection post-login : patient avec demande pret_acceptation_patient + emailNotifEnvoyee
  if (isAuthenticated && !redirectionConfirmDone && to.path === '/app/demandes') {
    redirectionConfirmDone = true // set avant l'async pour éviter les boucles
    const user = authStore.currentUser
    if (user?.role === 'patient') {
      const demandeStore = useDemandeStore()
      if (!demandeStore.demandes.length) await demandeStore.fetchForPatient(user.id)
      const demandeEnAttente = demandeStore.demandes.find(
        (d) => d.patientId === user.id &&
               d.statut === 'pret_acceptation_patient' &&
               d.emailNotifEnvoyee,
      )
      if (demandeEnAttente) return `/app/demandes/${demandeEnAttente.id}`
    }
  }
})

export default router
