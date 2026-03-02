-- Migration 005: Correction politique SELECT demandes
-- Problème découvert en validation E2E :
-- 1. 'pret_acceptation_patient' manquait dans les statuts visibles par les aidants
--    (présent dans STATUTS_ACTIFS_AIDANT côté app mais oublié côté DB)
-- 2. Un aidant assigné comme transporteur doit voir sa livraison jusqu'à 'livree'
-- 3. PostgreSQL vérifie SELECT policy avant UPDATE → aidant ne peut pas PATCH sans SELECT

DROP POLICY IF EXISTS "demandes_select" ON demandes;
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    -- Patient voit toutes ses propres demandes (cycle complet)
    patient_id = auth.uid()
    OR
    -- Aidant voit la liste des demandes en cours de collecte (statuts actifs)
    (current_user_role() = 'aidant' AND statut IN (
      'attente_fonds_et_transporteur',
      'fonds_atteints',
      'transporteur_disponible',
      'pret_acceptation_patient'
    ))
    OR
    -- Aidant assigné comme transporteur voit sa livraison jusqu'à la fin
    transporteur_id = auth.uid()
  );
