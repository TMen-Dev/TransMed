// src/types/ordonance.types.ts

export type MimeTypeOrdonance = 'image/jpeg' | 'image/png' | 'application/pdf'

export interface Ordonance {
  id: string
  demandeId: string
  storagePath: string    // Supabase Storage path (ex: {demandeId}/ordonnance.pdf)
  signedUrl?: string     // URL signée valide 1h — générée via createSignedUrl
  base64Data?: string    // Compatibilité transitoire : prévisualisation locale avant upload
  mimeType: MimeTypeOrdonance
  createdAt: string
}
