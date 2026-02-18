// src/services/mock/data/propositions.mock.ts
// Les propositions sont embarquées dans les demandes mock (demandes.mock.ts).
// Ce fichier expose un tableau dédié pour les requêtes directes par demandeId.

import type { Proposition } from '../../../types/proposition.types'

export const MOCK_PROPOSITIONS: Proposition[] = [
  {
    id: 'prop-001',
    demandeId: 'demande-001',
    aidantId: 'aidant-ben',
    aidantPrenom: 'Benjamin',
    type: 'prop1_cagnotte',
    montantContribue: 45,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'prop-002',
    demandeId: 'demande-001',
    aidantId: 'aidant-leila',
    aidantPrenom: 'Leila',
    type: 'prop2_transport',
    createdAt: '2026-01-21T15:00:00.000Z',
  },
]
