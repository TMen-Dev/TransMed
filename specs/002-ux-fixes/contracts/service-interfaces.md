# Service Contracts: TransMed v1.1

**Feature**: `002-ux-fixes`

---

## IUserService — Nouvelle méthode

```typescript
interface IUserService {
  getAll(): Promise<Utilisateur[]>
  getById(id: string): Promise<Utilisateur>
  create(data: CreateUserDto): Promise<Utilisateur>

  // NEW FR-101-103
  authenticate(email: string, password: string): Promise<Utilisateur>
  // Returns Utilisateur si credentials correspondent à MOCK_CREDENTIALS
  // Throws Error('Identifiants incorrects') sinon
}
```

## IDemandeService — Nouvelle méthode

```typescript
interface IDemandeService {
  // ...existant...

  // NEW FR-120
  markEmailNotifSent(id: string): Promise<Demande>
  // Sets demande.emailNotifEnvoyee = true
}
```

## useNotification composable (nouveau)

```typescript
// src/composables/useNotification.ts

interface NotificationService {
  checkAndSendEmailNotif(
    demande: Demande,
    cagnotte: Cagnotte | null | undefined
  ): Promise<void>
  // Déclenche le toast + log si:
  //   - demande.transporteurId est défini
  //   - cagnotte.montantCollecte >= cagnotte.montantCible
  //   - !demande.emailNotifEnvoyee
}
```

## StatutTimeline — Interface mise à jour

```typescript
// Nouvelle prop optionnelle
interface StatutTimelineProps {
  statut: StatutDemande
  cagnotte?: { montantCollecte: number; montantCible?: number } | null
}
```
