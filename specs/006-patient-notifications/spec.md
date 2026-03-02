# Feature Specification: Notification patient — demande prête

**Feature Branch**: `006-patient-notifications`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "Système de notification patient pour alerter le patient lorsque sa demande atteint le statut pret_acceptation_patient. Analyser et choisir entre email transactionnel réel ou notifications push natives. Le patient doit être averti de façon fiable, même s'il n'a pas l'application ouverte. La notification ne doit être envoyée qu'une seule fois par demande."

## Décision architecturale : Email vs Push

> Cette section documente l'analyse comparative avant la spécification des exigences.

### Comparaison Email transactionnel vs Push notifications

| Critère | Email transactionnel | Push natif (FCM/APNs) |
|---------|---------------------|----------------------|
| Fonctionne app fermée | ✅ Oui | ✅ Oui |
| Permissions requises | ❌ Non | ⚠️ Oui (opt-in utilisateur) |
| Fiabilité livraison | ✅ Haute (99%+) | ⚠️ Dépend des tokens FCM/APNs |
| Contexte géographique | ✅ Universel (Algérie) | ⚠️ Dépend des services Google/Apple |
| Complexité setup | ✅ Faible (Supabase + Resend) | ❌ Élevée (Firebase, certificats APNs) |
| Migration depuis mock | ✅ Naturelle (mock déjà email) | ❌ Refonte complète |
| Délai de réception | ⚠️ ~1-5 minutes | ✅ Quasi-instantané |
| Contenu riche | ⚠️ HTML email | ✅ Notification OS native |

### Décision retenue

**Email transactionnel comme canal principal (P1)**, push notifications comme amélioration optionnelle future (hors scope de cette feature).

**Justification** : Les patients sont principalement situés en Algérie — l'email est universel, ne nécessite aucune permission, fonctionne indépendamment de l'infrastructure Google/Apple, et s'intègre naturellement avec la feature 005 (Supabase Edge Functions). La migration depuis le mock email existant est directe. Les push notifications constituent une amélioration UX valable mais ajoutent une complexité infrastructure (FCM, certificats APNs, stockage des tokens) disproportionnée pour le MVP.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Patient reçoit un email quand sa demande est prête (Priority: P1)

Lorsqu'un aidant complète les conditions requises (fonds + transporteur disponibles), le patient reçoit automatiquement un email l'informant que sa demande est prête et qu'il doit confirmer. Cette notification arrive dans sa boîte email, même si l'application est fermée ou non installée.

**Why this priority**: C'est le blocage principal identifié : sans notification externe, le patient dépend du hasard pour ouvrir l'application au bon moment. L'email garantit que la demande ne reste pas bloquée au statut `pret_acceptation_patient` indéfiniment par manque d'information du patient.

**Independent Test**: Un aidant complète une proposition Prop3 sur une demande test. Dans les 5 minutes, un email arrive dans la boîte du patient (ex: testpatient@yopmail.com) avec le nom de la demande et un lien vers l'application. La demande reste au statut `pret_acceptation_patient` jusqu'à confirmation du patient.

**Acceptance Scenarios**:

1. **Given** une demande atteignant `pret_acceptation_patient` pour la première fois, **When** la transition de statut est enregistrée, **Then** un email est envoyé automatiquement à l'adresse email du patient dans les 5 minutes
2. **Given** une demande déjà notifiée (`emailNotifEnvoyee = true`), **When** une autre action modifie la demande, **Then** aucun second email n'est envoyé
3. **Given** un email envoyé au patient, **When** le patient l'ouvre, **Then** il comprend clairement quelle demande est concernée (nom de la demande), que des aidants sont prêts, et quelle action il doit faire (ouvrir l'app et confirmer)
4. **Given** un patient dont l'adresse email est enregistrée dans son profil, **When** la notification est déclenchée, **Then** l'email est envoyé à cette adresse (pas une adresse fixe codée en dur)
5. **Given** un échec d'envoi d'email (service indisponible), **When** l'erreur est détectée, **Then** une nouvelle tentative est effectuée automatiquement (max 3 tentatives) et l'erreur est journalisée sans bloquer le flux applicatif

---

### User Story 2 — Aidant voit la confirmation de notification envoyée (Priority: P2)

