# Data Model: Mise en relation patients-aidants pour médicaments

**Feature**: `001-medication-relay` | **Date**: 2026-02-18 (mis à jour)

## Vue d'ensemble

9 types TypeScript couvrent l'ensemble du domaine. La couche mock utilise ces types via des tableaux en mémoire. La migration Supabase mappe chaque entité vers une table PostgreSQL (ou colonne JSONB pour les types embarqués).

---

## 1. RoleUtilisateur

```typescript
// src/types/user.types.ts
export type RoleUtilisateur = 'patient' | 'aidant'
```

---

## 2. Utilisateur

```typescript
// src/types/user.types.ts
export interface Utilisateur {
  id: string
  prenom: string
  role: RoleUtilisateur
  adresseDefaut?: string   // pertinent pour Patient (pré-remplit le formulaire)
  createdAt: string        // ISO 8601
}

export interface CreateUtilisateurDto {
  prenom: string
  role: RoleUtilisateur
  adresseDefaut?: string
}
```

**Règles** : `prenom` requis 1–50 caractères ; `adresseDefaut` optionnel.

---

## 3. StatutDemande + TypeEvenement

```typescript
// src/types/demande.types.ts

export type StatutDemande =
  | 'attente_fonds_et_transporteur'  // 1 — initial
  | 'attente_fonds'                  // 2 — a un transporteur
  | 'attente_transporteur'           // 3 — a les fonds
  | 'fonds_atteints'                 // 4 — cagnotte complète, attend transporteur
  | 'transporteur_disponible'        // 5 — a un transporteur, attend les fonds
  | 'pret_acceptation_patient'       // 6 — les deux conditions réunies
  | 'en_cours_livraison'             // 7 — patient a confirmé
  | 'traitee'                        // 8 — livrée

export type TypeEvenement =
  | 'prop1_contribution'             // Prop1 — cagnotte non encore atteinte
  | 'prop1_cagnotte_atteinte'        // Prop1 — contribution qui remplit la cagnotte
  | 'prop2_transport'                // Prop2 — aidant propose transport
  | 'prop3_achat_transport'          // Prop3 — aidant propose achat + transport
  | 'patient_confirme'               // Patient → 6 → 7
  | 'aidant_livre'                   // Aidant → 7 → 8
```

### Table de transition pure

```typescript
// src/stores/demandes.store.ts (extrait)
export function applyTransition(
  statut: StatutDemande,
  evenement: TypeEvenement
): StatutDemande {
  const transitions: Partial<Record<StatutDemande, Partial<Record<TypeEvenement, StatutDemande>>>> = {
    attente_fonds_et_transporteur: {
      prop1_contribution:        'attente_fonds_et_transporteur',
      prop1_cagnotte_atteinte:   'fonds_atteints',
      prop2_transport:           'transporteur_disponible',
      prop3_achat_transport:     'pret_acceptation_patient',
    },
    attente_fonds: {
      prop1_contribution:        'attente_fonds',
      prop1_cagnotte_atteinte:   'pret_acceptation_patient',
      prop3_achat_transport:     'pret_acceptation_patient',
    },
    attente_transporteur: {
      prop2_transport:           'pret_acceptation_patient',
      prop3_achat_transport:     'pret_acceptation_patient',
    },
    fonds_atteints: {
      prop2_transport:           'pret_acceptation_patient',
      prop3_achat_transport:     'pret_acceptation_patient',
    },
    transporteur_disponible: {
      prop1_contribution:        'transporteur_disponible',
      prop1_cagnotte_atteinte:   'pret_acceptation_patient',
      prop3_achat_transport:     'pret_acceptation_patient',
    },
    pret_acceptation_patient: {
      patient_confirme:          'en_cours_livraison',
    },
    en_cours_livraison: {
      aidant_livre:              'traitee',
    },
    traitee: {},
  }

  return transitions[statut]?.[evenement] ?? statut
}
```

---

## 4. Medicament (embedded)

```typescript
// src/types/medicament.types.ts
export interface Medicament {
  nom: string       // saisie libre, pas de validation de nomenclature
  quantite: number  // entier > 0
}
```

---

## 5. Demande

```typescript
// src/types/demande.types.ts
export interface Demande {
  id: string
  patientId: string
  patientPrenom: string          // dénormalisé
  medicaments: Medicament[]      // min 1
  adresseLivraison: string
  statut: StatutDemande
  ordonanceId: string            // obligatoire — référence Ordonance
  cagnotteId: string             // créée automatiquement avec la demande
  propositions: Proposition[]    // liste des propositions reçues
  transporteurId?: string        // aidant assigné au transport (Prop2 ou Prop3)
  transporteurPrenom?: string    // dénormalisé
  createdAt: string
  updatedAt: string
  deliveredAt?: string           // défini à statut 8
}

export interface CreateDemandeDto {
  patientId: string
  patientPrenom: string
  medicaments: Medicament[]
  adresseLivraison: string
  ordonanceBase64: string        // fichier encodé en base64 (MVP local)
  ordonanceMimeType: 'image/jpeg' | 'image/png' | 'application/pdf'
}
```

