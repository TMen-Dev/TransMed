# Research: Notification patient — demande prête

**Feature**: 006-patient-notifications | **Date**: 2026-03-01

---

## 1. Déclencheur — Database Webhook Supabase

**Decision**: Database Webhook configuré dans le dashboard Supabase sur UPDATE de `demandes`

**Rationale**: Le webhook est serveur-side, se déclenche même si aucun client n'est connecté, et est natif à Supabase (pas de polling, pas de dépendance externe). Il envoie un HTTP POST à l'Edge Function avec le payload complet.

**Configuration** (dashboard : Database → Webhooks → Create) :
- Table : `demandes` | Event : `UPDATE`
- Filter : `statut=eq.pret_acceptation_patient`
- Destination : `https://{project-id}.supabase.co/functions/v1/notify-patient`

**Payload reçu par l'Edge Function** :
```json
{
  "type": "UPDATE",
  "table": "demandes",
  "record": {
    "id": "uuid",
    "patient_id": "uuid",
    "nom": "Alice — Alger",
    "statut": "pret_acceptation_patient",
    "email_notif_envoyee": false
  },
  "old_record": {
    "statut": "transporteur_disponible",
    "email_notif_envoyee": false
  }
}
```

**Note** : Le filtre Supabase Webhooks filtre sur la valeur **nouvelle** (`record.statut`). Pour ne déclencher que lors de la *transition vers* ce statut (pas si déjà au bon statut), la garde dans l'Edge Function vérifie `old_record.statut !== 'pret_acceptation_patient'`.

**Alternatives considérées** :
- Trigger PostgreSQL + `pg_net` : plus complexe, nécessite extension `pg_net`, moins maintenable
- Appel client-side depuis le store : dépend que le client soit connecté — non fiable

---

## 2. Idempotence — anti-doublon

**Decision**: Double garde : flag `email_notif_envoyee` sur la demande + UPDATE atomique `WHERE email_notif_envoyee = false`

