/**
 * IPropositionService — Contrat de service pour les propositions d'aide.
 *
 * Une proposition enregistre l'engagement d'un aidant sur une demande.
 * Après chaque proposition acceptée, le statut de la demande est mis à jour
 * via applyTransition() dans useDemandeService / demandes.store.
 *
 * Implémentations attendues :
 *   - MockPropositionService   : données TypeScript locales (MVP)
 *   - SupabasePropositionService : Supabase (future migration)
 */

import type { Proposition, CreatePropositionDto } from '../../../src/types/proposition.types'

export interface IPropositionService {
  /**
   * Récupère toutes les propositions associées à une demande.
   */
  getByDemandeId(demandeId: string): Promise<Proposition[]>

  /**
   * Soumet une proposition d'aide sur une demande.
   *
   * Pré-conditions vérifiées par le service :
   * - Si type === 'prop1_cagnotte' : montantContribue > 0 ET cagnotte.statut !== 'en_attente_evaluation'
   * - Si type === 'prop2_transport' : aucun transporteur déjà assigné (FR-024)
   * - Si type === 'prop3_achat_transport' : toujours autorisé (remplace Prop2 existante au MVP)
   *
   * @returns La proposition créée. Le store appelant applique ensuite applyTransition().
   * @throws Error si les pré-conditions ne sont pas respectées
   */
  create(data: CreatePropositionDto): Promise<Proposition>
}
