# Data Model: TransMed v1.2 — Workflow complet de livraison

**Date**: 2026-03-01

---

## StatutDemande (type étendu)

```
attente_fonds_et_transporteur   // 1 — initial
fonds_atteints                  // 2 — cagnotte complète, attend transporteur
transporteur_disponible         // 3 — a un transporteur, attend les fonds
pret_acceptation_patient        // 4 — les deux conditions réunies + email envoyé
livraison_confirmee             // 5 — patient a confirmé (NOUVEAU, remplace en_cours_livraison)
livree                          // 6 — transporteur a livré (NOUVEAU)
traitee                         // 7 — patient a confirmé réception (état terminal)
```

**Supprimé**: `en_cours_livraison` → remplacé par `livraison_confirmee`.

---

## TypeEvenement (étendu)

```
prop1_contribution              // Prop1 — contribution sans atteindre l'objectif
prop1_cagnotte_atteinte         // Prop1 — contribution qui remplit la cagnotte
prop2_transport                 // Prop2 — aidant propose transport
prop3_achat_transport           // Prop3 — aidant propose achat + transport
patient_confirme_livraison      // NOUVEAU: pret_acceptation_patient → livraison_confirmee
transporteur_livre              // NOUVEAU: livraison_confirmee → livree
patient_recoit_medicaments      // NOUVEAU: livree → traitee
```

**Supprimés**: `patient_confirme` et `aidant_livre` → remplacés par les 3 nouveaux.

---

## Demande (interface étendue)

```typescript
interface Demande {
  id: string
  patientId: string
  patientPrenom: string
  nom: string                     // NOUVEAU — ex: "Alice — Alger"
  urgente: boolean                // NOUVEAU — badge URGENT si true
  medicaments: Medicament[]
  adresseLivraison: string
  statut: StatutDemande
  ordonanceId: string
  cagnotteId: string
  propositions: Proposition[]
  transporteurId?: string
  transporteurPrenom?: string
  emailNotifEnvoyee?: boolean
  messageRemerciement?: string    // NOUVEAU — saisi lors de la confirmation réception
  createdAt: string
  updatedAt: string
  deliveredAt?: string            // défini à statut traitee
}
```

---

## CreateDemandeDto (étendu)

```typescript
interface CreateDemandeDto {
  patientId: string
  patientPrenom: string
  nom: string                     // NOUVEAU — fourni par le formulaire
  urgente: boolean                // NOUVEAU — fourni par le formulaire
  medicaments: Medicament[]
  adresseLivraison: string
  ordonanceBase64: string
  ordonanceMimeType: 'image/jpeg' | 'image/png' | 'application/pdf'
}
```

---

## Machine d'états — transitions complètes

```
attente_fonds_et_transporteur:
  prop1_contribution        → attente_fonds_et_transporteur
  prop1_cagnotte_atteinte   → fonds_atteints
  prop2_transport           → transporteur_disponible
  prop3_achat_transport     → pret_acceptation_patient

fonds_atteints:
  prop2_transport           → pret_acceptation_patient
  prop3_achat_transport     → pret_acceptation_patient

transporteur_disponible:
  prop1_contribution        → transporteur_disponible
  prop1_cagnotte_atteinte   → pret_acceptation_patient
  prop3_achat_transport     → pret_acceptation_patient

pret_acceptation_patient:
  patient_confirme_livraison → livraison_confirmee   ← NOUVEAU

livraison_confirmee:          ← NOUVEAU STATUT
  transporteur_livre         → livree                ← NOUVEAU

livree:                       ← NOUVEAU STATUT
  patient_recoit_medicaments → traitee               ← NOUVEAU

traitee: {}  // terminal
```

---

## Mock data — demandes à ajouter

| ID | Patient | Statut | Cagnotte | Transporteur | Notes |
|----|---------|--------|----------|--------------|-------|
| demande-003 | Karim | `attente_fonds_et_transporteur` | 0/90€ | — | Sans proposition |
| demande-004 | Alice | `fonds_atteints` | 150/150€ | — | Cagnotte pleine |
| demande-005 | Alice | `pret_acceptation_patient` | 120/120€ | Benjamin | emailNotifEnvoyee=true |
| demande-006 | Alice | `livraison_confirmee` | 80/80€ | Benjamin | Patient a confirmé |
| demande-007 | Alice | `livree` | 60/60€ | Leila | Transporteur a livré |
| demande-008 | Alice | `traitee` | 100/100€ | Benjamin | + messageRemerciement |

Note: `demande-001` (existante) reste `transporteur_disponible` avec cagnotte 45/120€.
Note: `demande-002` (existante) reste `attente_fonds_et_transporteur` d'Alice sans prop.
