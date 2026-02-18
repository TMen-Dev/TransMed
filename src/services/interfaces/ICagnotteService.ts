// src/services/interfaces/ICagnotteService.ts

import type {
  Cagnotte,
  Contribution,
  DefinirMontantCibleDto,
  AjouterContributionDto,
} from '../../types/cagnotte.types'

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

  /** Récupère toutes les contributions d'une cagnotte. */
  getContributions(cagnotteId: string): Promise<Contribution[]>
}
