// src/services/interfaces/IUserService.ts

import type { Utilisateur, CreateUtilisateurDto } from '../../types/user.types'

export interface IUserService {
  /** Récupère tous les utilisateurs. */
  getAll(): Promise<Utilisateur[]>

  /** Récupère un utilisateur par identifiant. @throws si inexistant. */
  getById(id: string): Promise<Utilisateur>

  /** Crée un nouvel utilisateur. */
  create(data: CreateUtilisateurDto): Promise<Utilisateur>

  /**
   * Authentifie un utilisateur par email + mot de passe (mock).
   * FR-101-103 — compare contre MOCK_CREDENTIALS.
   * @throws Error('Identifiants incorrects') si aucune correspondance
   */
  authenticate(email: string, password: string): Promise<Utilisateur>

  /**
   * Vérifie le code OTP reçu par email et finalise la création du compte.
   * @throws Error('Code invalide ou expiré') si le token est incorrect
   */
  verifyOtpAndComplete(
    email: string,
    token: string,
    prenom: string,
    role: 'patient' | 'aidant'
  ): Promise<Utilisateur>

  /** Renvoie l'email de vérification (OTP ou lien de confirmation). */
  resendVerificationEmail(email: string): Promise<void>
}
