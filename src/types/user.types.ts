// src/types/user.types.ts

export type RoleUtilisateur = 'patient' | 'aidant'

export interface Utilisateur {
  id: string
  prenom: string
  role: RoleUtilisateur
  email: string
  adresseDefaut?: string // pertinent pour Patient (pré-remplit le formulaire)
  createdAt: string // ISO 8601
  // feature 009
  lastSeenAt: string | null
  charteAcceptedAt: string | null
  telephone: string | null
}

export interface CreateUtilisateurDto {
  prenom: string
  role: RoleUtilisateur
  email: string
  password: string
  adresseDefaut?: string
}
