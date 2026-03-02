# Contrats — Edge Functions 006-patient-notifications

**Feature**: 006-patient-notifications | **Date**: 2026-03-01

---

## Edge Function 1 : `notify-patient`

**Fichier** : `supabase/functions/notify-patient/index.ts`
**Déclencheur** : Database Webhook Supabase (POST automatique)
**Runtime** : Deno (Supabase Edge Runtime)

### Entrée (webhook payload)

```typescript
interface WebhookPayload {
  type: 'UPDATE'
  table: 'demandes'
  record: {
    id: string                          // UUID de la demande
    patient_id: string                  // UUID du patient
    nom: string                         // Nom de la demande
    statut: 'pret_acceptation_patient'  // Nouveau statut
    email_notif_envoyee: boolean        // false si pas encore envoyé
  }
  old_record: {
    statut: string                      // Statut précédent
    email_notif_envoyee: boolean
  }
}
```

### Logique

```
1. Guard: old_record.statut === 'pret_acceptation_patient' → return 200 (déjà traité)
2. Guard: record.email_notif_envoyee === true → return 200 (déjà notifié)
3. Récupérer profiles WHERE id = patient_id → prenom, email
4. Guard: email absent → INSERT notification_emails(statut='failed', erreur='email_manquant') → return 200
5. Envoyer email via Resend
6. Si succès :
   - INSERT notification_emails(statut='sent', envoyee_at=NOW(), resend_email_id=...)
   - UPDATE demandes SET email_notif_envoyee=true WHERE id=... AND email_notif_envoyee=false
7. Si échec Resend :
   - INSERT notification_emails(statut='failed', erreur=message, tentatives=1)
8. return 200 dans tous les cas (éviter retry automatique Supabase sauf erreur 5xx)
```

### Réponses

| Statut HTTP | Cas |
|-------------|-----|
| `200 { success: true, emailId }` | Email envoyé avec succès |
| `200 { message: 'Already sent' }` | Idempotence — déjà notifié |
| `200 { message: 'Skipped' }` | Transition non pertinente |
| `200 { error: 'email_missing' }` | Email patient absent (pas de retry webhook) |
| `500` | Erreur inattendue (déclenche retry Supabase Webhook) |

**Note** : Retourner 200 même en cas d'échec d'envoi évite que Supabase Webhooks ne réessaie indéfiniment. Le retry est géré par la fonction planifiée `retry-notifications`.

### Secrets requis

| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Injecté automatiquement |
| `SUPABASE_SERVICE_ROLE_KEY` | Injecté automatiquement |
| `RESEND_API_KEY` | `supabase secrets set RESEND_API_KEY=re_xxx` |

---

## Edge Function 2 : `retry-notifications`

**Fichier** : `supabase/functions/retry-notifications/index.ts`
**Déclencheur** : Cron planifié `*/5 * * * *` (toutes les 5 minutes)
**Runtime** : Deno (Supabase Edge Runtime)

### Configuration cron

```toml
# supabase/config.toml
[functions.retry-notifications]
schedule = "*/5 * * * *"
```

### Logique

```
1. SELECT notification_emails
   WHERE statut = 'failed'
   AND tentatives < 3
   AND derniere_tentative < NOW() - INTERVAL '5 minutes'
   (ou demandes WHERE statut='pret_acceptation_patient' AND email_notif_envoyee=false AND updated_at < NOW()-5min)

2. Pour chaque entrée :
   a. UPDATE notification_emails SET tentatives++, derniere_tentative=NOW()
   b. Récupérer profiles(email, prenom) du patient
   c. Envoyer via Resend
   d. Si succès : UPDATE notification_emails(statut='sent') + UPDATE demandes(email_notif_envoyee=true)
   e. Si échec : UPDATE notification_emails(erreur=...) — tentatives déjà incrémenté

3. Si tentatives >= 3 après l'essai : statut reste 'failed' (abandon définitif)

4. return 200 avec résumé { retried: N, succeeded: M, failed: K }
```

### Réponse

```typescript
interface RetryResponse {
  success: true
  retried: number    // Nombre de notifications tentées
  succeeded: number  // Envois réussis
  abandoned: number  // Notifications avec tentatives >= 3 (non retraitées)
}
```

---

## Email template

**Sujet** : `Votre demande "[NOM_DEMANDE]" est prête — Action requise`

**Corps HTML** :
```html
<h2 style="color:#1B8C5A;">Votre demande est prête, [PRENOM] !</h2>
<p>Votre demande <strong>[NOM_DEMANDE]</strong> a trouvé des aidants.</p>
<p>Les fonds sont collectés et un transporteur est assigné.</p>
<p><strong>Action requise :</strong> Ouvrez TransMed et confirmez la livraison.</p>
<a href="https://transmed.app" style="background:#1B8C5A;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;">
  Ouvrir TransMed
</a>
```

**Expéditeur** : `TransMed <noreply@[domaine-vérifié-resend]>`

---

## Client — `useNotification.ts` (interface composable)

Le composable est simplifié — plus d'appel actif, écoute Realtime sur `notification_emails`.

```typescript
// Interface publique inchangée (compatibilité avec les vues existantes)
interface UseNotificationReturn {
  notifTriggered: Ref<boolean>
  notifMessage: Ref<string>
  notifEchec: Ref<boolean>          // NEW — échec définitif après 3 tentatives
  checkAndSendEmailNotif: (demande: Demande) => Promise<void>  // garde compatibilité
  resetNotif: () => void
}
```

`checkAndSendEmailNotif()` devient une no-op côté client (l'envoi est entièrement serveur-side). Elle peut être conservée pour ne pas casser les appels existants dans les stores.
