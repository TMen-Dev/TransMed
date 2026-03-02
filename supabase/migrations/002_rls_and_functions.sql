-- Migration 002: RLS, politiques, fonction atomique, Realtime

-- Fonction helper rôle courant
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Activation RLS
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cagnottes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE propositions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances     ENABLE ROW LEVEL SECURITY;

-- Politiques profiles
DROP POLICY IF EXISTS "profiles_self" ON profiles;
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (id = auth.uid());

-- Politiques demandes
DROP POLICY IF EXISTS "demandes_select" ON demandes;
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    (current_user_role() = 'patient' AND patient_id = auth.uid())
    OR
    (current_user_role() = 'aidant' AND statut IN (
      'attente_fonds_et_transporteur',
      'fonds_atteints',
      'transporteur_disponible'
    ))
    OR patient_id = auth.uid()
  );

DROP POLICY IF EXISTS "demandes_insert" ON demandes;
CREATE POLICY "demandes_insert" ON demandes
  FOR INSERT WITH CHECK (
    current_user_role() = 'patient' AND patient_id = auth.uid()
  );

DROP POLICY IF EXISTS "demandes_update" ON demandes;
CREATE POLICY "demandes_update" ON demandes
  FOR UPDATE USING (patient_id = auth.uid() OR current_user_role() = 'aidant');

-- Politiques medicaments
DROP POLICY IF EXISTS "medicaments_select" ON medicaments;
CREATE POLICY "medicaments_select" ON medicaments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = medicaments.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

DROP POLICY IF EXISTS "medicaments_insert" ON medicaments;
CREATE POLICY "medicaments_insert" ON medicaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = medicaments.demande_id
            AND demandes.patient_id = auth.uid())
  );

-- Politiques cagnottes
DROP POLICY IF EXISTS "cagnottes_select" ON cagnottes;
CREATE POLICY "cagnottes_select" ON cagnottes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = cagnottes.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

DROP POLICY IF EXISTS "cagnottes_update" ON cagnottes;
CREATE POLICY "cagnottes_update" ON cagnottes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = cagnottes.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

-- Politiques contributions
DROP POLICY IF EXISTS "contributions_insert" ON contributions;
CREATE POLICY "contributions_insert" ON contributions
  FOR INSERT WITH CHECK (current_user_role() = 'aidant' AND aidant_id = auth.uid());

DROP POLICY IF EXISTS "contributions_select" ON contributions;
CREATE POLICY "contributions_select" ON contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cagnottes c
            JOIN demandes d ON d.id = c.demande_id
            WHERE c.id = contributions.cagnotte_id
            AND (d.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

-- Politiques propositions
DROP POLICY IF EXISTS "propositions_select" ON propositions;
CREATE POLICY "propositions_select" ON propositions
  FOR SELECT USING (
    aidant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM demandes WHERE demandes.id = propositions.demande_id
               AND demandes.patient_id = auth.uid())
    OR current_user_role() = 'aidant'
  );

DROP POLICY IF EXISTS "propositions_insert" ON propositions;
CREATE POLICY "propositions_insert" ON propositions
  FOR INSERT WITH CHECK (current_user_role() = 'aidant' AND aidant_id = auth.uid());

-- Politiques messages
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = messages.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auteur_id = auth.uid()
    AND EXISTS (SELECT 1 FROM demandes WHERE demandes.id = messages.demande_id
                AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

-- Politiques ordonnances
DROP POLICY IF EXISTS "ordonnances_select" ON ordonnances;
CREATE POLICY "ordonnances_select" ON ordonnances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes
            WHERE demandes.id = ordonnances.demande_id
            AND demandes.patient_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM propositions
            WHERE propositions.demande_id = ordonnances.demande_id
            AND propositions.aidant_id = auth.uid()
            AND propositions.type IN ('prop1_cagnotte', 'prop3_achat_transport'))
  );

DROP POLICY IF EXISTS "ordonnances_insert" ON ordonnances;
CREATE POLICY "ordonnances_insert" ON ordonnances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM demandes
            WHERE demandes.id = ordonnances.demande_id
            AND demandes.patient_id = auth.uid())
  );

-- Fonction atomique update_demande_statut
CREATE OR REPLACE FUNCTION update_demande_statut(
  p_demande_id UUID,
  p_expected_statut TEXT,
  p_new_statut TEXT
) RETURNS SETOF demandes AS $$
BEGIN
  RETURN QUERY
  UPDATE demandes
  SET statut = p_new_statut, updated_at = NOW()
  WHERE id = p_demande_id AND statut = p_expected_statut
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STATUT_MISMATCH';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Realtime sur messages et demandes
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE demandes;
