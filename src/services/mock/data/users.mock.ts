// src/services/mock/data/users.mock.ts

import type { Utilisateur } from '../../../types/user.types'

export interface MockCredential {
  email: string
  password: string // en clair — MVP uniquement, aucune vraie sécurité
  userId: string
}

export const MOCK_CREDENTIALS: MockCredential[] = [
  { email: 'alice@transmed.fr',    password: 'test1234', userId: 'patient-alice' },
  { email: 'karim@transmed.fr',    password: 'test1234', userId: 'patient-karim' },
  { email: 'benjamin@transmed.fr', password: 'test1234', userId: 'aidant-ben' },
  { email: 'leila@transmed.fr',    password: 'test1234', userId: 'aidant-leila' },
]

export const MOCK_USERS: Utilisateur[] = [
  {
    id: 'patient-alice',
    prenom: 'Alice',
    role: 'patient',
    email: 'alice@transmed.fr',
    adresseDefaut: '5 rue des Lilas, Alger, Algérie',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'patient-karim',
    prenom: 'Karim',
    role: 'patient',
    email: 'karim@transmed.fr',
    adresseDefaut: '12 boulevard Krim Belkacem, Oran, Algérie',
    createdAt: '2026-01-15T14:00:00.000Z',
  },
  {
    id: 'aidant-ben',
    prenom: 'Benjamin',
    role: 'aidant',
    email: 'benjamin@transmed.fr',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'aidant-leila',
    prenom: 'Leila',
    role: 'aidant',
    email: 'leila@transmed.fr',
    createdAt: '2026-01-08T11:00:00.000Z',
  },
]
