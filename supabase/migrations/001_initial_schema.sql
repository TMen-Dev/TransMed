-- Migration 001: Schéma initial TransMed
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Table profiles (extension de auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom      TEXT,
  role        TEXT CHECK (role IN ('patient', 'aidant')),
  adresse_defaut TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Trigger sync email sur mise à jour auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE sync_profile_email();

-- Table demandes
CREATE TABLE IF NOT EXISTS demandes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id            UUID NOT NULL REFERENCES profiles(id),
  patient_prenom        TEXT NOT NULL,
  nom                   TEXT NOT NULL,
  urgente               BOOLEAN NOT NULL DEFAULT FALSE,
  adresse_livraison     TEXT NOT NULL,
  statut                TEXT NOT NULL DEFAULT 'attente_fonds_et_transporteur'
                          CHECK (statut IN (
                            'attente_fonds_et_transporteur',
                            'fonds_atteints',
                            'transporteur_disponible',
                            'pret_acceptation_patient',
                            'livraison_confirmee',
                            'livree',
                            'traitee'
                          )),
  transporteur_id       UUID REFERENCES profiles(id),
  transporteur_prenom   TEXT,
  email_notif_envoyee   BOOLEAN NOT NULL DEFAULT FALSE,
  message_remerciement  TEXT,
  delivered_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_patient_id ON demandes(patient_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);

DROP TRIGGER IF EXISTS set_updated_at_demandes ON demandes;
CREATE TRIGGER set_updated_at_demandes
  BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);

-- Table medicaments
CREATE TABLE IF NOT EXISTS medicaments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id  UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  quantite    INTEGER NOT NULL CHECK (quantite > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_medicaments_demande_id ON medicaments(demande_id);

-- Table cagnottes
CREATE TABLE IF NOT EXISTS cagnottes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id        UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  montant_cible     NUMERIC(10,2),
  montant_collecte  NUMERIC(10,2) NOT NULL DEFAULT 0,
  statut            TEXT NOT NULL DEFAULT 'en_attente_evaluation'
                      CHECK (statut IN ('en_attente_evaluation', 'ouverte', 'atteinte')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table contributions
CREATE TABLE IF NOT EXISTS contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id     UUID NOT NULL REFERENCES cagnottes(id) ON DELETE CASCADE,
  aidant_id       UUID NOT NULL REFERENCES profiles(id),
  aidant_prenom   TEXT NOT NULL,
  montant         NUMERIC(10,2) NOT NULL CHECK (montant > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_cagnotte_id ON contributions(cagnotte_id);

-- Table propositions
CREATE TABLE IF NOT EXISTS propositions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id        UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  aidant_id         UUID NOT NULL REFERENCES profiles(id),
  aidant_prenom     TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('prop1_cagnotte', 'prop2_transport', 'prop3_achat_transport')),
  montant_contribue NUMERIC(10,2),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_propositions_demande_id ON propositions(demande_id);
CREATE INDEX IF NOT EXISTS idx_propositions_aidant_id ON propositions(aidant_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_transporteur
  ON propositions(demande_id)
  WHERE type = 'prop2_transport';

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id    UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  auteur_id     UUID NOT NULL REFERENCES profiles(id),
  auteur_prenom TEXT NOT NULL,
  auteur_role   TEXT NOT NULL CHECK (auteur_role IN ('patient', 'aidant')),
  contenu       TEXT NOT NULL CHECK (char_length(contenu) BETWEEN 1 AND 1000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_demande_id ON messages(demande_id);

-- Table ordonnances
CREATE TABLE IF NOT EXISTS ordonnances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id    UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  mime_type     TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  taille_octets INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
