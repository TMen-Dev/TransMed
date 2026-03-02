// src/services/supabase/handleSupabaseError.ts
// Mappe les codes d'erreur Supabase/PostgreSQL vers des messages en français

type SupabaseErrorLike = { code?: string; message?: string }

export function handleSupabaseError(error: SupabaseErrorLike): never {
  switch (error.code) {
    case '23505':
      throw new Error('Cette action a déjà été enregistrée (contrainte unique).')
    case 'PGRST116':
      throw new Error('Ressource introuvable.')
    case '42501':
      throw new Error('Accès non autorisé.')
    case '23503':
      throw new Error('Référence invalide — ressource liée introuvable.')
    case '23514':
      throw new Error('Données invalides — contrainte non respectée.')
    default:
      throw new Error(error.message ?? 'Une erreur est survenue.')
  }
}
