// src/router/index.ts

import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore, sessionReadyPromise } from '../stores/auth.store'
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
      {
        path: 'messages',
        component: () => import('../views/MessagesView.vue'),
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
  await sessionReadyPromise
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
      try {
        const demandeStore = useDemandeStore()
        if (!demandeStore.demandes.length) await demandeStore.fetchForPatient(user.id)
        const STATUTS_ACTION_PATIENT = ['rdv_a_fixer', 'en_cours_livraison_patient'] as const
        const demandeEnAttente = demandeStore.demandes.find(
          (d) => d.patientId === user.id &&
                 STATUTS_ACTION_PATIENT.includes(d.statut as typeof STATUTS_ACTION_PATIENT[number]) &&
                 d.emailNotifEnvoyee,
        )
        if (demandeEnAttente) return `/app/demandes/${demandeEnAttente.id}`
      } catch {
        // Non bloquant — si le fetch échoue, on laisse passer vers /app/demandes
      }
    }
  }
})

export default router
