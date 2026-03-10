# Service Contracts: Améliorations UX Chat & Confiance (009)

**Generated**: 2026-03-10

---

## Nouveaux composables

### `useCharteAidant()`

```typescript
// src/composables/useCharteAidant.ts
interface UseCharteAidant {
  charteAcceptee: ComputedRef<boolean>           // true si charte_accepted_at != null
  showCharteModal: Ref<boolean>                  // contrôle l'affichage du modal
  verifierEtProceder: (action: () => void) => void // vérifie charte puis exécute action
  accepterCharte: () => Promise<void>            // persiste l'acceptation
}
```

**Usage** :
```typescript
const { verifierEtProceder } = useCharteAidant()

function onSeProposer() {
  verifierEtProceder(() => {
    // logique de proposition
  })
}
```

---

### `useLastSeen(userId: string)`

```typescript
// src/composables/useLastSeen.ts
interface UseLastSeen {
  label: ComputedRef<string>  // "En ligne" | "Vu il y a 2h" | "Inactif depuis 3 jours" | "Inconnue"
  rawDate: Ref<string | null> // ISO timestamp brut
  refresh: () => Promise<void>
}
```

**Seuils** :
- `< 30 min` → `"En ligne"` (couleur `--tm-green`)
- `< 24h` → `"Vu il y a Xh"` (couleur `--tm-muted`)
- `>= 24h` → `"Inactif depuis X jours"` (couleur `--tm-warning`)
- `null` → `"Dernière connexion inconnue"` (couleur `--tm-muted`)

---

### `useUnreadMessages()`

```typescript
// src/composables/useUnreadMessages.ts
interface UseUnreadMessages {
  unreadCount: Ref<number>
  hasUrgent: Ref<boolean>        // true si un message non-lu est lié à une demande urgente
  badgeColor: ComputedRef<'danger' | 'warning'>  // 'danger' (rouge) si hasUrgent, 'warning' sinon
  markAsRead: (demandeId: string) => Promise<void>
  fetchUnreadCount: () => Promise<void>
}
```

**Realtime** : souscription Supabase sur `messages` INSERT filtré par les demandes de l'utilisateur.

---

### `useAidantsInteresses(demandeId: string)`

```typescript
// src/composables/useAidantsInteresses.ts
interface UseAidantsInteresses {
  count: Ref<number>            // nombre d'aidants uniques intéressés
  refresh: () => Promise<void>
}
```

---

### `useConfiance(userId: string)`

```typescript
// src/composables/useConfiance.ts
interface BadgeConfiance {
  emailVerifie: boolean
  telephoneRenseigne: boolean
  nbLivraisonsReussies: number
}

interface UseConfiance {
  badges: Ref<BadgeConfiance>
  fetch: () => Promise<void>
}
```

---

## Extensions des services existants

### `SupabaseUserService` — nouvelles méthodes

```typescript
interface IUserService {
  // Existant
  getById(id: string): Promise<Profil>

  // Nouveaux
  accepterCharte(userId: string): Promise<void>
  mettreAJourLastSeen(userId: string): Promise<void>
  mettreAJourTelephone(userId: string, telephone: string): Promise<void>
  getLastSeen(userId: string): Promise<string | null>
  getBadgesConfiance(userId: string): Promise<BadgeConfiance>
}
```

### `SupabaseMessageService` — nouvelles méthodes

```typescript
interface IMessageService {
  // Existant
  getByDemandeId(demandeId: string): Promise<Message[]>
  send(data: SendMessageDto): Promise<Message>

  // Nouveaux
  marquerCommeLus(demandeId: string, userId: string): Promise<void>
  countNonLus(userId: string): Promise<{ count: number; hasUrgent: boolean }>
  countAidantsInteresses(demandeId: string): Promise<number>
}
```

---

## Nouveaux composants

### `CharteModal.vue`

```typescript
// Props
interface CharteModalProps {
  isOpen: boolean
}
// Emits
// 'accepter' → l'aidant a cliqué J'accepte
// 'fermer'   → l'aidant a annulé ou fermé
```

### `QuickReplies.vue`

```typescript
// Props
interface QuickRepliesProps {
  role: 'aidant' | 'patient'
  visible: boolean   // false si messages.length > 0
}
// Emits
// 'select' (texte: string) → suggestion sélectionnée
```

### `LastSeenBadge.vue`

```typescript
// Props
interface LastSeenBadgeProps {
  userId: string
  size?: 'sm' | 'md'  // défaut 'sm'
}
```

### `ConfianceBadges.vue`

```typescript
// Props
interface ConfianceBadgesProps {
  userId: string
  compact?: boolean  // pour l'affichage inline dans les propositions
}
```

### `MessagesView.vue` (nouvelle page)

Liste de toutes les conversations de l'utilisateur (une ligne par demande avec au moins un message), triée par date du dernier message. Accessible via `/app/messages`.

---

## Extensions des stores existants

### `chat.store.ts` — nouvelles propriétés

```typescript
// Ajouts au store existant
const unreadCount = ref(0)
const hasUrgent = ref(false)

async function fetchUnreadCount(userId: string): Promise<void>
async function markAsRead(demandeId: string, userId: string): Promise<void>
async function fetchAidantsInteresses(demandeId: string): Promise<number>
```

---

## Routes ajoutées

```typescript
// Ajout dans src/router/index.ts
{
  path: 'messages',
  component: () => import('../views/MessagesView.vue'),
}
// Comme enfant de /app/ (dans TabsView)
```

---

## Types TypeScript à étendre

### `src/types/user.types.ts`

```typescript
// Extension du type Profil existant
interface Profil {
  // Existants
  id: string
  prenom: string
  email: string | null
  role: RoleUtilisateur
  adresseDefaut: string | null

  // Nouveaux (feature 009)
  lastSeenAt: string | null
  charteAcceptedAt: string | null
  telephone: string | null
}
```

### `src/types/message.types.ts`

```typescript
// Extension du type Message existant
interface Message {
  // Existants
  id: string
  demandeId: string
  auteurId: string
  auteurPrenom: string
  auteurRole: RoleUtilisateur
  contenu: string
  createdAt: string

  // Nouveaux (feature 009)
  isRead: boolean
  readAt: string | null
}
```

### `src/types/confiance.types.ts` (nouveau fichier)

```typescript
export interface BadgeConfiance {
  emailVerifie: boolean
  telephoneRenseigne: boolean
  nbLivraisonsReussies: number
}
```
