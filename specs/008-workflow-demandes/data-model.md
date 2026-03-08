# Data Model: 008-workflow-demandes

**Date**: 2026-03-07

---

## Entité : Demande

### Champs modifiés / ajoutés

| Champ TypeScript | Colonne SQL | Type | Description |
|-----------------|-------------|------|-------------|
| `statut: StatutDemande` | `statut` | VARCHAR (enum) | Nouveau jeu de valeurs (voir ci-dessous) |
| `acheteurId?: string` | `acheteur_id` | UUID FK → profiles | Aidant assigné à l'achat |
| `acheteurPrenom?: string` | `acheteur_prenom` | VARCHAR | Dénormalisé |
| `acheteurLockedUntil?: string` | `acheteur_locked_until` | TIMESTAMPTZ | Verrou rôle acheteur |
| `transporteurLockedUntil?: string` | `transporteur_locked_until` | TIMESTAMPTZ | Verrou rôle transporteur |
| `singleAidant?: boolean` | `single_aidant` | BOOLEAN DEFAULT false | true si prop_achat_transport (1 aidant) |

### Champs supprimés

| Champ TypeScript | Colonne SQL | Raison |
|-----------------|-------------|--------|
| `cagnotteId` | `cagnotte_id` (relation) | Suppression cagnotte |

### Valeurs de `StatutDemande` (nouveau)

```typescript
export type StatutDemande =
  | 'nouvelle_demande'                      // A — état initial
  | 'medicaments_achetes_attente_transporteur' // B — acheteur engagé
  | 'transporteur_disponible_attente_acheteur' // C — transporteur engagé
  | 'transporteur_et_medicaments_prets'     // D — les deux rôles couverts
  | 'en_cours_livraison_transporteur'       // E — médicaments en transit vers transporteur
  | 'rdv_a_fixer'                           // F — RDV patient ↔ transporteur à fixer
  | 'en_cours_livraison_patient'            // G — en transit vers patient
  | 'traitee'                               // H — terminal
```

### Valeurs de `TypeEvenement` (nouveau)

```typescript
export type TypeEvenement =
  | 'prop_achat_envoi'              // Aidant propose d'acheter + envoyer au transporteur
  | 'prop_transport'                // Aidant propose de transporter
  | 'prop_achat_transport'          // Aidant propose d'acheter + transporter (scénario 1)
  | 'acheteur_envoie_medicaments'   // Acheteur confirme envoi → D→E
  | 'auto_rdv_patient'              // Système: D→F (scénario 1)
  | 'transporteur_recoit_medicaments' // Transporteur confirme réception → E→F
  | 'rdv_fixe'                      // Patient confirme RDV → F→G
  | 'patient_recoit_medicaments'    // Patient confirme réception → G→H
```

---

## Entité : Proposition

### Champs modifiés

| Champ TypeScript | Colonne SQL | Type | Description |
|-----------------|-------------|------|-------------|
| `type: TypeProposition` | `type` | VARCHAR (enum) | Nouveau jeu de valeurs |

### Champs supprimés

| Champ TypeScript | Colonne SQL | Raison |
|-----------------|-------------|--------|
| `montantContribue?: number` | `montant_contribue` | Plus de cagnotte |

### Valeurs de `TypeProposition` (nouveau)

```typescript
export type TypeProposition =
  | 'prop_achat_envoi'      // Acheter + envoyer au transporteur
  | 'prop_transport'        // Transporter jusqu'au patient
  | 'prop_achat_transport'  // Acheter + transporter (rôle unique)
```

---

## Entité : NotificationEmail (table existante modifiée)

### Champs ajoutés

| Colonne SQL | Type | Description |
|-------------|------|-------------|
| `event_type` | VARCHAR | Type d'événement déclencheur |
| `destinataire_id` | UUID | ID de l'utilisateur destinataire (peut être patient, acheteur ou transporteur) |

### Valeurs de `event_type`

| Valeur | Déclencheur | Destinataire |
|--------|-------------|-------------|
| `rdv_patient` | D→F (scénario 1) ou E→F | Patient |
| `acheteur_transporteur_dispo` | B→D | Aidant-acheteur |
| `transporteur_acheteur_pret` | C→D | Aidant-transporteur |

### Contrainte unique modifiée

```sql
-- Ancienne : UNIQUE(demande_id)
-- Nouvelle :
UNIQUE(demande_id, event_type)
```

---

## Tables supprimées

- `cagnottes`
- `contributions`

---

## Machine d'états (table de transitions)

```
nouvelle_demande (A):
  prop_achat_envoi     → medicaments_achetes_attente_transporteur (B)
  prop_transport       → transporteur_disponible_attente_acheteur (C)
  prop_achat_transport → transporteur_et_medicaments_prets (D)

medicaments_achetes_attente_transporteur (B):
  prop_transport       → transporteur_et_medicaments_prets (D)

transporteur_disponible_attente_acheteur (C):
  prop_achat_envoi     → transporteur_et_medicaments_prets (D)

transporteur_et_medicaments_prets (D):
  acheteur_envoie_medicaments → en_cours_livraison_transporteur (E)  [scénarios 2/3]
  auto_rdv_patient            → rdv_a_fixer (F)                      [scénario 1, automatique]

en_cours_livraison_transporteur (E):
  transporteur_recoit_medicaments → rdv_a_fixer (F)

rdv_a_fixer (F):
  rdv_fixe → en_cours_livraison_patient (G)

en_cours_livraison_patient (G):
  patient_recoit_medicaments → traitee (H)

traitee (H):
  [aucune transition — état terminal]
```

---

## Migration SQL (résumé)

```sql
-- 1. Ajouter colonnes à demandes
ALTER TABLE demandes
  ADD COLUMN acheteur_id UUID REFERENCES profiles(id),
  ADD COLUMN acheteur_prenom VARCHAR,
  ADD COLUMN acheteur_locked_until TIMESTAMPTZ,
  ADD COLUMN transporteur_locked_until TIMESTAMPTZ,
  ADD COLUMN single_aidant BOOLEAN DEFAULT FALSE;

-- 2. Mettre à jour la valeur par défaut du statut
ALTER TABLE demandes ALTER COLUMN statut SET DEFAULT 'nouvelle_demande';

-- 3. Supprimer colonne cagnotte-related de propositions
ALTER TABLE propositions DROP COLUMN IF EXISTS montant_contribue;

-- 4. Ajouter event_type à notification_emails
ALTER TABLE notification_emails
  ADD COLUMN event_type VARCHAR DEFAULT 'rdv_patient',
  ADD COLUMN destinataire_id UUID;

-- 5. Remplacer contrainte UNIQUE
ALTER TABLE notification_emails DROP CONSTRAINT IF EXISTS notification_emails_demande_id_key;
ALTER TABLE notification_emails ADD CONSTRAINT notification_emails_demande_event_key
  UNIQUE (demande_id, event_type);

-- 6. Supprimer tables cagnotte
DROP TABLE IF EXISTS contributions;
DROP TABLE IF EXISTS cagnottes;

-- NB: La colonne statut sur demandes est VARCHAR, pas un type ENUM Postgres.
-- Les nouvelles valeurs de statut sont gérées applicativement (TypeScript).
-- Si statut est un ENUM Postgres, ajouter les nouvelles valeurs avec ALTER TYPE.
```
