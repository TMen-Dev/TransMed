// src/router/index.ts

import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'

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

export default router
