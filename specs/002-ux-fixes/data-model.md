# Data Model: TransMed v1.1 — Corrections UX

**Feature**: `002-ux-fixes`
**Phase**: 1 — Design

---

## Type Changes

### 1. `Demande` type — Ajout champ notification

**Fichier**: `src/types/demande.types.ts`

```typescript
// Ajout optionnel
emailNotifEnvoyee?: boolean  // FR-120 — empêche le double déclenchement
```

### 2. Credentials mock — Nouveau type

**Fichier**: `src/services/mock/data/users.mock.ts` (ajout en bas du fichier)

```typescript
export interface MockCredential {
  email: string
  password: string  // en clair, MVP seulement
  userId: string
}

export const MOCK_CREDENTIALS: MockCredential[] = [
  { email: 'alice@transmed.fr',    password: 'test1234', userId: 'patient-alice' },
  { email: 'karim@transmed.fr',    password: 'test1234', userId: 'patient-karim' },
  { email: 'benjamin@transmed.fr', password: 'test1234', userId: 'aidant-ben' },
  { email: 'leila@transmed.fr',    password: 'test1234', userId: 'aidant-leila' },
]
```

Note: Le type `Utilisateur` existant n'est pas modifié — les credentials sont séparés intentionnellement.

### 3. `IUserService` — Méthode d'authentification

**Fichier**: `src/services/interfaces/IUserService.ts`

```typescript
// Méthode à ajouter
authenticate(email: string, password: string): Promise<Utilisateur>
// Throws Error('Identifiants incorrects') si pas de correspondance
```

### 4. `IDemandeService` — Méthode notification

**Fichier**: `src/services/interfaces/IDemandeService.ts`

```typescript
// Méthode à ajouter
markEmailNotifSent(id: string): Promise<Demande>
```

---

## State Transitions

### Notification email (FR-118-120)

```
Condition: demande.transporteurId EXISTS
       AND cagnotte.montantCollecte >= cagnotte.montantCible
       AND !demande.emailNotifEnvoyee

→ Action: markEmailNotifSent(demandeId)
         + console.log('[NOTIF] Email mock envoyé au patient')
         + toast 'Email envoyé au patient'
```

**Points de déclenchement**:
1. Après `propositions.store.setTransporteur()` → vérifier si cagnotte atteinte
2. Après `cagnotte.store.ajouterContribution()` avec `objectifAtteint = true` → vérifier si transporteur assigné

---

## Validation Rules

### Ordonnance obligatoire (FR-112-113)

```
submit button disabled = loading || !ordonance.value
```

### Visibilité ordonnance (FR-114-117)

```
peutVoirOrdonnance:
  isAidant
  && demande.propositions.some(p =>
       p.aidantId === currentUser.id
       && (p.type === 'prop1_cagnotte' || p.type === 'prop2_transport' || p.type === 'prop3_achat_transport')
     )

peutTelechargerOrdonnance:
  peutVoirOrdonnance || estTransporteur
```

### Statut "Financé" (FR-110)

```
isFinanced(etape, cagnotte):
  if etape.statut !== 'fonds_atteints': return statutIndex(etape) < statutIndex(current)
  if !cagnotte || !cagnotte.montantCible: return false
  return cagnotte.montantCollecte >= cagnotte.montantCible
```
