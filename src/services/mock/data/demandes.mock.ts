// src/services/mock/data/demandes.mock.ts

import type { Demande } from '../../../types/demande.types'

export const MOCK_DEMANDES: Demande[] = [
  {
    id: 'demande-001',
    patientId: 'patient-alice',
    patientPrenom: 'Alice',
    medicaments: [
      { nom: 'Doliprane 1000mg', quantite: 2 },
      { nom: 'Amoxicilline 500mg', quantite: 1 },
    ],
    adresseLivraison: '5 rue des Lilas, Alger, Algérie',
    statut: 'transporteur_disponible',
    ordonanceId: 'ordonance-001',
    cagnotteId: 'cagnotte-001',
    propositions: [
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
    ],
    transporteurId: 'aidant-leila',
    transporteurPrenom: 'Leila',
    createdAt: '2026-01-18T08:00:00.000Z',
    updatedAt: '2026-01-21T15:00:00.000Z',
  },
  {
    id: 'demande-002',
    patientId: 'patient-alice',
    patientPrenom: 'Alice',
    medicaments: [{ nom: 'Metformine 850mg', quantite: 3 }],
    adresseLivraison: '5 rue des Lilas, Alger, Algérie',
    statut: 'attente_fonds_et_transporteur',
    ordonanceId: 'ordonance-002',
    cagnotteId: 'cagnotte-002',
    propositions: [],
    createdAt: '2026-02-01T14:00:00.000Z',
    updatedAt: '2026-02-01T14:00:00.000Z',
  },
]
