// src/composables/useConfiance.ts
// feature 009 — badges de confiance utilisateur

import { ref } from 'vue'
import type { BadgeConfiance } from '../types/confiance.types'
import { userService } from '../services/index'

export function useConfiance(userId: string) {
  const badges = ref<BadgeConfiance>({
    emailVerifie: false,
    telephoneRenseigne: false,
    nbLivraisonsReussies: 0,
  })

  async function fetch(): Promise<void> {
    try {
      badges.value = await userService.getBadgesConfiance(userId)
    } catch {
      // Non bloquant
    }
  }

  void fetch()

  return { badges, fetch }
}
