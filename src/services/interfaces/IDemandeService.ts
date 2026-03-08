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
   * Récupère les demandes visibles pour les aidants :
   * statuts A, B, C, D (nouvelles + en cours de couverture des rôles).
   */
  getActiveForAidant(): Promise<Demande[]>

  /**
   * Crée une nouvelle demande au statut A (nouvelle_demande).
   * @throws si medicaments vide ou ordonnance manquante
   */
  create(data: CreateDemandeDto): Promise<Demande>

  /**
   * Met à jour le statut d'une demande.
   * Appelé par le store après applyTransition().
   */
  updateStatut(id: string, newStatut: StatutDemande): Promise<Demande>

  /**
   * Assigne l'aidant-acheteur à une demande.
   * Met à jour acheteurId et acheteurPrenom.
   */
  updateAcheteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>

  /**
   * Assigne l'aidant-transporteur à une demande.
   * Met à jour transporteurId et transporteurPrenom.
   */
  updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>

  /**
   * Pose le verrou acheteur (acheteur_locked_until).
   * Empêche un second aidant de prendre le rôle acheteur pendant la durée du verrou.
   */
  setAcheteurLock(id: string, lockedUntil: string): Promise<void>

  /**
   * Pose le verrou transporteur (transporteur_locked_until).
   * Empêche un second aidant de prendre le rôle transporteur pendant la durée du verrou.
   */
  setTransporteurLock(id: string, lockedUntil: string): Promise<void>

  /**
   * L'acheteur confirme qu'il a envoyé les médicaments au transporteur : D → E.
   * @throws si statut !== 'transporteur_et_medicaments_prets'
   */
  confirmerEnvoiMedicaments(id: string): Promise<Demande>

  /**
   * Le transporteur confirme qu'il a reçu les médicaments : E → F.
   * Déclenche l'email de RDV au patient.
   * @throws si statut !== 'en_cours_livraison_transporteur'
   */
  confirmerReceptionTransporteur(id: string): Promise<Demande>

  /**
   * Le patient confirme que le RDV est fixé : F → G.
   * @throws si statut !== 'rdv_a_fixer'
   */
  confirmerRdvFixe(id: string): Promise<Demande>

  /**
   * Le patient confirme la réception finale des médicaments : G → H.
   * Stocke le message de remerciement optionnel.
   * @throws si statut !== 'en_cours_livraison_patient'
   */
  marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>

  /**
   * Marque la notification email comme envoyée pour éviter les doublons.
   */
  markEmailNotifSent(id: string): Promise<Demande>
}
