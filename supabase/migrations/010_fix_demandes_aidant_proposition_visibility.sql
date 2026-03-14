-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010 — Visibilité aidant avec proposition (feature 011)
-- Contexte : un aidant ayant émis une proposition sur une demande perdait
-- la visibilité dès le passage en statut E (en_cours_livraison_transporteur)
-- car la politique RLS 007 ne couvrait que acheteur_id et transporteur_id.
--
-- ⚠️ PIÈGE : utiliser EXISTS (SELECT FROM propositions) directement dans
-- demandes_select provoque une récursion infinie car propositions_select
-- fait lui-même EXISTS (SELECT FROM demandes).
-- Solution : fonction SECURITY DEFINER qui bypasse le RLS sur propositions.
-- ─────────────────────────────────────────────────────────────────────────────

-- Fonction helper SECURITY DEFINER : bypasse le RLS de propositions
-- pour éviter la récursion infinie demandes ↔ propositions
CREATE OR REPLACE FUNCTION aidant_a_propose_sur(p_demande_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM propositions
    WHERE demande_id = p_demande_id
      AND aidant_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "demandes_select" ON demandes;
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    -- Patient voit toutes ses propres demandes (cycle complet)
    patient_id = auth.uid()
    OR
    -- Aidant voit les demandes actives (en attente de proposition — statuts A/B/C/D)
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
    OR
    -- Aidant ayant émis une proposition voit la demande jusqu'au statut H (FR-002)
    -- Via fonction SECURITY DEFINER pour éviter récursion infinie RLS
    aidant_a_propose_sur(id)
  );
