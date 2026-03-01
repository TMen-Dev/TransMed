# Service Interfaces: TransMed v1.2

## IDemandeService — modifications

### Méthodes modifiées

```typescript
// confirmerParPatient : maintenant → livraison_confirmee (au lieu de en_cours_livraison)
confirmerParPatient(id: string): Promise<Demande>

// marquerLivree : maintenant livraison_confirmee → livree (au lieu de en_cours_livraison → traitee)
marquerLivree(id: string): Promise<Demande>
```

### Méthodes ajoutées

```typescript
// Étape C : patient confirme réception, message optionnel → traitee
marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>

// Création avec nouveaux champs
create(data: CreateDemandeDto): Promise<Demande>  // dto inclut nom + urgente
```

## IDemandeService — contrat complet mis à jour

```typescript
interface IDemandeService {
  getAll(): Promise<Demande[]>
  getById(id: string): Promise<Demande>
  getByPatientId(patientId: string): Promise<Demande[]>
  getActiveForAidant(): Promise<Demande[]>
  create(data: CreateDemandeDto): Promise<Demande>
  updateStatut(id: string, newStatut: StatutDemande): Promise<Demande>
  confirmerParPatient(id: string): Promise<Demande>      // → livraison_confirmee
  marquerLivree(id: string): Promise<Demande>            // livraison_confirmee → livree
  marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>  // NOUVEAU
  updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>
  markEmailNotifSent(id: string): Promise<Demande>
}
```

## Store demandes — actions ajoutées

```typescript
// Étape A : patient confirme livraison → livraison_confirmee
async function confirmerLivraison(demandeId: string): Promise<void>

// Étape B : transporteur marque livré → livree
async function livrerOrdonnance(demandeId: string): Promise<void>

// Étape C : patient confirme réception → traitee
async function recevoirMedicaments(demandeId: string, messageRemerciement?: string): Promise<void>
```

## Router — logique post-login

```typescript
// Dans router.beforeEach, après authentification réussie vers /app/demandes :
// Si patient + a une demande pret_acceptation_patient + emailNotifEnvoyee=true
// → redirect vers /app/demandes/{id} (la plus récente)
```
