-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008 — Refactoring des propositions workflow (feature 008)
-- Contexte : la table propositions utilise encore l'ancienne nomenclature de
-- types (prop1_cagnotte, prop2_transport, prop3_achat_transport). Cette
-- migration migre les données et corrige la contrainte CHECK + index uniques.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Supprimer la contrainte CHECK existante (anciens types) ───────────────
ALTER TABLE propositions DROP CONSTRAINT IF EXISTS propositions_type_check;

-- ── 2. Migrer les données existantes ─────────────────────────────────────────
-- prop1_cagnotte n'a plus de correspondance directe → prop_achat_envoi
UPDATE propositions SET type = 'prop_achat_envoi'
  WHERE type = 'prop1_cagnotte';

-- prop2_transport → prop_transport
UPDATE propositions SET type = 'prop_transport'
  WHERE type = 'prop2_transport';

-- prop3_achat_transport → prop_achat_transport
UPDATE propositions SET type = 'prop_achat_transport'
  WHERE type = 'prop3_achat_transport';

-- ── 3. Supprimer l'index unique sur l'ancien type prop2_transport ─────────────
DROP INDEX IF EXISTS idx_unique_transporteur;

-- ── 3b. Nettoyer les propositions dupliquées (données de dev) ────────────────
-- Pour chaque demande ayant plusieurs propositions du même rôle acheteur,
-- on ne garde que la plus récente.
DELETE FROM propositions
WHERE id NOT IN (
  SELECT DISTINCT ON (demande_id)
    id
  FROM propositions
  WHERE type IN ('prop_achat_envoi', 'prop_achat_transport')
  ORDER BY demande_id, created_at DESC
)
AND type IN ('prop_achat_envoi', 'prop_achat_transport');

-- Idem pour le rôle transporteur.
DELETE FROM propositions
WHERE id NOT IN (
  SELECT DISTINCT ON (demande_id)
    id
  FROM propositions
  WHERE type IN ('prop_transport', 'prop_achat_transport')
  ORDER BY demande_id, created_at DESC
)
AND type IN ('prop_transport', 'prop_achat_transport');

-- ── 4. Ajouter la nouvelle contrainte CHECK ───────────────────────────────────
ALTER TABLE propositions
  ADD CONSTRAINT propositions_type_check
  CHECK (type IN (
    'prop_achat_envoi',      -- Acheter + envoyer au transporteur
    'prop_transport',        -- Transporter jusqu'au patient
    'prop_achat_transport'   -- Acheter + transporter soi-même (aidant unique)
  ));

-- ── 5. Nouveaux index uniques par type ────────────────────────────────────────
-- Un seul acheteur par demande (prop_achat_envoi ou prop_achat_transport)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_acheteur
  ON propositions(demande_id)
  WHERE type IN ('prop_achat_envoi', 'prop_achat_transport');

-- Un seul transporteur par demande (prop_transport ou prop_achat_transport)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transporteur_new
  ON propositions(demande_id)
  WHERE type IN ('prop_transport', 'prop_achat_transport');

-- ── 6. Supprimer la colonne montant_contribue (supprimée dans feature 008) ───
ALTER TABLE propositions DROP COLUMN IF EXISTS montant_contribue;

-- ── 7. Mettre à jour la politique RLS INSERT sur propositions ─────────────────
-- Les aidants peuvent insérer leurs propres propositions
DROP POLICY IF EXISTS "propositions_insert" ON propositions;
CREATE POLICY "propositions_insert" ON propositions
  FOR INSERT WITH CHECK (
    aidant_id = auth.uid()
  );

-- Les aidants peuvent voir les propositions des demandes auxquelles ils ont accès
DROP POLICY IF EXISTS "propositions_select" ON propositions;
CREATE POLICY "propositions_select" ON propositions
  FOR SELECT USING (
    -- L'aidant voit ses propres propositions
    aidant_id = auth.uid()
    OR
    -- Le patient voit les propositions de ses demandes
    EXISTS (
      SELECT 1 FROM demandes d
      WHERE d.id = propositions.demande_id
        AND d.patient_id = auth.uid()
    )
    OR
    -- Un aidant assigné (acheteur ou transporteur) voit les propositions de sa demande
    EXISTS (
      SELECT 1 FROM demandes d
      WHERE d.id = propositions.demande_id
        AND (d.acheteur_id = auth.uid() OR d.transporteur_id = auth.uid())
    )
  );
