import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import type { Database } from '../types/supabase.types'

/**
 * Adaptateur de stockage Capacitor Preferences pour la session Supabase.
 * Preferences (Android SharedPreferences) persiste la session entre les
 * redémarrages d'app, contrairement à localStorage qui peut être effacé
 * lors d'un switch d'Activity (caméra, galerie).
 */
const storage = {
  getItem: async (key: string) => {
    const { value } = await Preferences.get({ key })
    return value
  },
  setItem: async (key: string, value: string) => {
    await Preferences.set({ key, value })
  },
  removeItem: async (key: string) => {
    await Preferences.remove({ key })
  },
}

/**
 * Wrapper fetch avec timeout de 15 secondes via AbortController.
 *
 * Contexte : sur Huawei EMUI (et certains Android), après un switch d'Activity
 * (caméra, galerie), le radio WiFi peut s'endormir brièvement. Sans timeout,
 * fetch() bloque indéfiniment et l'écran reste figé.
 */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), 15_000)
  const signal = init?.signal ?? controller.signal
  return fetch(input, { ...init, signal }).finally(() => clearTimeout(tid))
}

/**
 * No-op lock pour remplacer le Web Locks API (navigator.locks) utilisé par
 * Supabase auth comme mutex interne.
 *
 * Problème diagnostiqué sur Huawei EMUI (logcat 2026-03-07) :
 *   1. L'utilisateur ouvre la caméra/galerie (switch Activity Android)
 *   2. autoRefreshToken déclenche un refresh du token JWT en arrière-plan
 *   3. Ce refresh acquiert navigator.locks.request('supabase-...-auth-token')
 *      ET fait un fetch vers /auth/v1/token
 *   4. Le fetch pend indéfiniment (WiFi endormi après Activity switch)
 *      → le verrou n'est jamais relâché
 *      → initializePromise reste pending
 *   5. L'utilisateur revient, clique "Publier" → getSession() → await
 *      initializePromise → bloqué à l'infini, écran figé
 *
 * Fix : remplacer le mutex par un no-op (pas de contention = pas de deadlock).
 * Le fetchWithTimeout (15s) gère les requêtes réseau pendantes.
 */
const noOpLock = async <R>(_name: string, _timeout: number, fn: () => Promise<R>): Promise<R> => fn()

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: noOpLock,
    },
    global: { fetch: fetchWithTimeout },
  }
)

/**
 * Crée un client Supabase neuf avec un initializePromise vierge.
 *
 * À utiliser pour les opérations critiques déclenchées après un Camera/Gallery
 * Activity switch (ex: création de demande). Le client singleton peut avoir son
 * initializePromise corrompu si un autoRefreshToken a démarré pendant le switch.
 * Un client neuf repart de zéro : il charge la session depuis Preferences (qui
 * fonctionne correctement après le retour d'Activity) sans jamais attendre une
 * promesse pendante héritée du passé.
 *
 * Note : autoRefreshToken est désactivé sur ce client pour éviter qu'un nouveau
 * refresh concurrent n'interfère pendant l'opération.
 */
export function makeFreshSupabaseClient() {
  return createClient<Database>(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    {
      auth: {
        storage,
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
        lock: noOpLock,
      },
      global: { fetch: fetchWithTimeout },
    }
  )
}
