// src/services/interfaces/IPropositionService.ts

import type { Proposition, CreatePropositionDto } from '../../types/proposition.types'

export interface IPropositionService {
  /** Récupère toutes les propositions associées à une demande. */
  getByDemandeId(demandeId: string): Promise<Proposition[]>

  /**
   * Soumet une proposition d'aide sur une demande.
   *
   * Pré-conditions vérifiées par le service :
   * - prop_achat_envoi : autorisé uniquement si statut === 'nouvelle_demande' ou 'transporteur_disponible_attente_acheteur'
   *   ET verrou acheteur non actif (acheteur_locked_until est null ou expiré)
   * - prop_transport : autorisé uniquement si statut === 'nouvelle_demande' ou 'medicaments_achetes_attente_transporteur'
   *   ET verrou transporteur non actif (transporteur_locked_until est null ou expiré)
   * - prop_achat_transport : autorisé uniquement si statut === 'nouvelle_demande'
   *   ET verrous acheteur ET transporteur non actifs
   *
   * Après création, le service pose le(s) verrou(x) correspondant(s) via IDemandeService.
   *
   * @returns La proposition créée.
   * @throws Error avec message explicite si pré-conditions non respectées (verrou actif, état interdit)
   */
  create(data: CreatePropositionDto): Promise<Proposition>
}
