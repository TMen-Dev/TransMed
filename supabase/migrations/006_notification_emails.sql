-- Migration 006: Table notification_emails pour le pipeline de notification patient
-- Feature: 006-patient-notifications
-- Note: profiles.email et demandes.email_notif_envoyee existent déjà (migration 001)

-- Table notification_emails
CREATE TABLE IF NOT EXISTS notification_emails (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id         UUID NOT NULL UNIQUE REFERENCES demandes(id) ON DELETE CASCADE,
  patient_id         UUID NOT NULL REFERENCES profiles(id),
  patient_email      TEXT NOT NULL,
  statut             TEXT NOT NULL DEFAULT 'pending'
                       CHECK (statut IN ('pending', 'sent', 'failed')),
  tentatives         INTEGER NOT NULL DEFAULT 0,
  derniere_tentative TIMESTAMPTZ,
  envoyee_at         TIMESTAMPTZ,
  resend_email_id    TEXT,
  erreur             TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour les requêtes de retry (statut='failed' AND tentatives < 3)
CREATE INDEX IF NOT EXISTS idx_notification_emails_retry
  ON notification_emails(statut, tentatives, derniere_tentative)
  WHERE statut = 'failed' AND tentatives < 3;

-- Activer Realtime (confirmation côté aidant via useNotification.ts)
ALTER PUBLICATION supabase_realtime ADD TABLE notification_emails;

-- RLS
ALTER TABLE notification_emails ENABLE ROW LEVEL SECURITY;

-- Patient : voir la notification de ses propres demandes
CREATE POLICY "patient_own_notifications" ON notification_emails
  FOR SELECT USING (
    patient_id = auth.uid()
  );

-- Aidant : voir les notifications des demandes actives
-- (pour afficher le badge "Patient notifié" dans DetailDemandeView)
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