Après avoir effectué une action qui porte la demande au statut `pret_acceptation_patient`, l'aidant voit dans l'interface une confirmation que le patient a bien été notifié. Cette confirmation remplace le comportement actuel (toast affichant une adresse email codée en dur).

**Why this priority**: Améliore la confiance de l'aidant dans le système — il sait que le patient est informé et n'a pas à s'interroger sur ce qui se passe ensuite. Dépend de US1.

**Independent Test**: Un aidant fait une Prop3. Un toast ou bandeau s'affiche dans les 3 secondes : "Le patient [prénom] a été notifié par email." L'aidant n'a pas besoin de connaître l'adresse email du patient.

**Acceptance Scenarios**:

1. **Given** un aidant qui complète une action déclenchant `pret_acceptation_patient`, **When** l'email au patient est déclenché avec succès, **Then** l'aidant voit un message de confirmation dans l'interface ("Patient notifié")
2. **Given** un aidant qui voit la confirmation, **When** il consulte le détail de la demande, **Then** un indicateur visuel montre que la notification a déjà été envoyée (pour éviter toute interrogation sur l'état)
3. **Given** un échec d'envoi d'email, **When** les 3 tentatives ont échoué, **Then** l'aidant voit un avertissement discret l'invitant à contacter le patient autrement (sans bloquer son flux)

---

### User Story 3 — Patient voit dans l'app que sa demande l'attend (Priority: P2)

Lorsque le patient ouvre l'application après avoir reçu l'email de notification, sa demande `pret_acceptation_patient` est mise en évidence pour faciliter la confirmation.

**Why this priority**: Complète US1 — si le patient ouvre l'app depuis l'email, il doit trouver immédiatement l'action à faire sans chercher. Ne remplace pas la notification email mais en renforce l'efficacité. Dépend de US1.

**Independent Test**: Un patient reçoit l'email → ouvre l'app → la demande concernée apparaît en haut de la liste avec un indicateur visuel distinctif ("Action requise") et le bouton de confirmation est directement accessible.

**Acceptance Scenarios**:

1. **Given** un patient qui ouvre l'app avec une demande en `pret_acceptation_patient`, **When** il consulte la liste de ses demandes, **Then** cette demande apparaît en première position avec un indicateur "Action requise" distinctif
2. **Given** un patient sur l'écran de détail d'une demande en `pret_acceptation_patient`, **When** il n'a pas encore confirmé, **Then** le bouton de confirmation est affiché de manière proéminente avec un rappel du contexte ("Vos aidants sont prêts — confirmez la livraison")

---

### Edge Cases

- Que se passe-t-il si le profil du patient n'a pas d'adresse email renseignée ? → La notification est journalisée comme non envoyée, un avertissement est affiché à l'aidant, le flux demande continue sans blocage
- Que se passe-t-il si la demande passe à `pret_acceptation_patient` puis revient en arrière (annulation) ? → Si la notification a déjà été envoyée, aucun second email n'est envoyé lors du prochain passage au statut `pret_acceptation_patient`
- Que se passe-t-il si l'email du patient n'est pas valide (format incorrect) ? → L'erreur est journalisée, l'aidant est averti discrètement, la demande n'est pas bloquée
- Que se passe-t-il si plusieurs demandes du même patient atteignent `pret_acceptation_patient` simultanément ? → Un email distinct est envoyé pour chaque demande concernée
- Que se passe-t-il si le service d'envoi d'email est indisponible pendant plus d'1 heure ? → La tentative est abandonnée après 3 essais, l'état `emailNotifEnvoyee` reste `false` pour permettre une nouvelle tentative manuelle
- Que se passe-t-il si l'email arrive en spam ? → Hors du contrôle de l'application — le corps de l'email doit être conçu pour minimiser ce risque (texte clair, expéditeur vérifié)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-601**: Le système DOIT envoyer automatiquement un email au patient lorsque sa demande atteint le statut `pret_acceptation_patient`, dans un délai maximum de 5 minutes après la transition
- **FR-602**: Le système DOIT garantir qu'une seule notification email est envoyée par demande, même si la demande atteint `pret_acceptation_patient` via plusieurs chemins possibles (Prop2+cagnotte, Prop3 directe)
- **FR-603**: L'email DOIT être envoyé à l'adresse email réelle du patient enregistrée dans son profil (pas une adresse codée en dur)
- **FR-604**: Le corps de l'email DOIT contenir : le prénom du patient, le nom de la demande concernée, une description claire de l'action attendue (confirmer la livraison), et un lien ou instruction pour accéder à l'application
- **FR-605**: Le système DOIT effectuer jusqu'à 3 tentatives d'envoi en cas d'échec, avec un intervalle d'au moins 60 secondes entre chaque tentative
- **FR-606**: Chaque tentative d'envoi (réussie ou échouée) DOIT être journalisée avec horodatage et résultat pour permettre le débogage
- **FR-607**: L'aidant ayant déclenché la transition DOIT voir une confirmation visuelle dans l'interface indiquant que le patient a été notifié, dans les 30 secondes suivant la confirmation serveur (best-effort — dépend de la latence Supabase Realtime)
- **FR-608**: En cas d'échec définitif d'envoi (après 3 tentatives), le système DOIT afficher un avertissement discret à l'aidant sans bloquer le flux de la demande
- **FR-609**: Si le profil du patient ne contient pas d'adresse email valide, le système DOIT signaler l'impossibilité d'envoyer la notification sans bloquer la progression de la demande
- **FR-610**: La demande en `pret_acceptation_patient` DOIT être mise en évidence dans la liste des demandes du patient (position prioritaire + indicateur visuel "Action requise")

### Key Entities

- **NotificationEmail** : Événement d'envoi d'email lié à une demande. Attributs : identifiant, demande associée, destinataire (email patient), statut (envoyée/échouée/en_attente), nombre de tentatives, horodatage dernier essai, horodatage succès.
- **Demande** (champ existant étendu) : `emailNotifEnvoyee: boolean` — déjà présent dans le type `Demande`, à persister en base de données (005).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-601**: 100% des transitions vers `pret_acceptation_patient` déclenchent une tentative d'envoi d'email dans les 5 minutes
- **SC-602**: 0 doublon d'email — aucune demande ne génère plus d'un email de notification au patient
- **SC-603**: L'aidant voit la confirmation de notification dans les 30 secondes suivant la confirmation serveur (best-effort — latence Realtime variable selon conditions réseau)
- **SC-604**: En cas d'indisponibilité temporaire du service d'envoi, le système réessaie automatiquement sans intervention manuelle (max 3 tentatives)
- **SC-605**: Le patient ouvre l'app suite à l'email et trouve immédiatement la demande concernée sans effectuer de recherche

## Assumptions

- **Email comme canal principal** : L'email est retenu comme canal de notification obligatoire. Les notifications push natives (FCM/APNs) sont jugées hors scope pour cette feature — complexité infrastructure disproportionnée pour le MVP (tokens push, certificats APNs, Firebase). Ce choix est réévalué en v2 si le taux d'engagement email s'avère insuffisant.
- **Capacitor Local Notifications écarté** : Ces notifications sont locales (déclenchées par l'app elle-même) — elles ne fonctionnent pas si l'application est fermée, ne répondant pas à l'exigence fondamentale "le patient doit être averti même sans l'app ouverte".
- **Supabase Edge Functions comme déclencheur** : Le déclenchement s'appuie sur un webhook de base de données (changement de statut dans la table `demandes`) appelant une Edge Function — cohérent avec l'architecture de la feature 005.
- **Service d'envoi externe** : Un service d'envoi transactionnel tiers est utilisé (ex: Resend ou SendGrid). La clé API est stockée comme secret dans l'environnement serveur, jamais exposée côté client.
- **Email du patient obligatoire** : Avec l'intégration Supabase (005), l'email du patient est son identifiant de connexion — il est donc toujours disponible dans son profil.
- **Lien dans l'email** : Le lien dans l'email pointe vers l'URL de l'application web (pas un deep link natif) pour maximiser la compatibilité — l'utilisateur rouvre l'app manuellement si sur mobile.
- **Délai d'envoi** : Un délai de 5 minutes maximum est acceptable — l'email n'est pas une alerte critique en temps réel (contrairement à une urgence médicale). Le patient dispose de l'app pour voir le statut en temps réel s'il est connecté.
