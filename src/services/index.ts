// src/services/index.ts
// Point d'injection unique — remplacer UNIQUEMENT ces imports pour migrer vers Supabase.

import { MockUserService } from './mock/MockUserService'
import { MockOrdonanceService } from './mock/MockOrdonanceService'
import { MockCagnotteService } from './mock/MockCagnotteService'
import { MockDemandeService } from './mock/MockDemandeService'
import { MockPropositionService } from './mock/MockPropositionService'
import { MockMessageService } from './mock/MockMessageService'

export const userService = new MockUserService()
export const ordonanceService = new MockOrdonanceService()
export const cagnotteService = new MockCagnotteService()
export const demandeService = new MockDemandeService()
export const propositionService = new MockPropositionService()
export const messageService = new MockMessageService()
