-- Migration 004: Politiques RLS manquantes découvertes lors de la validation E2E
-- Cagnottes INSERT : le patient peut créer la cagnotte de sa demande
DROP POLICY IF EXISTS "cagnottes_insert" ON cagnottes;
CREATE POLICY "cagnottes_insert" ON cagnottes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.demandes
      WHERE demandes.id = cagnottes.demande_id
        AND demandes.patient_id = auth.uid()
    )
  );
