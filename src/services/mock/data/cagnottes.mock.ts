// src/services/mock/data/cagnottes.mock.ts

import type { Cagnotte } from '../../../types/cagnotte.types'

export const MOCK_CAGNOTTES: Cagnotte[] = [
  {
    id: 'cagnotte-001',
    demandeId: 'demande-001',
    montantCible: 120,
    montantCollecte: 45,
    statut: 'ouverte',
    contributions: [
      {
        id: 'contrib-001',
        cagnotteId: 'cagnotte-001',
        aidantId: 'aidant-ben',
        aidantPrenom: 'Benjamin',
        montant: 45,
        createdAt: '2026-01-20T10:00:00.000Z',
      },
    ],
    createdAt: '2026-01-18T08:00:00.000Z',
  },
  {
    id: 'cagnotte-002',
    demandeId: 'demande-002',
    montantCible: undefined,
    montantCollecte: 0,
    statut: 'en_attente_evaluation',
    contributions: [],
    createdAt: '2026-02-01T14:00:00.000Z',
  },
]
