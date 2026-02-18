// src/services/interfaces/IDemandeService.ts

import type { Demande, CreateDemandeDto, StatutDemande } from '../../types/demande.types'

export interface IDemandeService {
  /** Récupère toutes les demandes. */
  getAll(): Promise<Demande[]>

  /** Récupère une demande par identifiant. @throws si inexistante. */
  getById(id: string): Promise<Demande>

  /** Récupère les demandes d'un patient (historique). */
  getByPatientId(patientId: string): Promise<Demande[]>

  /**
   * Récupère les demandes visibles pour un aidant :
   * statuts 1, 2, 3, 4, 5 (actives, en attente de contribution).
   */
  getActiveForAidant(): Promise<Demande[]>

  /**
   * Crée une nouvelle demande au statut 1 (attente_fonds_et_transporteur).
   * Crée automatiquement une Cagnotte associée (statut 'en_attente_evaluation').
   * @throws si medicaments vide ou ordonnance manquante
   */
  create(data: CreateDemandeDto): Promise<Demande>

  /**
   * Met à jour le statut d'une demande.
   * Appelé par le store après applyTransition().
   * @throws si la transition produit le même statut (événement non applicable)
   */
  updateStatut(id: string, newStatut: StatutDemande): Promise<Demande>

  /**
   * Le patient confirme la demande : statut 6 → 7 (en_cours_livraison).
   * @throws si statut !== 'pret_acceptation_patient'
   */
  confirmerParPatient(id: string): Promise<Demande>

  /**
   * L'aidant (Prop3) marque la livraison effectuée : statut 7 → 8 (traitee).
   * @throws si statut !== 'en_cours_livraison'
   */
  marquerLivree(id: string): Promise<Demande>
}
