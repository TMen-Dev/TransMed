/**
 * IUserService — Contrat de service pour la gestion des utilisateurs.
 *
 * Implémentations attendues :
 *   - MockUserService   : données TypeScript locales (MVP)
 *   - SupabaseUserService : appels @supabase/supabase-js (future migration)
 *
 * Aucune vue ni composable ne dépend d'une implémentation concrète.
 * L'injection se fait via src/services/index.ts.
 */

import type { Utilisateur, CreateUtilisateurDto } from '../../../src/types/user.types'

export interface IUserService {
  /**
   * Récupère tous les utilisateurs enregistrés.
   * (Utilisé pour les données mock de sélection de profil)
   */
  getAll(): Promise<Utilisateur[]>

  /**
   * Récupère un utilisateur par son identifiant.
   * @throws Error si l'utilisateur n'existe pas
   */
  getById(id: string): Promise<Utilisateur>

  /**
   * Crée et enregistre un nouvel utilisateur (écran Inscription).
   * Génère un identifiant UUID côté service.
   */
  create(data: CreateUtilisateurDto): Promise<Utilisateur>
}
