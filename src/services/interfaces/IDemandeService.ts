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
   * Le patient confirme la livraison : pret_acceptation_patient → livraison_confirmee (FR-213).
   * @throws si statut !== 'pret_acceptation_patient'
   */
  confirmerParPatient(id: string): Promise<Demande>

  /**
   * Assigne le transporteur à une demande (après Prop2 ou Prop3).
   * Met à jour transporteurId et transporteurPrenom.
   * @throws si la demande est introuvable
   */
  updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>

  /**
   * Le transporteur marque la livraison effectuée : livraison_confirmee → livree (FR-214).
   * @throws si statut !== 'livraison_confirmee'
   */
  marquerLivree(id: string): Promise<Demande>

  /**
   * Le patient confirme la réception des médicaments : livree → traitee (FR-215).
   * Stocke le message de remerciement optionnel (FR-224).
   * @throws si statut !== 'livree'
   */
  marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>

  /**
   * Marque la notification email comme envoyée pour éviter les doublons.
   * FR-120 — set emailNotifEnvoyee = true
   */
  markEmailNotifSent(id: string): Promise<Demande>
}
