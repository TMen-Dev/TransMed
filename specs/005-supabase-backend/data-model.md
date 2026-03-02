# Data Model: Intégration backend persistant (Supabase)

**Feature**: 005-supabase-backend | **Date**: 2026-03-01

---

## Schéma PostgreSQL

### Table `profiles` (extension de `auth.users`)

```sql
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom      TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('patient', 'aidant')),
  adresse_defaut TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-créé via trigger après inscription Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

---

### Table `demandes`

```sql
CREATE TABLE demandes (
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

-- Index sur patient_id et statut (requêtes courantes)
CREATE INDEX idx_demandes_patient_id ON demandes(patient_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);

-- Auto-update updated_at
CREATE TRIGGER set_updated_at_demandes
  BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE PROCEDURE moddatetime(updated_at);
```

---

### Table `medicaments`

```sql
CREATE TABLE medicaments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id  UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  nom         TEXT NOT NULL,
  quantite    INTEGER NOT NULL CHECK (quantite > 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medicaments_demande_id ON medicaments(demande_id);
```

---

### Table `cagnottes`

```sql
CREATE TABLE cagnottes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id        UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  montant_cible     NUMERIC(10,2),       -- NULL jusqu'à évaluation acheteur
  montant_collecte  NUMERIC(10,2) NOT NULL DEFAULT 0,
  statut            TEXT NOT NULL DEFAULT 'en_attente_evaluation'
                      CHECK (statut IN ('en_attente_evaluation', 'ouverte', 'atteinte')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### Table `contributions`

```sql
CREATE TABLE contributions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id     UUID NOT NULL REFERENCES cagnottes(id) ON DELETE CASCADE,
  aidant_id       UUID NOT NULL REFERENCES profiles(id),
  aidant_prenom   TEXT NOT NULL,
  montant         NUMERIC(10,2) NOT NULL CHECK (montant > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contributions_cagnotte_id ON contributions(cagnotte_id);
```

---

### Table `propositions`

```sql
CREATE TABLE propositions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id        UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  aidant_id         UUID NOT NULL REFERENCES profiles(id),
  aidant_prenom     TEXT NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('prop1_cagnotte', 'prop2_transport', 'prop3_achat_transport')),
  montant_contribue NUMERIC(10,2),  -- uniquement pour prop1_cagnotte
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_propositions_demande_id ON propositions(demande_id);
CREATE INDEX idx_propositions_aidant_id ON propositions(aidant_id);

-- Contrainte : un seul transporteur par demande
CREATE UNIQUE INDEX idx_unique_transporteur
  ON propositions(demande_id)
  WHERE type = 'prop2_transport';
```

---

### Table `messages`

```sql
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id    UUID NOT NULL REFERENCES demandes(id) ON DELETE CASCADE,
  auteur_id     UUID NOT NULL REFERENCES profiles(id),
  auteur_prenom TEXT NOT NULL,
  auteur_role   TEXT NOT NULL CHECK (auteur_role IN ('patient', 'aidant')),
  contenu       TEXT NOT NULL CHECK (char_length(contenu) BETWEEN 1 AND 1000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_demande_id ON messages(demande_id);

-- Activer Realtime sur cette table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

### Table `ordonnances`

```sql
CREATE TABLE ordonnances (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id    UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,  -- ex: "{demande_id}/ordonnance.pdf"
  mime_type     TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  taille_octets INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Row Level Security (RLS)

### Activation globale

```sql
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicaments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cagnottes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE propositions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordonnances     ENABLE ROW LEVEL SECURITY;
```

### Fonction helper : rôle courant

```sql
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

### Politiques — `profiles`

```sql
-- Chaque utilisateur voit et modifie uniquement son propre profil
CREATE POLICY "profiles_self" ON profiles
  FOR ALL USING (id = auth.uid());
```

### Politiques — `demandes`

```sql
-- Patient : voit ses propres demandes uniquement
-- Aidant : voit les demandes actives (en attente d'aide)
CREATE POLICY "demandes_select" ON demandes
  FOR SELECT USING (
    (current_user_role() = 'patient' AND patient_id = auth.uid())
    OR
    (current_user_role() = 'aidant' AND statut IN (
      'attente_fonds_et_transporteur',
      'fonds_atteints',
      'transporteur_disponible'
    ))
  );

-- Patient : créer uniquement ses propres demandes
CREATE POLICY "demandes_insert" ON demandes
  FOR INSERT WITH CHECK (
    current_user_role() = 'patient' AND patient_id = auth.uid()
  );

-- Mise à jour par le propriétaire (patient) ou service (via SECURITY DEFINER function)
CREATE POLICY "demandes_update" ON demandes
  FOR UPDATE USING (patient_id = auth.uid());
```

### Politiques — `medicaments`

```sql
CREATE POLICY "medicaments_select" ON medicaments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = medicaments.demande_id
            AND (demandes.patient_id = auth.uid()
                 OR current_user_role() = 'aidant'))
  );

CREATE POLICY "medicaments_insert" ON medicaments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = medicaments.demande_id
            AND demandes.patient_id = auth.uid())
  );
```

### Politiques — `cagnottes` et `contributions`

```sql
-- Cagnottes : visible par tous (patient propriétaire + aidants sur demande active)
CREATE POLICY "cagnottes_select" ON cagnottes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = cagnottes.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

-- Contributions : aidants uniquement
CREATE POLICY "contributions_insert" ON contributions
  FOR INSERT WITH CHECK (current_user_role() = 'aidant' AND aidant_id = auth.uid());

CREATE POLICY "contributions_select" ON contributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM cagnottes c
            JOIN demandes d ON d.id = c.demande_id
            WHERE c.id = contributions.cagnotte_id
            AND (d.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );
```

### Politiques — `propositions`

```sql
-- Visibles par le patient de la demande et tous les aidants
CREATE POLICY "propositions_select" ON propositions
  FOR SELECT USING (
    aidant_id = auth.uid()
    OR EXISTS (SELECT 1 FROM demandes WHERE demandes.id = propositions.demande_id
               AND demandes.patient_id = auth.uid())
    OR current_user_role() = 'aidant'
  );

-- Aidant soumet uniquement ses propres propositions
CREATE POLICY "propositions_insert" ON propositions
  FOR INSERT WITH CHECK (current_user_role() = 'aidant' AND aidant_id = auth.uid());
```

### Politiques — `messages`

```sql
-- Tous les participants d'une demande peuvent lire les messages
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM demandes WHERE demandes.id = messages.demande_id
            AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );

