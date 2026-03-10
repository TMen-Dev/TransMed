// src/composables/useLastSeen.ts
// feature 009 — indicateur de dernière connexion

import { ref, computed } from 'vue'
import { userService } from '../services/index'

export function useLastSeen(userId: string) {
  const rawDate = ref<string | null>(null)

  const label = computed<string>(() => {
    if (!rawDate.value) return 'Dernière connexion inconnue'

    const diffMs = Date.now() - new Date(rawDate.value).getTime()
    const diffMin = diffMs / 60000
    const diffH = diffMs / 3600000
    const diffDays = diffMs / 86400000

    if (diffMin < 30) return 'En ligne'
    if (diffH < 24) {
      const h = Math.floor(diffH)
      return `Vu il y a ${h}h`
    }
    const days = Math.floor(diffDays)
    return `Inactif depuis ${days} jour${days > 1 ? 's' : ''}`
  })

  const isOnline = computed(() => {
    if (!rawDate.value) return false
    const diffMin = (Date.now() - new Date(rawDate.value).getTime()) / 60000
    return diffMin < 30
  })

  const color = computed<string>(() => {
    if (!rawDate.value) return 'var(--tm-muted, #7A6E65)'
    const diffH = (Date.now() - new Date(rawDate.value).getTime()) / 3600000
    if (diffH < 0.5) return 'var(--tm-green, #1B8C5A)'
    if (diffH < 24) return 'var(--tm-muted, #7A6E65)'
    return 'var(--tm-warning, #D68910)'
  })

  async function refresh(): Promise<void> {
    try {
      rawDate.value = await userService.getLastSeen(userId)
    } catch {
      rawDate.value = null
    }
  }

  void refresh()

  return { label, rawDate, isOnline, color, refresh }
}
