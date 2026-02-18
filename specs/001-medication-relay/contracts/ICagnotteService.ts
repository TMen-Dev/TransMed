/**
 * ICagnotteService — Contrat de service pour la gestion des cagnottes.
 *
 * Chaque demande possède exactement une cagnotte, créée automatiquement
 * lors de la création de la demande avec le statut 'en_attente_evaluation'.
 *
 * Workflow :
 *   1. Acheteur définit le montant cible → statut passe à 'ouverte'
 *   2. Aidants contribuent via Prop1 (IPropositionService)
 *   3. Si montantCollecte >= montantCible → statut passe à 'atteinte'
 *      → déclenche 'prop1_cagnotte_atteinte' dans demandes.store
 *
 * Implémentations attendues :
 *   - MockCagnotteService       : données TypeScript locales (MVP)
 *   - SupabaseCagnotteService   : Supabase (future migration)
 */

import type {
  Cagnotte,
  Contribution,
  DefinirMontantCibleDto,
  AjouterContributionDto,
} from '../../../src/types/cagnotte.types'

export interface ICagnotteService {
  /**
   * Crée une cagnotte vide (statut 'en_attente_evaluation') pour une demande.
   * Appelé automatiquement lors de la création de la demande.
   */
  createForDemande(demandeId: string): Promise<Cagnotte>

  /**
   * Récupère la cagnotte d'une demande.
   * @throws Error si aucune cagnotte n'existe pour cette demande
   */
  getByDemandeId(demandeId: string): Promise<Cagnotte>

  /**
   * Définit le montant cible de la cagnotte (FR-021, FR-023).
   * Action réservée à un aidant de rôle acheteur.
   * Passe le statut de la cagnotte de 'en_attente_evaluation' à 'ouverte'.
   *
   * @throws Error si la cagnotte n'est pas au statut 'en_attente_evaluation'
   * @throws Error si montantCible <= 0
   */
  definirMontantCible(data: DefinirMontantCibleDto): Promise<Cagnotte>

  /**
   * Ajoute une contribution à la cagnotte (résultat d'une Prop1).
   * Recalcule montantCollecte. Si montantCollecte >= montantCible,
   * passe le statut à 'atteinte'.
   *
   * @throws Error si cagnotte.statut === 'en_attente_evaluation' (FR-022)
   * @throws Error si montant <= 0
   * @returns La cagnotte mise à jour + booléen 'objectifAtteint'
   */
  ajouterContribution(data: AjouterContributionDto): Promise<{
    cagnotte: Cagnotte
    objectifAtteint: boolean
  }>

  /**
   * Récupère toutes les contributions d'une cagnotte.
   */
  getContributions(cagnotteId: string): Promise<Contribution[]>
}
