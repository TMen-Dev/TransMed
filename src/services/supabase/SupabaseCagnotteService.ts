import type { ICagnotteService } from '../interfaces/ICagnotteService'
import type {
  Cagnotte,
  Contribution,
  DefinirMontantCibleDto,
  AjouterContributionDto,
} from '../../types/cagnotte.types'
import { supabase } from '../../lib/supabase'

export function mapRowToCagnotte(
  row: {
    id: string
    demande_id: string
    montant_cible: number | null
    montant_collecte: number
    statut: string
    created_at: string
  },
  contributions: Contribution[] = []
): Cagnotte {
  return {
    id: row.id,
    demandeId: row.demande_id,
    montantCible: row.montant_cible ?? undefined,
    montantCollecte: Number(row.montant_collecte),
    statut: row.statut as 'en_attente_evaluation' | 'ouverte' | 'atteinte',
    contributions,
    createdAt: row.created_at,
  }
}

export class SupabaseCagnotteService implements ICagnotteService {
  async createForDemande(demandeId: string): Promise<Cagnotte> {
    const { data, error } = await supabase
      .from('cagnottes')
      .insert({ demande_id: demandeId })
      .select()
      .single()

    if (error || !data) throw new Error(error?.message ?? 'Erreur création cagnotte')
    return mapRowToCagnotte(data)
  }

  async getByDemandeId(demandeId: string): Promise<Cagnotte> {
    const { data, error } = await supabase
      .from('cagnottes')
      .select('*')
      .eq('demande_id', demandeId)
      .single()

    if (error || !data) throw new Error(`Cagnotte introuvable pour demande : ${demandeId}`)

    const contributions = await this.getContributions(data.id)
    return mapRowToCagnotte(data, contributions)
  }

  async definirMontantCible(dto: DefinirMontantCibleDto): Promise<Cagnotte> {
    if (dto.montantCible <= 0) throw new Error('Le montant cible doit être supérieur à 0')

    const { data, error } = await supabase
      .from('cagnottes')
      .update({ montant_cible: dto.montantCible, statut: 'ouverte' })
      .eq('id', dto.cagnotteId)
      .eq('statut', 'en_attente_evaluation')
      .select()
      .single()

    if (error || !data) throw new Error('Impossible de définir le montant cible — statut invalide')
    const contributions = await this.getContributions(data.id)
    return mapRowToCagnotte(data, contributions)
  }

  async ajouterContribution(dto: AjouterContributionDto): Promise<{ cagnotte: Cagnotte; objectifAtteint: boolean }> {
    const cagnotte = await this.getByDemandeId(
      (await supabase.from('cagnottes').select('demande_id').eq('id', dto.cagnotteId).single()).data?.demande_id ?? ''
    )

    if (cagnotte.statut === 'en_attente_evaluation') {
      throw new Error('La cagnotte n\'a pas encore de montant cible défini')
    }

    const { error: contribErr } = await supabase.from('contributions').insert({
      cagnotte_id: dto.cagnotteId,
      aidant_id: dto.aidantId,
      aidant_prenom: dto.aidantPrenom,
      montant: dto.montant,
    })
    if (contribErr) throw new Error(contribErr.message)

    const newMontant = cagnotte.montantCollecte + dto.montant
    const objectifAtteint = cagnotte.montantCible !== undefined && newMontant >= cagnotte.montantCible
    const newStatut = objectifAtteint ? 'atteinte' : 'ouverte'

    const { data: updated, error: updateErr } = await supabase
      .from('cagnottes')
      .update({ montant_collecte: newMontant, statut: newStatut })
      .eq('id', dto.cagnotteId)
      .select()
      .single()

    if (updateErr || !updated) throw new Error(updateErr?.message ?? 'Erreur mise à jour cagnotte')

    const contributions = await this.getContributions(dto.cagnotteId)
    return { cagnotte: mapRowToCagnotte(updated, contributions), objectifAtteint }
  }

  async getContributions(cagnotteId: string): Promise<Contribution[]> {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('cagnotte_id', cagnotteId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []).map((c) => ({
      id: c.id,
      cagnotteId: c.cagnotte_id,
      aidantId: c.aidant_id,
      aidantPrenom: c.aidant_prenom,
      montant: Number(c.montant),
      createdAt: c.created_at,
    }))
  }
}
