// src/services/mock/data/propositions.mock.ts
// Les propositions sont embarquées dans les demandes mock (demandes.mock.ts).
// Ce fichier expose un tableau dédié pour les requêtes directes par demandeId.

import type { Proposition } from '../../../types/proposition.types'

export const MOCK_PROPOSITIONS: Proposition[] = [
  {
    id: 'prop-001',
    demandeId: 'demande-003',
    aidantId: 'aidant-ben',
    aidantPrenom: 'Benjamin',
    type: 'prop_achat_envoi',
    createdAt: '2026-02-10T09:00:00.000Z',
  },
  {
    id: 'prop-002',
    demandeId: 'demande-004',
    aidantId: 'aidant-ben',
    aidantPrenom: 'Benjamin',
    type: 'prop_achat_transport',
    createdAt: '2026-02-12T11:00:00.000Z',
  },
  {
    id: 'prop-003',
    demandeId: 'demande-005',
    aidantId: 'aidant-ben',
    aidantPrenom: 'Benjamin',
    type: 'prop_achat_envoi',
    createdAt: '2026-02-15T14:00:00.000Z',
  },
  {
    id: 'prop-004',
    demandeId: 'demande-005',
    aidantId: 'aidant-leila',
    aidantPrenom: 'Leila',
    type: 'prop_transport',
    createdAt: '2026-02-15T15:00:00.000Z',
  },
]
