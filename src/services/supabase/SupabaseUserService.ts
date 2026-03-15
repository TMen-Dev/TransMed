import type { IUserService } from '../interfaces/IUserService'
import type { Utilisateur, CreateUtilisateurDto } from '../../types/user.types'
import type { BadgeConfiance } from '../../types/confiance.types'
import { supabase, makeFreshSupabaseClient } from '../../lib/supabase'

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
      lastSeenAt: data.last_seen_at ?? null,
      charteAcceptedAt: data.charte_accepted_at ?? null,
      telephone: data.telephone ?? null,
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

    // Supabase a renvoyé un utilisateur mais pas de session :
    // la confirmation email est activée → un code OTP a été envoyé.
    // On ne peut pas écrire le profil maintenant (pas de session RLS).
    // La vue doit passer en mode "verify" pour saisir le code.
    if (!authData.session) {
      throw new Error('EMAIL_VERIFICATION_REQUIRED')
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
      lastSeenAt: null,
      charteAcceptedAt: null,
      telephone: null,
    }
  }

  async verifyOtpAndComplete(
    email: string,
    token: string,
    prenom: string,
    role: 'patient' | 'aidant'
  ): Promise<Utilisateur> {
    // Client frais — contourne le deadlock initializePromise du singleton
    // (même cause que le bug Camera/Gallery sur Huawei EMUI)
    const db = makeFreshSupabaseClient()

    const { data, error } = await db.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    })

    if (error || !data.user) {
      throw new Error('Code invalide ou expiré. Vérifiez et réessayez.')
    }

    const userId = data.user.id

    const { error: profileError } = await db
      .from('profiles')
      .update({ prenom, role })
      .eq('id', userId)

    if (profileError) throw new Error(`Erreur profil : ${profileError.message}`)

    return {
      id: userId,
      prenom,
      role,
      email,
      createdAt: new Date().toISOString(),
      lastSeenAt: null,
      charteAcceptedAt: null,
      telephone: null,
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw new Error('Impossible de renvoyer le code. Réessayez dans quelques instants.')
  }

  async authenticate(email: string, password: string): Promise<Utilisateur> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.user) {
      throw new Error('Identifiants incorrects. Vérifiez votre email et mot de passe.')
    }

    return this.getById(data.user.id)
  }

  // T011 — feature 009 : méthodes confiance & last_seen

  async accepterCharte(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ charte_accepted_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) throw new Error(`Erreur acceptation charte : ${error.message}`)
  }

  async mettreAJourLastSeen(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', userId)

    // Non bloquant — ignorer l'erreur silencieusement
    if (error) console.warn('mettreAJourLastSeen:', error.message)
  }

  async mettreAJourTelephone(userId: string, telephone: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ telephone: telephone.trim() || null })
      .eq('id', userId)

    if (error) throw new Error(`Erreur mise à jour téléphone : ${error.message}`)
  }

  async getLastSeen(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('last_seen_at')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.last_seen_at ?? null
  }

  async getBadgesConfiance(userId: string): Promise<BadgeConfiance> {
    // Profil pour téléphone + email
    const { data: profile } = await supabase
      .from('profiles')
      .select('telephone, email')
      .eq('id', userId)
      .single()

    // Email vérifié via auth.getUser()
    const { data: authData } = await supabase.auth.getUser()
    const emailVerifie = !!(authData?.user?.email_confirmed_at)

    // Livraisons réussies : demandes traitées où l'utilisateur était aidant actif
    const { count: nbLivraisons } = await supabase
      .from('demandes')
      .select('id', { count: 'exact', head: true })
      .eq('statut', 'traitee')
      .or(`acheteur_id.eq.${userId},transporteur_id.eq.${userId}`)

    return {
      emailVerifie,
      telephoneRenseigne: !!(profile?.telephone?.trim()),
      nbLivraisonsReussies: nbLivraisons ?? 0,
    }
  }
}
