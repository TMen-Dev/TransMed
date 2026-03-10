// src/services/mock/data/messages.mock.ts

import type { Message } from '../../../types/message.types'

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-001',
    demandeId: 'demande-001',
    auteurId: 'aidant-ben',
    auteurPrenom: 'Benjamin',
    auteurRole: 'aidant',
    contenu: 'Bonjour Alice, je peux contribuer à la cagnotte. Quel est le montant total estimé ?',
    createdAt: '2026-01-19T09:15:00.000Z',
    isRead: true,
    readAt: '2026-01-19T09:20:00.000Z',
  },
  {
    id: 'msg-002',
    demandeId: 'demande-001',
    auteurId: 'patient-alice',
    auteurPrenom: 'Alice',
    auteurRole: 'patient',
    contenu: "Bonjour Benjamin ! L'acheteur doit évaluer le montant. Merci pour votre aide !",
    createdAt: '2026-01-19T09:45:00.000Z',
    isRead: true,
    readAt: '2026-01-19T10:00:00.000Z',
  },
  {
    id: 'msg-003',
    demandeId: 'demande-001',
    auteurId: 'aidant-leila',
    auteurPrenom: 'Leila',
    auteurRole: 'aidant',
    contenu: 'Je peux transporter les médicaments. Quelle est votre adresse exacte de livraison ?',
    createdAt: '2026-01-20T11:30:00.000Z',
    isRead: false,
    readAt: null,
  },
]
