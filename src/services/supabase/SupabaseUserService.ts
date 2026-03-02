import type { IUserService } from '../interfaces/IUserService'
import type { Utilisateur, CreateUtilisateurDto } from '../../types/user.types'
import { supabase } from '../../lib/supabase'

export class SupabaseUserService implements IUserService {
  async getAll(): Promise<Utilisateur[]> {
    return []
  }

  async getById(id: string): Promise<Utilisateur> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) throw new Error(`Utilisateur introuvable : ${id}`)

    return {
      id: data.id,
      prenom: data.prenom ?? '',
      role: (data.role as 'patient' | 'aidant') ?? 'patient',
      email: data.email ?? '',
      adresseDefaut: data.adresse_defaut ?? undefined,
      createdAt: data.created_at,
    }
  }

  async create(data: CreateUtilisateurDto): Promise<Utilisateur> {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError || !authData.user) {
      throw new Error(signUpError?.message ?? 'Erreur lors de la création du compte')
    }

    const userId = authData.user.id

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        prenom: data.prenom,
        role: data.role,
        adresse_defaut: data.adresseDefaut ?? null,
      })
      .eq('id', userId)

    if (profileError) throw new Error(`Erreur profil : ${profileError.message}`)

    return {
      id: userId,
      prenom: data.prenom,
      role: data.role,
      email: data.email,
      adresseDefaut: data.adresseDefaut,
      createdAt: new Date().toISOString(),
    }
  }

  async authenticate(email: string, password: string): Promise<Utilisateur> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw new Error('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    }

    return this.getById(data.user.id)
  }
}
