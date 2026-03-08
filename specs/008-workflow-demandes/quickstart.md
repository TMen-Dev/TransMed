# Quickstart: 008-workflow-demandes

## Résumé des changements

Refonte complète du workflow des demandes. Suppression du modèle cagnotte (collecte de fonds), introduction de 3 types de propositions et 8 états couvrant 3 scénarios distincts.

---

## Étape 1 — Migration base de données Supabase

Dans le **SQL Editor** du projet Supabase (dashboard), exécuter dans l'ordre :

```sql
-- 1. Colonnes supplémentaires sur demandes
ALTER TABLE demandes
  ADD COLUMN IF NOT EXISTS acheteur_id UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS acheteur_prenom VARCHAR,
  ADD COLUMN IF NOT EXISTS acheteur_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transporteur_locked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS single_aidant BOOLEAN DEFAULT FALSE;

-- 2. Remettre les statuts existants à la nouvelle valeur initiale
-- (les demandes en dev peuvent être réinitialisées)
UPDATE demandes SET statut = 'nouvelle_demande' WHERE statut IN (
  'attente_fonds_et_transporteur', 'fonds_atteints', 'transporteur_disponible'
);
UPDATE demandes SET statut = 'rdv_a_fixer' WHERE statut = 'pret_acceptation_patient';
UPDATE demandes SET statut = 'en_cours_livraison_transporteur' WHERE statut = 'livraison_confirmee';
UPDATE demandes SET statut = 'en_cours_livraison_patient' WHERE statut = 'livree';
-- 'traitee' reste inchangé

-- 3. Mettre à jour les propositions
UPDATE propositions SET type = 'prop_transport' WHERE type = 'prop2_transport';
UPDATE propositions SET type = 'prop_achat_transport' WHERE type = 'prop3_achat_transport';
DELETE FROM propositions WHERE type = 'prop1_cagnotte';
ALTER TABLE propositions DROP COLUMN IF EXISTS montant_contribue;

-- 4. Étendre notification_emails
ALTER TABLE notification_emails
  ADD COLUMN IF NOT EXISTS event_type VARCHAR DEFAULT 'rdv_patient',
  ADD COLUMN IF NOT EXISTS destinataire_id UUID;
ALTER TABLE notification_emails DROP CONSTRAINT IF EXISTS notification_emails_demande_id_key;
ALTER TABLE notification_emails
  ADD CONSTRAINT notification_emails_demande_event_key UNIQUE (demande_id, event_type);

-- 5. Supprimer tables cagnotte (données de dev)
DROP TABLE IF EXISTS contributions;
DROP TABLE IF EXISTS cagnottes;
```

---

## Étape 2 — Fichiers à supprimer

```bash
rm src/types/cagnotte.types.ts
rm src/stores/cagnotte.store.ts
rm src/services/interfaces/ICagnotteService.ts
rm src/services/mock/MockCagnotteService.ts
rm src/services/mock/data/cagnottes.mock.ts
rm src/services/supabase/SupabaseCagnotteService.ts
rm src/components/CagnotteProgress.vue
rm src/components/ContributionForm.vue
```

---

## Étape 3 — Fichiers à modifier (ordre d'implémentation)

1. `src/types/demande.types.ts` — nouveaux types `StatutDemande`, `TypeEvenement`, interface `Demande`
2. `src/types/proposition.types.ts` — nouveau `TypeProposition`, suppression `montantContribue`
3. `src/services/demandeStateMachine.ts` — nouvelle table TRANSITIONS
4. `src/services/interfaces/IDemandeService.ts` — nouvelles méthodes
5. `src/services/interfaces/IPropositionService.ts` — update contrat
6. `src/services/mock/MockDemandeService.ts` — implémentation mock
7. `src/services/mock/MockPropositionService.ts` — nouvelles règles de verrou
8. `src/services/mock/data/demandes.mock.ts` — données de test
9. `src/services/mock/data/propositions.mock.ts` — données de test
10. `src/services/supabase/SupabaseDemandeService.ts` — mapping + nouvelles méthodes
11. `src/services/supabase/SupabasePropositionService.ts` — verrous + nouveaux types
12. `src/services/index.ts` — supprimer exports cagnotte
13. `src/stores/demandes.store.ts` — nouvelles actions, supprimer cagnotte
14. `src/stores/propositions.store.ts` — nouvelle logique orchestration
15. `src/components/StatutBadge.vue` — nouveaux libellés et couleurs
16. `src/components/StatutTimeline.vue` — nouvelles étapes (A→H)
17. `src/components/PropositionPanel.vue` — nouveaux types, suppression cagnotte
18. `src/views/DetailDemandeView.vue` — nouveaux boutons contextuels
19. `src/views/ListeDemandesView.vue` — mise à jour filtre statuts actifs
20. `supabase/functions/notify-patient/index.ts` — multi-événements

---

## Étape 4 — Tests

```bash
# Lancer le serveur web
ionic serve

# Tester scénario 1 : un aidant fait prop_achat_transport → vérifie passage A→D→F→G→H
# Tester scénario 2 : aidant A prop_achat_envoi (A→B), aidant B prop_transport (B→D), acheteur envoie (D→E), transporteur reçoit (E→F→G→H)
# Tester scénario 3 : aidant B prop_transport (A→C), aidant A prop_achat_envoi (C→D), suite identique scénario 2
# Tester verrous : soumettre deux prop_achat_envoi → vérifier refus du second
```

---

## Constantes configurables

```typescript
// src/services/supabase/SupabasePropositionService.ts
const LOCK_DURATION_HOURS = 24
```
