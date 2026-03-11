import type { IDemandeService } from '../interfaces/IDemandeService'
import type { Demande, CreateDemandeDto, StatutDemande } from '../../types/demande.types'
import { STATUTS_ANNULABLES } from '../../types/demande.types'
import type { Medicament } from '../../types/medicament.types'
import type { Proposition } from '../../types/proposition.types'
import { supabase, makeFreshSupabaseClient } from '../../lib/supabase'

type DemandeRow = {
  id: string
  patient_id: string
  patient_prenom: string
  nom: string
  urgente: boolean
  adresse_livraison: string
  statut: string
  transporteur_id: string | null
  transporteur_prenom: string | null
  acheteur_id: string | null
  acheteur_prenom: string | null
  acheteur_locked_until: string | null
  transporteur_locked_until: string | null
  single_aidant: boolean
  email_notif_envoyee: boolean
  message_remerciement: string | null
  delivered_at: string | null
  created_at: string
  updated_at: string
  medicaments?: { id: string; nom: string; quantite: number; created_at: string }[]
  propositions?: {
    id: string
    aidant_id: string
    aidant_prenom: string
    type: string
    created_at: string
  }[]
  ordonnances?: { id: string }[]
}

export function mapRowToDemande(row: DemandeRow): Demande {
  const medicaments: Medicament[] = (row.medicaments ?? []).map((m) => ({
    id: m.id,
    nom: m.nom,
    quantite: m.quantite,
    createdAt: m.created_at,
  }))

  const propositions: Proposition[] = (row.propositions ?? []).map((p) => ({
    id: p.id,
    demandeId: row.id,
    aidantId: p.aidant_id,
    aidantPrenom: p.aidant_prenom,
    type: p.type as Proposition['type'],
    createdAt: p.created_at,
  }))

  return {
    id: row.id,
    patientId: row.patient_id,
    patientPrenom: row.patient_prenom,
    nom: row.nom,
    urgente: row.urgente,
    medicaments,
    adresseLivraison: row.adresse_livraison,
    statut: row.statut as StatutDemande,
    ordonanceId: row.ordonnances?.[0]?.id ?? '',
    propositions,
    transporteurId: row.transporteur_id ?? undefined,
    transporteurPrenom: row.transporteur_prenom ?? undefined,
    acheteurId: row.acheteur_id ?? undefined,
    acheteurPrenom: row.acheteur_prenom ?? undefined,
    acheteurLockedUntil: row.acheteur_locked_until ?? undefined,
    transporteurLockedUntil: row.transporteur_locked_until ?? undefined,
    singleAidant: row.single_aidant,
    emailNotifEnvoyee: row.email_notif_envoyee,
    messageRemerciement: row.message_remerciement ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deliveredAt: row.delivered_at ?? undefined,
  }
}

const SELECT_FULL = `
  *,
  medicaments(*),
  propositions(*),
  ordonnances(id)
`

