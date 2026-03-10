// src/types/message.types.ts

import type { RoleUtilisateur } from './user.types'

export interface Message {
  id: string
  demandeId: string
  auteurId: string
  auteurPrenom: string
  auteurRole: RoleUtilisateur
  contenu: string // 1–1000 caractères
  createdAt: string
  isRead: boolean
  readAt: string | null
}

export interface SendMessageDto {
  demandeId: string
  auteurId: string
  auteurPrenom: string
  auteurRole: RoleUtilisateur
  contenu: string
}
