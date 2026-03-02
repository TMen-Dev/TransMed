-- Migration 003: Fix SET search_path sur fonctions SECURITY DEFINER
-- Sans SET search_path = public, les fonctions SECURITY DEFINER peuvent
-- échouer avec "Database error saving new user" car le search_path du
-- contexte auth.users est différent du contexte applicatif.
-- Ref: https://supabase.com/docs/guides/database/functions#security-definer-vs-invoker

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION update_demande_statut(
  p_demande_id UUID,
  p_expected_statut TEXT,
  p_new_statut TEXT
) RETURNS SETOF public.demandes AS $$
BEGIN
  RETURN QUERY
  UPDATE public.demandes
  SET statut = p_new_statut, updated_at = NOW()
  WHERE id = p_demande_id AND statut = p_expected_statut
  RETURNING *;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STATUT_MISMATCH';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
