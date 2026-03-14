-- 009_ordonnances_aidant_access.sql
-- Objectif : permettre à tout aidant authentifié de consulter l'ordonnance d'une demande,
-- même sans avoir encore posé une proposition (nécessaire pour évaluer la demande et décider d'aider).
-- Auparavant, seuls les aidants ayant une proposition existante pouvaient lire l'ordonnance.

DROP POLICY IF EXISTS "ordonnances_select" ON ordonnances;
CREATE POLICY "ordonnances_select" ON ordonnances
  FOR SELECT USING (
    -- Patient propriétaire de la demande
    EXISTS (
      SELECT 1 FROM demandes
      WHERE demandes.id = ordonnances.demande_id
        AND demandes.patient_id = auth.uid()
    )
    OR
    -- Tout aidant authentifié (doit voir l'ordonnance pour évaluer la demande et acheter les médicaments)
    current_user_role() = 'aidant'
  );
