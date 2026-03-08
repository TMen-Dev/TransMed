// src/services/mock/MockDemandeService.ts

import type { IDemandeService } from '../interfaces/IDemandeService'
import type { Demande, CreateDemandeDto, StatutDemande } from '../../types/demande.types'
import { MOCK_DEMANDES } from './data/demandes.mock'
import { ordonanceService } from '../index'

const STATUTS_ACTIFS_AIDANT: StatutDemande[] = [
  'nouvelle_demande',
  'medicaments_achetes_attente_transporteur',
  'transporteur_disponible_attente_acheteur',
  'transporteur_et_medicaments_prets',
]

export class MockDemandeService implements IDemandeService {
  private demandes: Demande[] = MOCK_DEMANDES.map((d) => ({
    ...d,
    propositions: [...d.propositions],
  }))

  async getAll(): Promise<Demande[]> {
    return this.demandes.map((d) => ({ ...d, propositions: [...d.propositions] }))
  }

  async getById(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    return { ...demande, propositions: [...demande.propositions] }
  }

  async getByPatientId(patientId: string): Promise<Demande[]> {
    return this.demandes
      .filter((d) => d.patientId === patientId)
      .map((d) => ({ ...d, propositions: [...d.propositions] }))
  }

  async getActiveForAidant(): Promise<Demande[]> {
    return this.demandes
      .filter((d) => STATUTS_ACTIFS_AIDANT.includes(d.statut))
      .map((d) => ({ ...d, propositions: [...d.propositions] }))
  }

  async create(data: CreateDemandeDto): Promise<Demande> {
    if (!data.medicaments.length) throw new Error('La demande doit contenir au moins un médicament.')
    if (!data.ordonanceBase64) throw new Error("L'ordonnance est obligatoire.")

    const ordonance = await ordonanceService.upload(
      `demande-${crypto.randomUUID()}`,
      data.ordonanceBase64!,
      data.ordonanceMimeType!
    )

    const now = new Date().toISOString()
    const demande: Demande = {
      id: ordonance.demandeId,
      patientId: data.patientId,
      patientPrenom: data.patientPrenom,
      nom: data.nom,
      urgente: data.urgente,
      medicaments: [...data.medicaments],
      adresseLivraison: data.adresseLivraison,
      statut: 'nouvelle_demande',
      ordonanceId: ordonance.id,
      propositions: [],
      createdAt: now,
      updatedAt: now,
    }
    this.demandes.push(demande)
    return { ...demande }
  }

  async updateStatut(id: string, newStatut: StatutDemande): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.statut = newStatut
    demande.updatedAt = new Date().toISOString()
    if (newStatut === 'traitee') {
      demande.deliveredAt = new Date().toISOString()
    }
    return { ...demande, propositions: [...demande.propositions] }
  }

  async updateAcheteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.acheteurId = aidantId
    demande.acheteurPrenom = aidantPrenom
    demande.updatedAt = new Date().toISOString()
    return { ...demande, propositions: [...demande.propositions] }
  }

  async updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.transporteurId = aidantId
    demande.transporteurPrenom = aidantPrenom
    demande.updatedAt = new Date().toISOString()
    return { ...demande, propositions: [...demande.propositions] }
  }

  async setAcheteurLock(id: string, lockedUntil: string): Promise<void> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.acheteurLockedUntil = lockedUntil
    demande.updatedAt = new Date().toISOString()
  }

  async setTransporteurLock(id: string, lockedUntil: string): Promise<void> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.transporteurLockedUntil = lockedUntil
    demande.updatedAt = new Date().toISOString()
  }

  async confirmerEnvoiMedicaments(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'transporteur_et_medicaments_prets') {
      throw new Error('Envoi impossible — statut attendu : transporteur_et_medicaments_prets.')
    }
    return this.updateStatut(id, 'en_cours_livraison_transporteur')
  }

  async confirmerReceptionTransporteur(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'en_cours_livraison_transporteur') {
      throw new Error('Réception impossible — statut attendu : en_cours_livraison_transporteur.')
    }
    return this.updateStatut(id, 'rdv_a_fixer')
  }

  async confirmerRdvFixe(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'rdv_a_fixer') {
      throw new Error('RDV impossible — statut attendu : rdv_a_fixer.')
    }
    return this.updateStatut(id, 'en_cours_livraison_patient')
  }

  async marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'en_cours_livraison_patient') {
      throw new Error('Réception impossible — statut attendu : en_cours_livraison_patient.')
    }
    if (messageRemerciement) {
      demande.messageRemerciement = messageRemerciement
    }
    return this.updateStatut(id, 'traitee')
  }

  async markEmailNotifSent(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.emailNotifEnvoyee = true
    demande.updatedAt = new Date().toISOString()
    return { ...demande, propositions: [...demande.propositions] }
  }
}