export class SupabaseDemandeService implements IDemandeService {
  async getAll(): Promise<Demande[]> {
    const { data, error } = await supabase
      .from('demandes')
      .select(SELECT_FULL)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapRowToDemande(r as unknown as DemandeRow))
  }

  async getById(id: string): Promise<Demande> {
    return this._fetchById(id, supabase)
  }

  private async _fetchById(id: string, db: ReturnType<typeof makeFreshSupabaseClient>): Promise<Demande> {
    const { data, error } = await db
      .from('demandes')
      .select(SELECT_FULL)
      .eq('id', id)
      .single()

    if (error || !data) throw new Error(`Demande introuvable : ${id}`)
    return mapRowToDemande(data as unknown as DemandeRow)
  }

  async getByPatientId(patientId: string): Promise<Demande[]> {
    const { data, error } = await supabase
      .from('demandes')
      .select(SELECT_FULL)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapRowToDemande(r as unknown as DemandeRow))
  }

  async getActiveForAidant(): Promise<Demande[]> {
    const { data, error } = await supabase
      .from('demandes')
      .select(SELECT_FULL)
      .in('statut', [
        'nouvelle_demande',
        'medicaments_achetes_attente_transporteur',
        'transporteur_disponible_attente_acheteur',
        'transporteur_et_medicaments_prets',
      ])
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapRowToDemande(r as unknown as DemandeRow))
  }

  async create(dto: CreateDemandeDto): Promise<Demande> {
    // On crée un client Supabase neuf (initializePromise vierge, autoRefreshToken
    // désactivé) pour toute cette opération. Voir makeFreshSupabaseClient() dans
    // supabase.ts pour l'explication complète du problème Huawei EMUI.
    const db = makeFreshSupabaseClient()

    // 1. Créer la demande
    const { data: demande, error: demandeErr } = await db
      .from('demandes')
      .insert({
        patient_id: dto.patientId,
        patient_prenom: dto.patientPrenom,
        nom: dto.nom,
        urgente: dto.urgente,
        adresse_livraison: dto.adresseLivraison,
      })
      .select()
      .single()

    if (demandeErr || !demande) throw new Error(demandeErr?.message ?? 'Erreur création demande')

    // 2. Créer les médicaments
    if (dto.medicaments.length > 0) {
      const { error: medErr } = await db.from('medicaments').insert(
        dto.medicaments.map((m) => ({
          demande_id: demande.id,
          nom: m.nom,
          quantite: m.quantite,
        }))
      )
      if (medErr) throw new Error(`Erreur médicaments : ${medErr.message}`)
    }

    // 3. Upload ordonnance + enregistrement
    if (dto.ordonanceBase64 && dto.ordonanceMimeType) {
      const ext = dto.ordonanceMimeType === 'application/pdf' ? 'pdf'
        : dto.ordonanceMimeType === 'image/png' ? 'png' : 'jpg'
      const path = `${demande.id}/ordonnance.${ext}`
      const rawBase64 = dto.ordonanceBase64.replace(/^data:[^;]+;base64,/, '')
      const byteChars = atob(rawBase64)
      const byteArr = new Uint8Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
      const blob = new Blob([byteArr], { type: dto.ordonanceMimeType })

      const { error: uploadErr } = await db.storage
        .from('ordonnances')
        .upload(path, blob, { contentType: dto.ordonanceMimeType })

      if (uploadErr) throw new Error(`Erreur upload ordonnance : ${uploadErr.message}`)

      await db.from('ordonnances').insert({
        demande_id: demande.id,
        storage_path: path,
        mime_type: dto.ordonanceMimeType,
      })
    }

    // 5. Retourner la demande complète avec toutes ses relations
    // _fetchById utilise le même client frais pour éviter le singleton bloqué.
    return this._fetchById(demande.id, db)
  }

  async updateStatut(id: string, newStatut: StatutDemande): Promise<Demande> {
    const current = await this.getById(id)
    const { data, error } = await supabase
      .rpc('update_demande_statut', {
        p_demande_id: id,
        p_expected_statut: current.statut,
        p_new_statut: newStatut,
      })

    if (error) throw new Error(error.message)
    if (!data || (Array.isArray(data) && data.length === 0)) {
      throw new Error('STATUT_MISMATCH')
    }
    return this.getById(id)
  }

  async updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande> {
    const { error } = await supabase
      .from('demandes')
      .update({ transporteur_id: aidantId, transporteur_prenom: aidantPrenom })
      .eq('id', id)

    if (error) throw new Error(error.message)
    return this.getById(id)
  }

  async updateAcheteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande> {
    const { error } = await supabase
      .from('demandes')
      .update({ acheteur_id: aidantId, acheteur_prenom: aidantPrenom })
      .eq('id', id)

    if (error) throw new Error(error.message)
    return this.getById(id)
  }

  async setAcheteurLock(id: string, lockedUntil: string): Promise<void> {
    const { error } = await supabase
      .from('demandes')
      .update({ acheteur_locked_until: lockedUntil })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  async setTransporteurLock(id: string, lockedUntil: string): Promise<void> {
    const { error } = await supabase
      .from('demandes')
      .update({ transporteur_locked_until: lockedUntil })
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  async confirmerEnvoiMedicaments(id: string): Promise<Demande> {
    return this.updateStatut(id, 'en_cours_livraison_transporteur')
  }

  async confirmerReceptionTransporteur(id: string): Promise<Demande> {
    return this.updateStatut(id, 'rdv_a_fixer')
  }

  async confirmerRdvFixe(id: string): Promise<Demande> {
    return this.updateStatut(id, 'en_cours_livraison_patient')
  }

  async marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande> {
    if (messageRemerciement) {
      await supabase
        .from('demandes')
        .update({ message_remerciement: messageRemerciement, delivered_at: new Date().toISOString() })
        .eq('id', id)
    }
    return this.updateStatut(id, 'traitee')
  }

  async markEmailNotifSent(id: string): Promise<Demande> {
    const { error } = await supabase
      .from('demandes')
      .update({ email_notif_envoyee: true })
      .eq('id', id)
      .eq('email_notif_envoyee', false)

    if (error) throw new Error(error.message)
    return this.getById(id)
  }

  async delete(id: string): Promise<void> {
    // 1. Vérifier le statut avant de supprimer (garde d'état — US2)
    const { data: demandeCheck, error: checkErr } = await supabase
      .from('demandes')
      .select('statut')
      .eq('id', id)
      .single()

    if (checkErr || !demandeCheck) throw new Error('Demande introuvable ou non autorisée')

    const statut = demandeCheck.statut as StatutDemande
    if (!STATUTS_ANNULABLES.includes(statut)) {
      throw new Error(`Suppression impossible : demande en cours (état ${statut})`)
    }

    // 2. Récupérer le storage_path de l'ordonnance (SELECT_FULL ne retourne que ordonnances(id))
    const { data: ordRow } = await supabase
      .from('ordonnances')
      .select('storage_path')
      .eq('demande_id', id)
      .maybeSingle()

    // 3. Supprimer le fichier Storage (best-effort — ne bloque pas si absent ou erreur)
    if (ordRow?.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from('ordonnances')
        .remove([ordRow.storage_path])
      if (storageErr) {
        console.warn(`[delete] Storage.remove warning (non-bloquant) : ${storageErr.message}`)
      }
    }

    // 4. Supprimer les messages (explicite — sans dépendance au CASCADE)
    const { error: msgErr } = await supabase
      .from('messages')
      .delete()
      .eq('demande_id', id)
    if (msgErr) throw new Error(`Erreur suppression messages : ${msgErr.message}`)

    // 5. Supprimer les propositions (explicite)
    const { error: propErr } = await supabase
      .from('propositions')
      .delete()
      .eq('demande_id', id)
    if (propErr) throw new Error(`Erreur suppression propositions : ${propErr.message}`)

    // 6. Supprimer l'entrée ordonnance (explicite)
    const { error: ordErr } = await supabase
      .from('ordonnances')
      .delete()
      .eq('demande_id', id)
    if (ordErr) throw new Error(`Erreur suppression ordonnance : ${ordErr.message}`)

    // 7. Supprimer la demande — RLS garantit patient_id = auth.uid()
    const { error: delErr, count } = await supabase
      .from('demandes')
      .delete({ count: 'exact' })
      .eq('id', id)

    if (delErr) throw new Error(`Erreur suppression demande : ${delErr.message}`)
    if (count === 0) throw new Error('Demande introuvable ou non autorisée')
  }
}
