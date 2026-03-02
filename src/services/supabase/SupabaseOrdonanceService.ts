import type { IOrdonanceService } from '../interfaces/IOrdonanceService'
import type { Ordonance, MimeTypeOrdonance } from '../../types/ordonance.types'
import { supabase } from '../../lib/supabase'
import { handleSupabaseError } from './handleSupabaseError'

export class SupabaseOrdonanceService implements IOrdonanceService {
  async upload(demandeId: string, base64Data: string, mimeType: MimeTypeOrdonance): Promise<Ordonance> {
    const ext = mimeType === 'application/pdf' ? 'pdf' : mimeType === 'image/png' ? 'png' : 'jpg'
    const path = `${demandeId}/ordonnance.${ext}`

    const dataUrl = base64Data.startsWith('data:') ? base64Data : `data:${mimeType};base64,${base64Data}`
    const blob = await fetch(dataUrl).then((r) => r.blob())

    const { error: uploadErr } = await supabase.storage
      .from('ordonnances')
      .upload(path, blob, { contentType: mimeType, upsert: true })

    if (uploadErr) handleSupabaseError(uploadErr)

    const { data: row, error: insertErr } = await supabase
      .from('ordonnances')
      .upsert(
        { demande_id: demandeId, storage_path: path, mime_type: mimeType },
        { onConflict: 'demande_id' }
      )
      .select()
      .single()

    if (insertErr || !row) throw new Error(insertErr?.message ?? 'Erreur enregistrement ordonnance')

    const { data: signedData } = await supabase.storage
      .from('ordonnances')
      .createSignedUrl(path, 3600)

    return {
      id: row.id,
      demandeId: row.demande_id,
      storagePath: row.storage_path,
      mimeType: row.mime_type as MimeTypeOrdonance,
      signedUrl: signedData?.signedUrl ?? undefined,
      createdAt: row.created_at,
    }
  }

  async getByDemandeId(demandeId: string): Promise<Ordonance> {
    const { data, error } = await supabase
      .from('ordonnances')
      .select('*')
      .eq('demande_id', demandeId)
      .single()

    if (error) {
      if (error.code === '42501') throw new Error('Accès non autorisé')
      if (error.code === 'PGRST116') throw new Error('Aucune ordonnance pour cette demande')
      handleSupabaseError(error)
    }
    if (!data) throw new Error('Aucune ordonnance pour cette demande')

    const { data: signedData, error: signedErr } = await supabase.storage
      .from('ordonnances')
      .createSignedUrl(data.storage_path, 3600)

    if (signedErr) throw new Error('Accès non autorisé')

    return {
      id: data.id,
      demandeId: data.demande_id,
      storagePath: data.storage_path,
      mimeType: data.mime_type as MimeTypeOrdonance,
      signedUrl: signedData?.signedUrl ?? undefined,
      createdAt: data.created_at,
    }
  }
}
