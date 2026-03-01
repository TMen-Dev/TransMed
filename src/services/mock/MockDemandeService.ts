// src/services/mock/MockDemandeService.ts

import type { IDemandeService } from '../interfaces/IDemandeService'
import type { Demande, CreateDemandeDto, StatutDemande } from '../../types/demande.types'
import { MOCK_DEMANDES } from './data/demandes.mock'
import { ordonanceService, cagnotteService } from '../index'

const STATUTS_ACTIFS_AIDANT: StatutDemande[] = [
  'attente_fonds_et_transporteur',
  'fonds_atteints',
  'transporteur_disponible',
  'pret_acceptation_patient',
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
    if (!data.ordonanceBase64) throw new Error("L'ordonnance est obligatoire (FR-016).")

    // Upload ordonnance
    const ordonance = await ordonanceService.upload(
      `demande-${crypto.randomUUID()}`, // ID temporaire pour l'upload
      data.ordonanceBase64,
      data.ordonanceMimeType
    )

    // Créer la cagnotte associée
    const cagnotte = await cagnotteService.createForDemande(ordonance.demandeId)

    const now = new Date().toISOString()
    const demande: Demande = {
      id: ordonance.demandeId, // Utilise le même ID
      patientId: data.patientId,
      patientPrenom: data.patientPrenom,
      nom: data.nom,
      urgente: data.urgente,
      medicaments: [...data.medicaments],
      adresseLivraison: data.adresseLivraison,
      statut: 'attente_fonds_et_transporteur',
      ordonanceId: ordonance.id,
      cagnotteId: cagnotte.id,
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
    if (demande.statut === newStatut) {
      throw new Error(`La demande est déjà au statut "${newStatut}".`)
    }
    demande.statut = newStatut
    demande.updatedAt = new Date().toISOString()
    if (newStatut === 'traitee') {
      demande.deliveredAt = new Date().toISOString()
    }
    return { ...demande, propositions: [...demande.propositions] }
  }

  async confirmerParPatient(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'pret_acceptation_patient') {
      throw new Error('Confirmation impossible — statut attendu : pret_acceptation_patient (FR-213).')
    }
    return this.updateStatut(id, 'livraison_confirmee')
  }

  async updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    demande.transporteurId = aidantId
    demande.transporteurPrenom = aidantPrenom
    demande.updatedAt = new Date().toISOString()
    return { ...demande, propositions: [...demande.propositions] }
  }

  async marquerLivree(id: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'livraison_confirmee') {
      throw new Error('Livraison impossible — statut attendu : livraison_confirmee (FR-214).')
    }
    return this.updateStatut(id, 'livree')
  }

  async marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande> {
    const demande = this.demandes.find((d) => d.id === id)
    if (!demande) throw new Error(`Demande introuvable : ${id}`)
    if (demande.statut !== 'livree') {
      throw new Error('Réception impossible — statut attendu : livree (FR-215).')
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
