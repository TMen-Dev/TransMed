export type StatutNotification = 'pending' | 'sent' | 'failed'

export interface NotificationEmail {
  id: string
  demandeId: string
  patientId: string
  patientEmail: string
  statut: StatutNotification
  tentatives: number
  derniereTemptative?: string
  envoyeeAt?: string
  resendEmailId?: string
  erreur?: string
  createdAt: string
}
