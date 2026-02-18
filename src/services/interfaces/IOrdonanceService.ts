// src/services/interfaces/IOrdonanceService.ts

import type { Ordonance, MimeTypeOrdonance } from '../../types/ordonance.types'

export interface IOrdonanceService {
  /**
   * Enregistre une ordonnance liée à une demande.
   * Appelé lors de la création de la demande (FR-016).
   *
   * @param demandeId - Identifiant de la demande associée
   * @param base64Data - Contenu du fichier encodé en base64
   * @param mimeType - Format du fichier (JPG, PNG ou PDF uniquement)
   * @throws Error si le format n'est pas supporté
   */
  upload(demandeId: string, base64Data: string, mimeType: MimeTypeOrdonance): Promise<Ordonance>

  /**
   * Récupère l'ordonnance d'une demande.
   *
   * MVP : retourne l'objet Ordonance avec base64Data.
   * Future : retourne une signed URL valide 1h à la place de base64Data.
   *
   * @throws Error si l'appelant n'a pas le droit d'accès (rôle non-acheteur)
   * @throws Error si aucune ordonnance n'existe pour cette demande
   */
  getByDemandeId(demandeId: string): Promise<Ordonance>
}
