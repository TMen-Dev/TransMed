// src/constants/messageSuggestions.ts
// feature 009 — suggestions de messages rapides (statiques, par rôle)

export interface MessageSuggestion {
  role: 'aidant' | 'patient'
  texte: string
}

export const MESSAGE_SUGGESTIONS: MessageSuggestion[] = [
  { role: 'aidant', texte: 'Quels médicaments exactement ?' },
  { role: 'aidant', texte: 'Je suis disponible demain matin' },
  { role: 'aidant', texte: 'Quelle pharmacie préférez-vous ?' },
  { role: 'patient', texte: "C'est urgent, merci" },
  { role: 'patient', texte: 'Êtes-vous disponible ce soir ?' },
  { role: 'patient', texte: 'Merci pour votre réactivité !' },
]

export function getSuggestions(role: 'aidant' | 'patient'): string[] {
  return MESSAGE_SUGGESTIONS.filter((s) => s.role === role).map((s) => s.texte)
}
