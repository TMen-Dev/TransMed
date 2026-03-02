// src/services/mock/MockOrdonanceService.ts

import type { IOrdonanceService } from '../interfaces/IOrdonanceService'
import type { Ordonance, MimeTypeOrdonance } from '../../types/ordonance.types'

const SUPPORTED_MIME_TYPES: MimeTypeOrdonance[] = ['image/jpeg', 'image/png', 'application/pdf']

export class MockOrdonanceService implements IOrdonanceService {
  /** Stockage en mémoire — Map<demandeId, Ordonance> */
  private store = new Map<string, Ordonance>()

  constructor() {
    // Données mock initiales (base64 minimal valide pour les tests visuels)
    const mockBase64 =
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKwAB/9k='
    this.store.set('demande-001', {
      id: 'ordonance-001',
      demandeId: 'demande-001',
      storagePath: '',
      base64Data: mockBase64,
      mimeType: 'image/jpeg',
      createdAt: '2026-01-18T08:00:00.000Z',
    })
    this.store.set('demande-002', {
      id: 'ordonance-002',
      demandeId: 'demande-002',
      storagePath: '',
      base64Data: mockBase64,
      mimeType: 'image/jpeg',
      createdAt: '2026-02-01T14:00:00.000Z',
    })
  }

  async upload(
    demandeId: string,
    base64Data: string,
    mimeType: MimeTypeOrdonance
  ): Promise<Ordonance> {
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Format non supporté : ${mimeType}. Acceptés : JPG, PNG, PDF.`)
    }
    const ordonance: Ordonance = {
      id: `ordonance-${crypto.randomUUID()}`,
      demandeId,
      storagePath: '',
      base64Data,
      mimeType,
      createdAt: new Date().toISOString(),
    }
    this.store.set(demandeId, ordonance)
    return { ...ordonance }
  }

  async getByDemandeId(demandeId: string): Promise<Ordonance> {
    const ordonance = this.store.get(demandeId)
    if (!ordonance) throw new Error(`Aucune ordonnance pour la demande : ${demandeId}`)
    return { ...ordonance }
  }
}
