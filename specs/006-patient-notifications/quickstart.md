# Quickstart — 006-patient-notifications

**Feature**: 006-patient-notifications | **Date**: 2026-03-01
**Prérequis**: 005-supabase-backend installé et configuré (projet Supabase actif, `.env.local` présent)

---

## Vue d'ensemble

Ce guide couvre la mise en place locale des Edge Functions Supabase pour les notifications email patient, depuis la création du compte Resend jusqu'au test bout-en-bout.

---

## Étape 1 — Créer un compte Resend

1. Aller sur [resend.com](https://resend.com) → Sign up (gratuit, 3 000 emails/mois)
2. Vérifier votre email d'inscription
3. Dans le dashboard Resend : **Domains** → **Add Domain**
   - Entrer votre domaine (ex : `transmed.dev`)
   - Ajouter les enregistrements DNS fournis (TXT + MX)
   - Cliquer **Verify DNS Records** (peut prendre 5-10 min)
4. Dans **API Keys** → **Create API Key** → copier la clé (`re_xxxxxxxxxx`)

> **MVP sans domaine vérifié** : Resend permet d'envoyer à votre propre email de compte depuis `onboarding@resend.dev`. Idéal pour les tests initiaux.

---

## Étape 2 — Stocker la clé Resend comme secret Supabase

```bash
# Depuis la racine du projet
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx

# Vérifier
supabase secrets list
```

> **Note** : `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectés automatiquement dans toutes les Edge Functions — ne pas les stocker manuellement.

---

## Étape 3 — Appliquer la migration SQL

```bash
# Appliquer la migration notification_emails
supabase db push

# Ou en développement local
supabase db reset  # recrée tout depuis zéro (migrations/)
```

Vérifier que la table `notification_emails` et les politiques RLS sont créées :

```sql
-- Dans Supabase Studio > SQL Editor
SELECT * FROM notification_emails LIMIT 5;
SELECT tablename, policyname FROM pg_policies WHERE tablename = 'notification_emails';
```

---

## Étape 4 — Créer les Edge Functions

```bash
# Créer la structure des Edge Functions (si pas encore fait)
supabase functions new notify-patient
supabase functions new retry-notifications
```

Cela crée :
```text
supabase/functions/
├── notify-patient/
│   └── index.ts    ← à implémenter
└── retry-notifications/
    └── index.ts    ← à implémenter
```

---

## Étape 5 — Tester `notify-patient` en local

```bash
# Terminal 1 — démarrer le serveur Edge Functions local
supabase functions serve --env-file .env.local

# Terminal 2 — envoyer une requête test (simuler le webhook Supabase)
curl -i --request POST 'http://localhost:54321/functions/v1/notify-patient' \
  --header 'Content-Type: application/json' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  --data '{
    "type": "UPDATE",
    "table": "demandes",
    "record": {
      "id": "uuid-demande-test",
      "patient_id": "uuid-patient-test",
      "nom": "Alice — Alger",
      "statut": "pret_acceptation_patient",
      "email_notif_envoyee": false
    },
    "old_record": {
      "statut": "transporteur_disponible",
      "email_notif_envoyee": false
    }
  }'
```

**Réponse attendue** (si email envoyé) :
```json
{ "success": true, "emailId": "re_abc123..." }
```

---

## Étape 6 — Configurer le cron `retry-notifications`

Ajouter dans `supabase/config.toml` :

```toml
[functions.retry-notifications]
schedule = "*/5 * * * *"
```

Tester manuellement :

```bash
# Le cron ne se déclenche pas en local — tester via curl
curl -i --request POST 'http://localhost:54321/functions/v1/retry-notifications' \
  --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

---

## Étape 7 — Configurer le Database Webhook Supabase

> ⚠️ **Cette étape se fait dans le dashboard Supabase** (pas en code). En local, utiliser `curl` directement (étape 5).

1. Dans le dashboard Supabase : **Database** → **Webhooks** → **Create a new hook**
2. Configuration :
   - **Name** : `notify-patient-on-ready`
   - **Table** : `demandes` | **Events** : `UPDATE`
   - **Filter** : `statut=eq.pret_acceptation_patient` *(filtre colonne nouvelle valeur)*
   - **HTTP Request** :
     - Method : `POST`
     - URL : `https://{project-ref}.supabase.co/functions/v1/notify-patient`
     - Headers : `Authorization: Bearer {SUPABASE_SERVICE_ROLE_KEY}`
3. Cliquer **Create webhook**

> **Note** : Le filtre Supabase Webhooks porte sur `record.statut` (nouvelle valeur). La garde dans l'Edge Function vérifie `old_record.statut !== 'pret_acceptation_patient'` pour ne déclencher que sur la *transition*.

---

## Étape 8 — Déployer les Edge Functions

```bash
# Déployer les deux fonctions
supabase functions deploy notify-patient
supabase functions deploy retry-notifications

# Vérifier le déploiement
supabase functions list
```

---

## Étape 9 — Test bout-en-bout

1. Dans Supabase Studio, mettre à jour manuellement le statut d'une demande :

```sql
UPDATE demandes
SET statut = 'pret_acceptation_patient'
WHERE id = 'uuid-demande-existante';
```

2. Vérifier dans les logs Edge Functions :

```bash
supabase functions logs notify-patient --tail
```

3. Vérifier la table `notification_emails` :

```sql
SELECT statut, envoyee_at, resend_email_id, erreur
FROM notification_emails
WHERE demande_id = 'uuid-demande-existante';
```

4. Vérifier l'email reçu dans la boîte du patient.

5. Vérifier le flag de la demande :

```sql
SELECT email_notif_envoyee FROM demandes WHERE id = 'uuid-demande-existante';
-- Doit retourner true
```

---

## Étape 10 — Vérifier le listener Realtime client

Dans l'app Ionic (rôle aidant), naviguer vers la vue DetailDemandeView de la demande concernée. Le toast "Patient notifié par email" doit apparaître automatiquement via le composable `useNotification.ts`.

Si pas de toast : vérifier que `supabase_realtime` est activé sur `notification_emails` :

```sql
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'notification_emails';
```

---

## Variables d'environnement requises

| Variable | Source | Utilisée dans |
|----------|--------|---------------|
| `SUPABASE_URL` | Injecté automatiquement | Edge Functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Injecté automatiquement | Edge Functions |
| `RESEND_API_KEY` | `supabase secrets set` | `notify-patient`, `retry-notifications` |

> **Développement local** : Pour `supabase functions serve`, créer `.env.local` avec `RESEND_API_KEY=re_xxx`. Les autres variables sont fournies automatiquement par le serveur local Supabase.

---

## Troubleshooting

| Symptôme | Cause probable | Solution |
|----------|---------------|----------|
| `400 Unauthorized` sur l'Edge Function | Header `Authorization` manquant ou invalide | Utiliser `SUPABASE_ANON_KEY` pour curl local |
| Email non reçu, `statut=failed` | `RESEND_API_KEY` invalide ou domaine non vérifié | Vérifier clé + statut domaine Resend |
| `notification_emails` vide après UPDATE | Webhook non configuré ou filtre incorrect | Vérifier webhook dashboard + logs |
| Toast aidant n'apparaît pas | Realtime non activé sur `notification_emails` | `ALTER PUBLICATION supabase_realtime ADD TABLE notification_emails;` |
| Doublons dans `notification_emails` | `UNIQUE` constraint manquante | Vérifier migration 003_notification_emails.sql |