**Règles** :
- `medicaments` : non vide
- `ordonanceBase64` : requis, format JPG/PNG/PDF uniquement
- Transition de statut via `applyTransition()` uniquement — pas de mutation directe

---

## 6. TypeProposition

```typescript
// src/types/proposition.types.ts
export type TypeProposition = 'prop1_cagnotte' | 'prop2_transport' | 'prop3_achat_transport'

export interface Proposition {
  id: string
  demandeId: string
  aidantId: string
  aidantPrenom: string           // dénormalisé
  type: TypeProposition
  montantContribue?: number      // défini uniquement pour prop1_cagnotte
  createdAt: string
}

export interface CreatePropositionDto {
  demandeId: string
  aidantId: string
  aidantPrenom: string
  type: TypeProposition
  montantContribue?: number      // requis si type === 'prop1_cagnotte'
}
```

**Règles** :
- `montantContribue` : requis et > 0 si `type === 'prop1_cagnotte'`
- Une seule Prop2 autorisée par demande (FR-024) — refus si transporteur déjà assigné
- Plusieurs Prop1 autorisées (contributions cumulatives)
- Prop3 prévaut sur Prop2 existante (MVP)

---

## 7. Cagnotte + Contribution

```typescript
// src/types/cagnotte.types.ts
export type StatutCagnotte =
  | 'en_attente_evaluation'   // montant cible non encore défini par l'acheteur
  | 'ouverte'                 // montant cible défini, contributions acceptées
  | 'atteinte'                // montant collecté >= montant cible

export interface Cagnotte {
  id: string
  demandeId: string
  montantCible?: number        // défini par l'acheteur (FR-023)
  montantCollecte: number      // somme des contributions
  statut: StatutCagnotte
  contributions: Contribution[]
  createdAt: string
}

export interface Contribution {
  id: string
  cagnotteId: string
  aidantId: string
  aidantPrenom: string
  montant: number              // > 0
  createdAt: string
}

export interface DefinirMontantCibleDto {
  cagnotteId: string
  montantCible: number         // > 0, saisi par l'acheteur
}

export interface AjouterContributionDto {
  cagnotteId: string
  aidantId: string
  aidantPrenom: string
  montant: number
}
```

**Règles** :
- Contributions bloquées si `statut === 'en_attente_evaluation'` (FR-022)
- `montantCible` saisi uniquement par un aidant de rôle acheteur (FR-023)
- `montantCollecte` recalculé après chaque contribution
- Si `montantCollecte >= montantCible` → `statut = 'atteinte'` → déclenche `prop1_cagnotte_atteinte`

---

## 8. Ordonance

```typescript
// src/types/ordonance.types.ts
export type MimeTypeOrdonance = 'image/jpeg' | 'image/png' | 'application/pdf'

export interface Ordonance {
  id: string
  demandeId: string
  base64Data: string           // MVP : stockée en base64 localement
  mimeType: MimeTypeOrdonance
  createdAt: string
}
```

**Règles** :
- Liée 1-1 à une Demande
- Accessible en lecture uniquement aux aidants ayant soumis une Prop3 ou après avoir été identifiés comme acheteur (FR-017)
- **Migration Supabase** : `base64Data` → URL signée depuis Supabase Storage (bucket privé, expiration 1h)

---

## 9. Message

```typescript
// src/types/message.types.ts
export interface Message {
  id: string
  demandeId: string
  auteurId: string
  auteurPrenom: string
  auteurRole: RoleUtilisateur
  contenu: string              // 1–1000 caractères
  createdAt: string
}

export interface SendMessageDto {
  demandeId: string
  auteurId: string
  auteurPrenom: string
  auteurRole: RoleUtilisateur
  contenu: string
}
```

---

## Mapping Supabase (future migration)

| Entité TypeScript | Table / Stockage Supabase |
|-------------------|---------------------------|
| `Utilisateur` | `users` |
| `Demande` | `demandes` |
| `Medicament` | `demandes.medicaments` (JSONB) |
| `Proposition` | `propositions` |
| `Cagnotte` | `cagnottes` |
| `Contribution` | `contributions` |
| `Ordonance` | `ordonances` (meta) + Supabase Storage bucket `ordonances` (fichier) |
| `Message` | `messages` |
