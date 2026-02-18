// src/types/ordonance.types.ts

export type MimeTypeOrdonance = 'image/jpeg' | 'image/png' | 'application/pdf'

export interface Ordonance {
  id: string
  demandeId: string
  base64Data: string // MVP : stockée en base64 localement
  mimeType: MimeTypeOrdonance
  createdAt: string
}
