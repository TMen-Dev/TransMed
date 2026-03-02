# Tasks: Notification patient — demande prête

**Input**: Design documents from `/specs/006-patient-notifications/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: Tâches groupées par User Story pour une implémentation et un test indépendants.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallélisable (fichiers différents, pas de dépendances bloquantes)
- **[Story]**: User story associée (US1, US2, US3)

---

## Phase 1: Setup (Infrastructure partagée)

**Purpose**: Créer la structure Supabase manquante dans le repo

- [X] T001 Create supabase/ directory structure : `supabase/functions/notify-patient/`, `supabase/functions/retry-notifications/`, `supabase/migrations/`
- [X] T002 Create `supabase/config.toml` with project ref `vhealjcvmvvpxgaycfli`, default [functions] config and placeholder for cron schedule

---

## Phase 2: Fondation (Prérequis bloquants)

**Purpose**: Schéma DB et types TypeScript nécessaires à toutes les User Stories

**⚠️ CRITIQUE** : Aucune User Story ne peut démarrer avant la fin de cette phase

- [X] T003 [P] Create `supabase/migrations/003_notification_emails.sql` — inclure : (1) `ALTER TABLE demandes ADD COLUMN IF NOT EXISTS email_notif_envoyee BOOLEAN NOT NULL DEFAULT false;` (auto-suffisant si 005 non encore appliqué), (2) table `notification_emails` (id, demande_id UNIQUE, patient_id, patient_email, statut CHECK, tentatives, derniere_tentative, envoyee_at, resend_email_id, erreur, created_at), index retry, RLS policies (patient_own_notifications + aidant_view_notifications), `ALTER PUBLICATION supabase_realtime ADD TABLE notification_emails;`, (3) `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;`, trigger `handle_new_user` mis à jour, trigger `sync_profile_email` + `on_auth_user_email_updated`
- [X] T004 [P] Create `src/types/notification.types.ts` — types `StatutNotification = 'pending' | 'sent' | 'failed'` et interface `NotificationEmail` (camelCase : demandeId, patientId, patientEmail, statut, tentatives, derniereTemptative?, envoyeeAt?, resendEmailId?, erreur?, createdAt)

**Checkpoint** : Fondation prête — implémentation des User Stories peut commencer

---

## Phase 3: User Story 1 — Pipeline email patient (Priority: P1) 🎯 MVP

**Goal**: Quand une demande passe à `pret_acceptation_patient`, un email est automatiquement envoyé au patient via Resend, avec retry automatique sur échec (max 3 fois).

**Independent Test**: Mettre à jour manuellement `demandes.statut = 'pret_acceptation_patient'` dans Supabase Studio → dans les 5 minutes, un email arrive dans la boîte du patient. La table `notification_emails` contient une ligne `statut='sent'`. Le flag `demandes.email_notif_envoyee = true`.

### Implémentation US1

- [X] T005 [US1] Create `supabase/functions/notify-patient/index.ts` — Edge Function Deno : parsing webhook payload typé (`WebhookPayload` interface), guards idempotence (`old_record.statut === 'pret_acceptation_patient'` → return 200 'Already sent' ; `record.email_notif_envoyee === true` → return 200 'Already sent'), récupération `profiles.email + prenom` via service_role client (`createClient(SUPABASE_URL, SERVICE_ROLE_KEY)`), guard email manquant → `INSERT notification_emails(statut='failed', erreur='email_manquant')` → return 200, envoi email via `import { Resend } from 'npm:resend@3.0.0'`, helper `renderEmailHtml(prenom, nomDemande)` → template HTML TransMed (#1B8C5A), si succès → `INSERT notification_emails(statut='sent', envoyee_at, resend_email_id)` + `UPDATE demandes SET email_notif_envoyee=true WHERE id=... AND email_notif_envoyee=false`, si échec Resend → `INSERT notification_emails(statut='failed', erreur=message, tentatives=1)`, return 200 dans tous les cas sauf erreur inattendue (500)
- [X] T006 [P] [US1] Create `supabase/functions/retry-notifications/index.ts` — Edge Function Deno cron : `SELECT notification_emails WHERE statut='failed' AND tentatives < 3 AND derniere_tentative < NOW()-5min`, pour chaque entrée → `UPDATE notification_emails SET tentatives=tentatives+1, derniere_tentative=NOW()`, récupérer `profiles(email, prenom)`, envoyer via Resend, si succès → `UPDATE notification_emails SET statut='sent', envoyee_at=NOW()` + `UPDATE demandes SET email_notif_envoyee=true`, si échec → garder statut='failed' (tentatives déjà incrémenté), return 200 avec résumé `{ success: true, retried, succeeded, abandoned }`
- [X] T007 [US1] Update `supabase/config.toml` — ajouter section `[functions.retry-notifications]` avec `schedule = "*/5 * * * *"`
- [X] T008 [US1] Store RESEND_API_KEY secret via CLI : `npx supabase secrets set RESEND_API_KEY=re_xxx --project-ref vhealjcvmvvpxgaycfli` (documenter dans quickstart.md que la vraie clé doit être fournie)
- [X] T009 [US1] Apply migration to Supabase project via Management API : POST `https://api.supabase.com/v1/projects/vhealjcvmvvpxgaycfli/database/migrations` with SQL content from `supabase/migrations/003_notification_emails.sql`
- [X] T010 [US1] Configure Database Webhook in Supabase dashboard : Table `demandes`, Event `UPDATE`, Filter `statut=eq.pret_acceptation_patient`, URL `https://vhealjcvmvvpxgaycfli.supabase.co/functions/v1/notify-patient`, Header `Authorization: Bearer <SERVICE_ROLE_KEY>` — documenter les étapes dans quickstart.md
- [X] T011 [US1] Deploy Edge Functions : `npx supabase functions deploy notify-patient --project-ref vhealjcvmvvpxgaycfli` et `npx supabase functions deploy retry-notifications --project-ref vhealjcvmvvpxgaycfli`

