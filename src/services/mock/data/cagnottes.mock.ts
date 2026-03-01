// src/services/mock/data/cagnottes.mock.ts

import type { Cagnotte } from '../../../types/cagnotte.types'

export const MOCK_CAGNOTTES: Cagnotte[] = [
  // cagnotte-001 : demande-001 — transporteur_disponible, 45/120€ en cours
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

  // cagnotte-002 : demande-002 — attente_fonds_et_transporteur, 0€
  {
    id: 'cagnotte-002',
    demandeId: 'demande-002',
    montantCible: undefined,
    montantCollecte: 0,
    statut: 'en_attente_evaluation',
    contributions: [],
    createdAt: '2026-02-01T14:00:00.000Z',
  },

  // cagnotte-003 : demande-003 — Karim, attente, 0/90€
  {
    id: 'cagnotte-003',
    demandeId: 'demande-003',
    montantCible: 90,
    montantCollecte: 0,
    statut: 'en_attente_evaluation',
    contributions: [],
    createdAt: '2026-02-10T09:00:00.000Z',
  },

  // cagnotte-004 : demande-004 — fonds_atteints, 150/150€
  {
    id: 'cagnotte-004',
    demandeId: 'demande-004',
    montantCible: 150,
    montantCollecte: 150,
    statut: 'atteinte',
    contributions: [
      {
        id: 'contrib-002',
        cagnotteId: 'cagnotte-004',
        aidantId: 'aidant-ben',
        aidantPrenom: 'Benjamin',
        montant: 150,
        createdAt: '2026-02-12T11:00:00.000Z',
      },
    ],
    createdAt: '2026-02-11T10:00:00.000Z',
  },

  // cagnotte-005 : demande-005 — pret_acceptation_patient, 120/120€
  {
    id: 'cagnotte-005',
    demandeId: 'demande-005',
    montantCible: 120,
    montantCollecte: 120,
    statut: 'atteinte',
    contributions: [
      {
        id: 'contrib-003',
        cagnotteId: 'cagnotte-005',
        aidantId: 'aidant-ben',
        aidantPrenom: 'Benjamin',
        montant: 120,
        createdAt: '2026-02-15T14:00:00.000Z',
      },
    ],
    createdAt: '2026-02-14T09:00:00.000Z',
  },

  // cagnotte-006 : demande-006 — livraison_confirmee, 80/80€
  {
    id: 'cagnotte-006',
    demandeId: 'demande-006',
    montantCible: 80,
    montantCollecte: 80,
    statut: 'atteinte',
    contributions: [
      {
        id: 'contrib-004',
        cagnotteId: 'cagnotte-006',
        aidantId: 'aidant-ben',
        aidantPrenom: 'Benjamin',
        montant: 80,
        createdAt: '2026-02-18T10:00:00.000Z',
      },
    ],
    createdAt: '2026-02-17T08:00:00.000Z',
  },

  // cagnotte-007 : demande-007 — livree, 60/60€
  {
    id: 'cagnotte-007',
    demandeId: 'demande-007',
    montantCible: 60,
    montantCollecte: 60,
    statut: 'atteinte',
    contributions: [
      {
        id: 'contrib-005',
        cagnotteId: 'cagnotte-007',
        aidantId: 'aidant-leila',
        aidantPrenom: 'Leila',
        montant: 60,
        createdAt: '2026-02-20T10:00:00.000Z',
      },
    ],
    createdAt: '2026-02-19T11:00:00.000Z',
  },

  // cagnotte-008 : demande-008 — traitee, 100/100€
  {
    id: 'cagnotte-008',
    demandeId: 'demande-008',
    montantCible: 100,
    montantCollecte: 100,
    statut: 'atteinte',
    contributions: [
      {
        id: 'contrib-006',
        cagnotteId: 'cagnotte-008',
        aidantId: 'aidant-ben',
        aidantPrenom: 'Benjamin',
        montant: 100,
        createdAt: '2026-02-22T10:00:00.000Z',
      },
    ],
    createdAt: '2026-02-21T09:00:00.000Z',
  },
]
