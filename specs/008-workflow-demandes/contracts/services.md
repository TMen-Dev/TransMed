# Contract: Services — 008-workflow-demandes

## IDemandeService (modifié)

```typescript
interface IDemandeService {
  getAll(): Promise<Demande[]>
  getById(id: string): Promise<Demande>
  getByPatientId(patientId: string): Promise<Demande[]>
  getActiveForAidant(): Promise<Demande[]>   // statuts A, B, C, D
  create(data: CreateDemandeDto): Promise<Demande>
  updateStatut(id: string, newStatut: StatutDemande): Promise<Demande>

  // NOUVEAU — Acheteur confirme envoi des médicaments au transporteur (D → E)
  confirmerEnvoiMedicaments(id: string): Promise<Demande>

  // NOUVEAU — Transporteur confirme réception des médicaments (E → F)
  confirmerReceptionTransporteur(id: string): Promise<Demande>

  // NOUVEAU — Patient confirme RDV fixé (F → G)
  confirmerRdvFixe(id: string): Promise<Demande>

  // MODIFIÉ — Patient confirme réception finale (G → H, était livree → traitee)
  marquerTraitee(id: string, messageRemerciement?: string): Promise<Demande>

  // NOUVEAU — Assigner acheteur
  updateAcheteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>

  // EXISTANT conservé — Assigner transporteur
  updateTransporteur(id: string, aidantId: string, aidantPrenom: string): Promise<Demande>

  // NOUVEAU — Poser/mettre à jour les verrous
  setAcheteurLock(id: string, lockedUntil: string): Promise<Demande>
  setTransporteurLock(id: string, lockedUntil: string): Promise<Demande>

  markEmailNotifSent(id: string): Promise<Demande>  // conservé pour compatibilité

  // SUPPRIMÉS
  // confirmerParPatient()  → remplacé par confirmerRdvFixe()
  // marquerLivree()        → remplacé par confirmerReceptionTransporteur()
}
```

## IPropositionService (modifié)

```typescript
interface IPropositionService {
  getByDemandeId(demandeId: string): Promise<Proposition[]>

  /**
   * Pré-conditions vérifiées :
   * - prop_achat_envoi ou prop_achat_transport : verrou acheteur non expiré → Error
   * - prop_transport ou prop_achat_transport : verrou transporteur non expiré → Error
   * - prop_achat_envoi : autorisé seulement en état A ou C
   * - prop_transport : autorisé seulement en état A ou B
   * - prop_achat_transport : autorisé seulement en état A
   */
  create(data: CreatePropositionDto): Promise<Proposition>
}
```

## Demande (type modifié)

```typescript
interface Demande {
  id: string
  patientId: string
  patientPrenom: string
  nom: string
  urgente: boolean
  medicaments: Medicament[]
  adresseLivraison: string
  statut: StatutDemande        // nouvelles valeurs
  ordonanceId: string
  propositions: Proposition[]

  // NOUVEAU
  acheteurId?: string
  acheteurPrenom?: string
  acheteurLockedUntil?: string    // ISO timestamp
  transporteurLockedUntil?: string // ISO timestamp
  singleAidant?: boolean          // true = scénario 1

  // CONSERVÉ
  transporteurId?: string
  transporteurPrenom?: string
  emailNotifEnvoyee?: boolean
  messageRemerciement?: string
  createdAt: string
  updatedAt: string
  deliveredAt?: string

  // SUPPRIMÉ
  // cagnotteId: string
}
```

## Proposition (type modifié)

```typescript
interface Proposition {
  id: string
  demandeId: string
  aidantId: string
  aidantPrenom: string
  type: TypeProposition  // nouvelles valeurs: prop_achat_envoi | prop_transport | prop_achat_transport

  // SUPPRIMÉ
  // montantContribue?: number

  createdAt: string
}
```

## Edge Function: notify-patient (étendue)

### Nouveau payload webhook étendu

```typescript
interface WebhookPayload {
  type: "UPDATE"
  table: "demandes"
  record: {
    id: string
    patient_id: string
    acheteur_id: string | null
    transporteur_id: string | null
    nom: string
    statut: string
    single_aidant: boolean
  }
  old_record: {
    statut: string
  }
}
```

### Logique de routage des notifications

| Transition détectée (old_statut → new_statut) | event_type | Destinataire |
|----------------------------------------------|------------|-------------|
| * → transporteur_et_medicaments_prets, single_aidant=true | rdv_patient | patient_id |
| medicaments_achetes_attente_transporteur → transporteur_et_medicaments_prets | acheteur_transporteur_dispo | acheteur_id |
| transporteur_disponible_attente_acheteur → transporteur_et_medicaments_prets | transporteur_acheteur_pret | transporteur_id |
| en_cours_livraison_transporteur → rdv_a_fixer | rdv_patient | patient_id |