**Checkpoint** : US1 complète — email envoyé automatiquement, retry fonctionnel, traçabilité dans `notification_emails`

---

## Phase 4: User Story 2 — Confirmation aidant dans l'interface (Priority: P2)

**Goal**: L'aidant voit un toast "Patient [prénom] notifié par email" dans les 30 secondes après la confirmation serveur (best-effort via Supabase Realtime). En cas d'échec définitif (3 tentatives), un avertissement discret s'affiche.

**Independent Test**: Après une Prop3, un toast apparaît dans `DetailDemandeView` avec le prénom du patient. Si `notification_emails.statut = 'failed' AND tentatives >= 3`, un bandeau d'avertissement remplace le toast de succès.

### Implémentation US2

- [X] T012 [US2] Refactor `src/composables/useNotification.ts` — remplacer le mock (console.log + email hardcodé) par un listener Supabase Realtime sur `notification_emails` filtré par `demande_id` : `supabase.channel('notif-${demandeId}').on('postgres_changes', { event: '*', schema: 'public', table: 'notification_emails', filter: 'demande_id=eq.${demandeId}' }, handler)`. Utiliser `event: '*'` (INSERT + UPDATE) car `notify-patient` fait un INSERT sur succès primaire et `retry-notifications` fait un UPDATE sur succès retry — les deux chemins doivent déclencher la confirmation. Handler : si `payload.new.statut === 'sent'` → `notifTriggered.value = true`, `notifMessage.value = 'Patient ${prenom} notifié par email'` ; si `payload.new.statut === 'failed' && payload.new.tentatives >= 3` → `notifEchec.value = true`. Conserver `checkAndSendEmailNotif()` comme no-op (compatibilité stores existants). Ajouter `notifEchec: Ref<boolean>` à l'interface publique.
- [X] T013 [US2] Update `src/views/DetailDemandeView.vue` — ajouter badge "Patient notifié ✓" (vert `#1B8C5A`) visible quand `notifTriggered === true` dans la section statut/timeline, ajouter avertissement discret (fond `#FDF0E8`, bordure `#C8521A`) quand `notifEchec === true` avec message "Notification échouée — contactez le patient directement", conserver le `watch(notifTriggered, ...)` existant pour le toast

**Checkpoint** : US1 + US2 complètes — pipeline email + confirmation aidant fonctionnels

---

## Phase 5: User Story 3 — Mise en évidence pour le patient (Priority: P2)

**Goal**: Quand le patient ouvre l'app avec une demande en `pret_acceptation_patient`, cette demande apparaît en premier avec un badge "Action requise" distinctif.

**Independent Test**: Connecté en tant que patient avec une demande `pret_acceptation_patient`, la `ListeDemandesView` affiche cette demande en tête de liste avec un badge "Action requise" en couleur terracotta (`#C8521A`).

### Implémentation US3

