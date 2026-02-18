// src/services/mock/data/users.mock.ts

import type { Utilisateur } from '../../../types/user.types'

export const MOCK_USERS: Utilisateur[] = [
  {
    id: 'patient-alice',
    prenom: 'Alice',
    role: 'patient',
    adresseDefaut: '5 rue des Lilas, Alger, Algérie',
    createdAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: 'patient-karim',
    prenom: 'Karim',
    role: 'patient',
    adresseDefaut: '12 boulevard Krim Belkacem, Oran, Algérie',
    createdAt: '2026-01-15T14:00:00.000Z',
  },
  {
    id: 'aidant-ben',
    prenom: 'Benjamin',
    role: 'aidant',
    createdAt: '2026-01-05T08:00:00.000Z',
  },
  {
    id: 'aidant-leila',
    prenom: 'Leila',
    role: 'aidant',
    createdAt: '2026-01-08T11:00:00.000Z',
  },
]