-- Tout utilisateur authentifié peut envoyer un message sur une demande accessible
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auteur_id = auth.uid()
    AND EXISTS (SELECT 1 FROM demandes WHERE demandes.id = messages.demande_id
                AND (demandes.patient_id = auth.uid() OR current_user_role() = 'aidant'))
  );
```

### Politiques — `ordonnances`

```sql
-- Patient propriétaire OU aidant avec proposition prop1/prop3 (acheteur)
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

-- Insertion : patient propriétaire uniquement
CREATE POLICY "ordonnances_insert" ON ordonnances
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM demandes
            WHERE demandes.id = ordonnances.demande_id
            AND demandes.patient_id = auth.uid())
  );
```

### Politiques Storage — bucket `ordonnances`

```sql
-- Dans le dashboard Supabase > Storage > Policies (ou via API)
-- Bucket: ordonnances (PRIVATE)

-- SELECT (download) : même règle que table ordonnances
INSERT INTO storage.policies (bucket_id, name, definition)
VALUES (
  'ordonnances',
  'ordonnances_download',
  $$EXISTS (
    SELECT 1 FROM propositions p
    WHERE split_part(name, '/', 1) = p.demande_id::text
    AND p.aidant_id = auth.uid()
    AND p.type IN ('prop1_cagnotte', 'prop3_achat_transport')
  ) OR EXISTS (
    SELECT 1 FROM demandes d
    WHERE split_part(name, '/', 1) = d.id::text
    AND d.patient_id = auth.uid()
  )$$
);

-- INSERT (upload) : patient uniquement
INSERT INTO storage.policies (bucket_id, name, definition, operation)
VALUES (
  'ordonnances',
  'ordonnances_upload',
  'auth.uid() IS NOT NULL',
  'INSERT'
);
```

---

## Fonction atomique — updateStatut

```sql
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
```

---

## Mapping TypeScript ↔ PostgreSQL

| TypeScript (existant) | PostgreSQL | Notes |
|----------------------|-----------|-------|
| `Utilisateur.id` | `profiles.id` (UUID) | UUID Supabase auth |
| `Utilisateur.email` | `auth.users.email` | Via Supabase Auth |
| `Demande.patientId` | `demandes.patient_id` | snake_case en DB |
| `Demande.createdAt` | `demandes.created_at` | ISO string ↔ TIMESTAMPTZ |
| `Ordonance.base64Data` | n/a | Remplacé par `storage_path` + signed URL |
| `Ordonance.signedUrl` | généré dynamiquement | Non persisté en DB |
| `Cagnotte.contributions` | table séparée `contributions` | Chargé via JOIN ou requête séparée |
| `Demande.propositions` | table séparée `propositions` | Idem |
