-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 007 — Refactoring des statuts workflow (feature 008)
-- Contexte : les statuts dans la DB utilisent encore l'ancienne nomenclature
-- pré-feature-008. Cette migration migre les données et corrige la contrainte
-- CHECK + la politique RLS + la valeur DEFAULT.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Supprimer la contrainte CHECK existante (anciens statuts) ──────────────
ALTER TABLE demandes DROP CONSTRAINT IF EXISTS demandes_statut_check;

-- ── 2. Migrer les données existantes ─────────────────────────────────────────
UPDATE demandes SET statut = 'nouvelle_demande'
  WHERE statut = 'attente_fonds_et_transporteur';

UPDATE demandes SET statut = 'medicaments_achetes_attente_transporteur'
  WHERE statut = 'fonds_atteints';

UPDATE demandes SET statut = 'transporteur_disponible_attente_acheteur'
  WHERE statut = 'transporteur_disponible';

UPDATE demandes SET statut = 'transporteur_et_medicaments_prets'
  WHERE statut = 'pret_acceptation_patient';

-- 'livraison_confirmee' et 'livree' → traitee (terminal)
UPDATE demandes SET statut = 'traitee'
  WHERE statut IN ('livraison_confirmee', 'livree');

-- ── 3. Ajouter la nouvelle contrainte CHECK ───────────────────────────────────
ALTER TABLE demandes
  ADD CONSTRAINT demandes_statut_check
  CHECK (statut IN (
    'nouvelle_demande',                         -- A
    'medicaments_achetes_attente_transporteur',  -- B
    'transporteur_disponible_attente_acheteur',  -- C
    'transporteur_et_medicaments_prets',         -- D
    'en_cours_livraison_transporteur',           -- E
    'rdv_a_fixer',                               -- F
    'en_cours_livraison_patient',                -- G
    'traitee'                                    -- H
  ));

-- ── 4. Mettre à jour la valeur par défaut ─────────────────────────────────────
ALTER TABLE demandes
  ALTER COLUMN statut SET DEFAULT 'nouvelle_demande';

-- ── 5. Mettre à jour la politique RLS SELECT (anciens statuts → nouveaux) ─────
DROP POLICY IF EXISTS "demandes_select" ON demandes;
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    -- Patient voit toutes ses propres demandes (cycle complet)
    patient_id = auth.uid()
    OR
    -- Aidant voit les demandes actives (en attente de proposition)
    (current_user_role() = 'aidant' AND statut IN (
      'nouvelle_demande',
      'medicaments_achetes_attente_transporteur',
      'transporteur_disponible_attente_acheteur',
      'transporteur_et_medicaments_prets'
    ))
    OR
    -- Aidant assigné (acheteur ou transporteur) voit sa demande jusqu'à la fin
    acheteur_id = auth.uid()
    OR
    transporteur_id = auth.uid()
  );