**Rationale**: Le webhook peut se déclencher plusieurs fois (retry Supabase en cas d'erreur de livraison). La garde `email_notif_envoyee` est la source de vérité. L'UPDATE atomique (`UPDATE ... WHERE email_notif_envoyee = false`) garantit qu'un seul processus concurrent peut "gagner" la mise à jour.

```typescript
// Dans l'Edge Function — avant tout envoi
if (payload.record.email_notif_envoyee) {
  return new Response(JSON.stringify({ message: 'Already sent' }), { status: 200 })
}

// Après envoi réussi — atomique
const { count } = await supabase
  .from('demandes')
  .update({ email_notif_envoyee: true })
  .eq('id', demandeId)
  .eq('email_notif_envoyee', false) // seulement si encore false
```

**Alternatives considérées** :
- UNIQUE constraint sur `notification_emails(demande_id)` : bonne option complémentaire, ajoutée à la table pour double protection
- SELECT FOR UPDATE (verrou pessimiste) : overkill pour ce volume (~10 notifications/jour)

---

## 3. Envoi email — Resend API depuis Deno

**Decision**: `npm:resend@3.0.0` — import natif Deno, SDK officiel TypeScript

**Rationale**: Resend est le service recommandé par Supabase pour les Edge Functions. L'import `npm:` est natif Deno depuis v1.38. L'API est simple et le free tier (3000 emails/mois) est largement suffisant pour le MVP.

```typescript
import { Resend } from 'npm:resend@3.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY')!)

const { data, error } = await resend.emails.send({
  from: 'TransMed <noreply@transmed.dev>',    // domaine vérifié dans Resend dashboard
  to: patientEmail,
  subject: `Votre demande "${nomDemande}" est prête — Action requise`,
  html: renderEmailHtml(prenomPatient, nomDemande),
})
```

**Alternatives considérées** :
- SendGrid : plus complexe, API moins ergonomique pour Deno
- `fetch` direct vers l'API Resend : fonctionne mais perd le typage et la gestion d'erreur du SDK

---

## 4. Retry des échecs — Edge Function planifiée

**Decision**: Scheduled Edge Function `retry-notifications` avec cron `*/5 * * * *`

**Rationale**: Les retries côté serveur (cron) sont indépendants du client. La table `notification_emails` trace l'état et le nombre de tentatives. Le cron sélectionne les demandes `pret_acceptation_patient AND email_notif_envoyee = false AND updated_at < NOW() - 5min`.

```toml
# supabase/config.toml
[functions.retry-notifications]
schedule = "*/5 * * * *"
```

```typescript
// retry-notifications/index.ts — logique principale
const { data: pending } = await supabase
  .from('notification_emails')
  .select('*, demandes(id, patient_id, nom)')
  .eq('statut', 'failed')
  .lt('tentatives', 3)
  .lt('derniere_tentative', new Date(Date.now() - 5 * 60_000).toISOString())
```

**Alternatives considérées** :
- Retry inline dans l'Edge Function principale (boucle) : bloque la réponse webhook, risque de timeout (30s max Edge Functions)
- `pg_cron` PostgreSQL : possible, mais moins visible et plus complexe à déployer

---

## 5. Secrets et client admin

**Decision**: `RESEND_API_KEY` stocké via `supabase secrets set`, `SUPABASE_SERVICE_ROLE_KEY` disponible automatiquement dans les Edge Functions

**Rationale**: La clé Resend est un secret applicatif. Supabase injecte automatiquement `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` dans toutes les Edge Functions — pas besoin de les stocker manuellement.

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
```

```typescript
// Client admin dans Edge Function (bypass RLS)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!   // injecté automatiquement
)
```

**Note** : `SUPABASE_SERVICE_ROLE_KEY` ne doit JAMAIS apparaître côté client (uniquement Edge Functions et backend serveur).

---

## 6. Email du patient — source de vérité

**Decision**: Stocker `email` dans la table `profiles` (colonne ajoutée) + synchronisation via trigger depuis `auth.users`

**Rationale**: L'email Supabase Auth est dans `auth.users` — non accessible directement avec la clé anon ni via RLS standard. Dans une Edge Function avec `service_role`, on peut accéder à `auth.users` via `supabase.auth.admin.getUserById(patient_id)`, mais stocker l'email dans `profiles` évite cet appel supplémentaire et simplifie les requêtes.

```sql
-- Migration complémentaire (dépend de 005)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Trigger pour synchroniser l'email depuis auth.users
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated_email
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE sync_profile_email();
```

Le trigger `handle_new_user()` existant (005) est mis à jour pour inclure `email` :
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Alternatives considérées** :
- `supabase.auth.admin.getUserById()` dans l'Edge Function : fonctionne, mais appel supplémentaire à chaque notification
- Email hardcodé (actuel mock) : non acceptable en production

---

## 7. Client-side — `useNotification.ts` simplifié

**Decision**: Realtime subscription sur `notification_emails` filtré par `demande_id`, écoute l'événement UPDATE vers `statut = 'sent'`

**Rationale**: Au lieu d'un appel actif depuis le client, le composable écoute passivement les changements DB. Quand l'Edge Function marque la notification `sent`, le client le voit immédiatement via Realtime.

```typescript
// Pattern dans useNotification.ts
// event: '*' requis — notify-patient fait INSERT sur succès primaire,
// retry-notifications fait UPDATE sur succès retry. Les deux chemins
// doivent déclencher la confirmation aidant.
const channel = supabase
  .channel(`notif-${demandeId}`)
  .on('postgres_changes', {
    event: '*',   // INSERT (succès primaire) + UPDATE (succès retry)
    schema: 'public',
    table: 'notification_emails',
    filter: `demande_id=eq.${demandeId}`,
  }, (payload) => {
    if (payload.new.statut === 'sent') {
      notifMessage.value = `Patient ${prenomPatient} notifié par email`
      notifTriggered.value = true
    }
    if (payload.new.statut === 'failed' && payload.new.tentatives >= 3) {
      notifEchec.value = true
    }
  })
  .subscribe()
```

Prérequis : activer Realtime sur la table `notification_emails` (`ALTER PUBLICATION supabase_realtime ADD TABLE notification_emails;`).
