# Data Model: Notification patient — demande prête

**Feature**: 006-patient-notifications | **Date**: 2026-03-01
**Dépendance**: Étend le schéma de 005-supabase-backend

---

## Extension schema 005 — `profiles`

```sql
-- Ajouter l'email dans profiles (synchronisé depuis auth.users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Mettre à jour le trigger handle_new_user pour inclure l'email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de sync si l'email change dans Supabase Auth
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE sync_profile_email();
```

---

## Nouvelle table `notification_emails`

```sql
CREATE TABLE notification_emails (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id        UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES profiles(id),
  patient_email     TEXT NOT NULL,
  statut            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (statut IN ('pending', 'sent', 'failed')),
  tentatives        INTEGER NOT NULL DEFAULT 0,
  derniere_tentative TIMESTAMPTZ,
  envoyee_at        TIMESTAMPTZ,
  resend_email_id   TEXT,         -- ID retourné par l'API Resend (pour traçabilité)
  erreur            TEXT,         -- Message d'erreur si échec
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes de retry
CREATE INDEX idx_notification_emails_retry
  ON notification_emails(statut, tentatives, derniere_tentative)
  WHERE statut = 'failed' AND tentatives < 3;

-- Activer Realtime (confirmation côté aidant)
ALTER PUBLICATION supabase_realtime ADD TABLE notification_emails;
```

**Note sur la contrainte UNIQUE** : `demande_id UNIQUE` garantit qu'une seule ligne de notification existe par demande — double protection avec le flag `email_notif_envoyee` sur la table `demandes`.

---

## RLS — `notification_emails`

```sql
-- La table est écrite par les Edge Functions (service_role — bypass RLS)
-- Les utilisateurs authentifiés peuvent lire leur propre notification (pour le Realtime client)
ALTER TABLE notification_emails ENABLE ROW LEVEL SECURITY;

-- Patient : voir la notification de ses propres demandes
CREATE POLICY "patient_own_notifications" ON notification_emails
  FOR SELECT USING (
    patient_id = auth.uid()
  );

-- Aidant : voir les notifications des demandes actives (pour afficher le badge "Patient notifié")
CREATE POLICY "aidant_view_notifications" ON notification_emails
  FOR SELECT USING (
    current_user_role() = 'aidant'
    AND EXISTS (
      SELECT 1 FROM propositions
      WHERE propositions.demande_id = notification_emails.demande_id
      AND propositions.aidant_id = auth.uid()
    )
  );

-- INSERT/UPDATE uniquement via service_role (Edge Functions) — pas de politique client
```

---

## Extension `profiles` — impact sur RLS existant

Aucune modification des politiques RLS de `profiles` (005) — la colonne `email` est ajoutée sans changer les permissions.

---

## TypeScript types — `src/types/notification.types.ts`

```typescript
export type StatutNotification = 'pending' | 'sent' | 'failed'

export interface NotificationEmail {
  id: string
  demandeId: string
  patientId: string
  patientEmail: string
  statut: StatutNotification
  tentatives: number
  derniereTemptative?: string
  envoyeeAt?: string
  resendEmailId?: string
  erreur?: string
  createdAt: string
}
```

---

## Mapping snake_case → camelCase

| PostgreSQL | TypeScript |
|-----------|-----------|
| `demande_id` | `demandeId` |
| `patient_id` | `patientId` |
| `patient_email` | `patientEmail` |
| `derniere_tentative` | `derniereTemptative` |
| `envoyee_at` | `envoyeeAt` |
| `resend_email_id` | `resendEmailId` |
| `created_at` | `createdAt` |

---

## Flux de données complet

```
demandes.statut → 'pret_acceptation_patient'
         ↓  (Database Webhook)
notify-patient Edge Function
  → profiles.email (patient_id)
  → Resend API → email envoyé
  → INSERT notification_emails(statut='sent', envoyee_at=NOW())
  → UPDATE demandes SET email_notif_envoyee=true
         ↓  (Supabase Realtime)
useNotification.ts listener
  → notifTriggered = true
  → toast aidant "Patient notifié"

--- En cas d'échec ---
notify-patient Edge Function
  → INSERT notification_emails(statut='failed', erreur='...')
         ↓  (cron toutes les 5 min)
retry-notifications Edge Function
  → SELECT notification_emails WHERE statut='failed' AND tentatives < 3
  → Resend API (nouvelle tentative)
  → UPDATE notification_emails(statut='sent' OU tentatives++)
```
