# Quickstart: Intégration backend persistant (Supabase)

**Feature**: 005-supabase-backend | **Date**: 2026-03-01

---

## Prérequis

- Node.js 18+, npm 9+
- Compte Supabase (https://supabase.com) OU Supabase CLI pour local
- Projet TransMed cloné et `npm install` effectué

---

## 1. Créer le projet Supabase

### Option A — Cloud (recommandé pour commencer)

1. Aller sur https://app.supabase.com → **New Project**
2. Nom : `transmed`, région : Europe (Paris)
3. Copier `Project URL` et `anon key` depuis **Settings > API**

### Option B — Local avec Supabase CLI

```bash
npm install --save-dev supabase
npx supabase init
npx supabase start  # démarre PostgreSQL + Studio local
```

---

## 2. Variables d'environnement

Créer `.env.local` à la racine (jamais committé) :

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 3. Installer les dépendances

```bash
npm install @supabase/supabase-js
```

---

## 4. Appliquer les migrations SQL

```bash
# Via Supabase CLI (local ou cloud)
npx supabase db push

# OU manuellement via le SQL Editor dans le dashboard Supabase
# Copier-coller le contenu de :
# - specs/005-supabase-backend/data-model.md (section "Schéma PostgreSQL")
```

Ordre d'exécution :
1. Extensions requises : `uuid-ossp`, `moddatetime`
2. Tables : `profiles` → `demandes` → `medicaments` → `cagnottes` → `contributions` → `propositions` → `messages` → `ordonnances`
3. Triggers : `handle_new_user`, `set_updated_at_*`
4. RLS : activer + politiques
5. Fonction `update_demande_statut`
6. Realtime : `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`

---

## 5. Créer le bucket Storage

Dans le dashboard Supabase → **Storage** :
1. **New Bucket** : nom `ordonnances`, cocher **Private**
2. Taille max : 10 Mo (`10485760` octets)
3. Types autorisés : `image/jpeg,image/png,application/pdf`

---

## 6. Générer les types TypeScript

```bash
# Ajouter dans package.json.scripts
npx supabase gen types typescript --project-id $SUPABASE_PROJECT_ID \
  > src/types/supabase.types.ts
```

Ou via script npm :
```bash
npm run db:types
```

---

## 7. Créer `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import type { Database } from '../types/supabase.types'

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

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

---

## 8. Mettre à jour `src/services/index.ts`

Remplacer les imports Mock → Supabase :

```typescript
// AVANT
import { MockUserService } from './mock/MockUserService'
// ...

// APRÈS
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
```

---

## 9. Mettre à jour `src/stores/auth.store.ts`

Le store doit initialiser la session Supabase au démarrage :

```typescript
// Nouvelle fonction à ajouter dans auth.store.ts
async function initSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.user) {
    const profile = await userService.getById(session.user.id)
    setUser(profile)
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') logout()
    // SIGNED_IN géré via les actions login/register
  })
}
```

Appeler `initSession()` dans `src/main.ts` ou `App.vue` `onMounted()`.

---

## 10. Lancer et tester

```bash
# Développement web
npm run dev

# Tests unitaires
npm test

# Vérifier que la connexion Supabase fonctionne
# 1. Ouvrir l'app
# 2. Créer un compte
# 3. Vérifier que le profil apparaît dans Supabase Dashboard > Table Editor > profiles
# 4. Créer une demande, vérifier dans la table demandes
```

---

## Variables d'environnement complètes

| Variable | Description | Exemple |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL du projet | `https://abc.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) | `eyJhbGci...` |
| `SUPABASE_PROJECT_ID` | ID projet (CLI uniquement) | `abcdefgh` |

> ⚠️ La `anon key` est publique et peut être incluse dans le code client. Elle est protégée par RLS côté serveur. La `service_role key` (admin) ne doit JAMAIS être dans le code client.