- [X] T014 [US3] Update `src/views/ListeDemandesView.vue` — trier les demandes pour placer `pret_acceptation_patient` en premier (pour la vue patient), ajouter badge/chip "Action requise" sur `DemandeCard` ou directement dans la liste quand `demande.statut === 'pret_acceptation_patient'` et `userRole === 'patient'` (couleur `#C8521A` / `--tm-terra`, animation légère `tmPop`), s'assurer que le bouton de confirmation dans `DetailDemandeView` est mis en avant quand ce statut est actif

**Checkpoint** : US1 + US2 + US3 complètes — pipeline complet fonctionnel

---

## Phase 6: Polish & Validation bout-en-bout

**Purpose**: Validation du flux complet et nettoyage

- [X] T015 [P] Remove mock email code — supprimer `console.log('📧 Email envoyé à ...')` et l'adresse `testpatient@yopmail.com` hardcodée restante dans `useNotification.ts` ou tout autre fichier
- [X] T016 Validate end-to-end flow : aidant complète Prop3 → `demandes.statut = 'pret_acceptation_patient'` → webhook déclenché → email reçu par patient → `notification_emails.statut = 'sent'` → Realtime → toast aidant "Patient notifié" → patient ouvre app → demande en tête de liste avec badge "Action requise"
- [X] T017 Update `CONTEXT.md` — marquer 006-patient-notifications comme implémenté, noter la clé Resend à configurer en production

---

## Dépendances & Ordre d'exécution

### Dépendances entre phases

- **Phase 1** (Setup) : Aucune dépendance — démarre immédiatement
- **Phase 2** (Fondation) : Dépend de Phase 1 — bloque toutes les User Stories
- **Phase 3** (US1) : Dépend de Phase 2 — MVP minimal livrable
- **Phase 4** (US2) : Dépend de Phase 3 (Realtime sur `notification_emails` nécessite que la table existe et soit alimentée)
- **Phase 5** (US3) : Indépendante de US2, dépend de Phase 2 (statut `pret_acceptation_patient` doit exister)
- **Phase 6** (Polish) : Dépend de toutes les User Stories

### Dépendances entre User Stories

- **US1 (P1)** : Peut démarrer après Phase 2 — aucune dépendance sur US2/US3
- **US2 (P2)** : Dépend de US1 (la table `notification_emails` doit être alimentée pour tester le Realtime)
- **US3 (P2)** : Indépendante de US1/US2 — peut être travaillée en parallèle de US2

### Parallélisme au sein des phases

- **Phase 2** : T003 ∥ T004 (migration SQL et types TypeScript — fichiers différents)
- **Phase 3** : T005 puis T006 ∥ T007 (retry-notifications et config.toml en parallèle après notify-patient)
- **Phase 6** : T015 ∥ T017 (nettoyage et doc en parallèle)

---

## Exemple de parallélisme — Phase 2

```bash
# Lancer en parallèle :
Task T003: "Create supabase/migrations/003_notification_emails.sql"
Task T004: "Create src/types/notification.types.ts"
# → Aucune dépendance entre eux, fichiers différents
```

## Exemple de parallélisme — Phase 3 (après T005)

```bash
# Après T005 (notify-patient), lancer en parallèle :
Task T006: "Create supabase/functions/retry-notifications/index.ts"
Task T007: "Update supabase/config.toml cron schedule"
```

---

## Stratégie d'implémentation

### MVP (User Story 1 uniquement)

1. Compléter Phase 1 : Setup
2. Compléter Phase 2 : Fondation (CRITIQUE — bloque tout)
3. Compléter Phase 3 : US1 (pipeline email complet)
4. **STOP et VALIDER** : email reçu par patient après mise à jour manuelle du statut
5. Déployer — le patient est notifié de façon fiable

### Livraison incrémentale

1. Setup + Fondation → Base prête
2. US1 → Tester indépendamment → Déployer (MVP !)
3. US2 → Tester indépendamment → Déployer (aidant voit confirmation)
4. US3 → Tester indépendamment → Déployer (patient voit highlight)
5. Chaque story ajoute de la valeur sans casser les précédentes

---

## Notes

- [P] = fichiers différents, pas de dépendances entre eux
- [US?] = traceabilité vers la User Story concernée
- T008 (secret RESEND_API_KEY) : nécessite une vraie clé Resend pour l'environnement de production
- T009 (migration) : peut être appliquée via Management API ou Supabase Studio SQL Editor
- T010 (Database Webhook) : étape manuelle dans le dashboard — documenter soigneusement pour la reproductibilité
- La table `notification_emails` dépend de 005-supabase-backend pour que `profiles.email` soit disponible
