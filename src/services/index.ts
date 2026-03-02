// src/services/index.ts
// Point d'injection unique — swap Mock → Supabase (005-supabase-backend)

import { SupabaseUserService } from './supabase/SupabaseUserService'
import { SupabaseOrdonanceService } from './supabase/SupabaseOrdonanceService'
import { SupabaseCagnotteService } from './supabase/SupabaseCagnotteService'
import { SupabaseDemandeService } from './supabase/SupabaseDemandeService'
import { SupabasePropositionService } from './supabase/SupabasePropositionService'
import { SupabaseMessageService } from './supabase/SupabaseMessageService'

export const userService = new SupabaseUserService()
export const ordonanceService = new SupabaseOrdonanceService()
export const cagnotteService = new SupabaseCagnotteService()
export const demandeService = new SupabaseDemandeService()
export const propositionService = new SupabasePropositionService()
export const messageService = new SupabaseMessageService()
