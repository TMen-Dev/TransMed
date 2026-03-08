# Feature Specification: Refonte du Workflow des Demandes

**Feature Branch**: `008-workflow-demandes`
**Created**: 2026-03-07
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Aidant unique : acheter et livrer (Scénario 1) (Priority: P1)

Un aidant disponible souhaite prendre en charge toute la demande : il achète les médicaments et les livre directement au patient. Il sélectionne la proposition "Achat + Transport". La demande passe immédiatement à l'état D (les deux rôles sont couverts). Le système envoie automatiquement un email au patient pour fixer le rendez-vous. La demande passe à l'état F (RDV à fixer). Le patient confirme le RDV dans l'app → état G. Le patient reçoit les médicaments et clique "Médicaments reçus" → état H.

**Why this priority**: Scénario le plus simple et le plus rapide, couvre le cas d'usage principal. Validé en premier pour garantir la cohérence du cycle de vie.

**Independent Test**: Peut être testé de bout en bout avec un seul aidant et un patient. Valeur livrée : une demande est traitée du début à la fin.

**Acceptance Scenarios**:

1. **Given** une demande à l'état A, **When** un aidant soumet `prop_achat_transport`, **Then** la demande passe à l'état D et le système envoie un email au patient
2. **Given** la demande à l'état D (scénario 1), **When** l'email est envoyé, **Then** la demande passe automatiquement à l'état F
3. **Given** la demande à l'état F, **When** le patient clique "RDV fixé avec transporteur", **Then** la demande passe à l'état G
4. **Given** la demande à l'état G, **When** le patient clique "Médicaments reçus", **Then** la demande passe à l'état H (traitée)
5. **Given** un acheteur déjà engagé, **When** un autre aidant tente `prop_achat_transport` ou `prop_achat_envoi`, **Then** l'action est bloquée (verrou acheteur actif)

---

### User Story 2 — Acheteur d'abord, transporteur ensuite (Scénario 2) (Priority: P2)

Un aidant propose d'acheter et d'envoyer les médicaments à un futur transporteur. La demande passe à l'état B. Un second aidant propose de transporter. La demande passe à l'état D. Le système notifie l'aidant-acheteur par email qu'un transporteur est disponible. Ils se coordonnent via le chat intégré. L'acheteur clique "Médicaments envoyés au transporteur" → état E. Le transporteur reçoit les médicaments et clique "Médicaments reçus" → état F + email au patient. Le patient fixe RDV → état G. Patient reçoit → état H.

**Why this priority**: Couvre le cas collaboratif le plus fréquent (deux aidants distincts). Priorité P2 car dépend du cycle complet P1.

**Independent Test**: Peut être testé avec deux aidants et un patient. Valeur : demande traitée en mode collaboratif.

**Acceptance Scenarios**:

1. **Given** état A, **When** aidant A soumet `prop_achat_envoi`, **Then** demande → état B
2. **Given** état B, **When** aidant B soumet `prop_transport`, **Then** demande → état D + email à aidant-acheteur "transporteur disponible"
3. **Given** état D (2 aidants), **When** l'acheteur clique "Médicaments envoyés au transporteur", **Then** demande → état E
4. **Given** état E, **When** le transporteur clique "Médicaments reçus", **Then** demande → état F + email patient "fixer RDV"
5. **Given** un transporteur déjà engagé, **When** un autre aidant tente `prop_transport`, **Then** l'action est bloquée (verrou transporteur actif)

---

### User Story 3 — Transporteur d'abord, acheteur ensuite (Scénario 3) (Priority: P2)

Un aidant propose de transporter. La demande passe à l'état C. Un second aidant propose d'acheter et d'envoyer. La demande passe à l'état D. Le système notifie l'aidant-transporteur par email qu'un acheteur est prêt. Ils se coordonnent via chat. La suite est identique au scénario 2 : E → F → G → H.

**Why this priority**: Symétrique du scénario 2, priorité identique. Valide que les deux ordres d'arrivée sont supportés.

**Independent Test**: Peut être testé en inversant l'ordre des aidants par rapport au scénario 2.

**Acceptance Scenarios**:

1. **Given** état A, **When** aidant B soumet `prop_transport`, **Then** demande → état C
2. **Given** état C, **When** aidant A soumet `prop_achat_envoi`, **Then** demande → état D + email à aidant-transporteur "acheteur prêt"
3. **Given** état D (2 aidants), **When** acheteur clique "Médicaments envoyés au transporteur", **Then** demande → état E
4. **Given** état E, **When** transporteur clique "Médicaments reçus", **Then** demande → état F + email patient

---

### User Story 4 — Verrous anti-doublon (Priority: P3)

Quand un aidant prend un rôle (acheteur ou transporteur), plus personne ne peut prendre le même rôle pendant une durée définie (24h par défaut, configurable). Si le verrou expire sans que la demande avance, les autres aidants peuvent proposer à nouveau.

**Why this priority**: Garantit l'intégrité du workflow. Priorité P3 car les scénarios de base fonctionnent sans verrou, mais la production en a besoin.

**Independent Test**: Peut être testé en soumettant deux propositions du même type en séquence.

**Acceptance Scenarios**:

1. **Given** un `prop_achat_envoi` soumis, **When** un second aidant tente `prop_achat_envoi` ou `prop_achat_transport` dans le délai, **Then** la proposition est refusée avec un message d'erreur clair
2. **Given** un `prop_transport` soumis, **When** un second aidant tente `prop_transport` dans le délai, **Then** la proposition est refusée
3. **Given** le délai de verrou expiré, **When** un aidant tente à nouveau, **Then** la proposition est acceptée

---

### Edge Cases

- **Aidant qui disparaît** : Si l'acheteur ne donne plus signe de vie alors que la demande est à l'état B ou E, le verrou expire après 24h et d'autres aidants peuvent proposer à nouveau.
- **Soumissions simultanées** : Deux aidants soumettent `prop_achat_envoi` en même temps → le premier arrivé gagne ; le second reçoit une erreur de verrou.
- **Tentative de clic non autorisé** : Un aidant non-transporteur tente de cliquer "Médicaments reçus" à l'état E → bouton absent, action bloquée côté serveur.
- **Demande à l'état D scénario 1 sans suivi** : Le transporteur unique ne répond plus → le patient peut signaler via le chat.
- **Email non délivré** : Si l'envoi email échoue après 3 tentatives, le fait est consigné et visible pour un administrateur.

## Requirements *(mandatory)*

### Functional Requirements

**États et transitions**

- **FR-001**: La demande DOIT passer par les 8 états définis (A à H) selon les transitions autorisées uniquement : A, B, C, D, E, F, G, H.
- **FR-002**: L'état initial d'une demande créée DOIT être A (`nouvelle_demande`).
- **FR-003**: L'état H (`traitee`) DOIT être un état terminal — aucune transition possible depuis H.
- **FR-004**: En état D, si un aidant unique couvre les deux rôles (via `prop_achat_transport`), le système DOIT automatiquement envoyer un email au patient et passer la demande à l'état F sans action manuelle.
- **FR-005**: En état D, si deux aidants distincts couvrent les rôles, un bouton "Médicaments envoyés au transporteur" DOIT être visible uniquement pour l'aidant-acheteur assigné, permettant la transition D → E.

**Types de propositions**

- **FR-006**: Trois types de propositions DOIVENT être disponibles pour les aidants : `prop_achat_envoi` (acheter + envoyer au transporteur), `prop_transport` (transporter jusqu'au patient), `prop_achat_transport` (acheter + transporter soi-même).
- **FR-007**: `prop_achat_envoi` DOIT être disponible uniquement quand la demande est à l'état A ou C.
- **FR-008**: `prop_transport` DOIT être disponible uniquement quand la demande est à l'état A ou B.
- **FR-009**: `prop_achat_transport` DOIT être disponible uniquement quand la demande est à l'état A.

**Verrous anti-doublon**

- **FR-010**: Lorsqu'un aidant soumet `prop_achat_envoi` ou `prop_achat_transport`, un verrou acheteur DOIT être posé pour une durée de 24h (configurable). Pendant ce délai, aucun autre aidant ne peut soumettre ces types de propositions.
- **FR-011**: Lorsqu'un aidant soumet `prop_transport` ou `prop_achat_transport`, un verrou transporteur DOIT être posé pour la même durée. Pendant ce délai, aucun autre aidant ne peut soumettre `prop_transport`.
- **FR-012**: Un verrou expiré DOIT permettre à n'importe quel aidant de proposer à nouveau le rôle concerné.
- **FR-013**: En cas de proposition bloquée par un verrou, l'aidant DOIT recevoir un message d'erreur explicite indiquant que le rôle est temporairement réservé.

**Boutons contextuels**

- **FR-014**: En état E, un bouton "Médicaments reçus" DOIT être visible uniquement pour l'aidant-transporteur assigné. Son activation DOIT déclencher la transition E → F et l'envoi d'un email au patient.
- **FR-015**: En état F, un bouton "RDV fixé avec transporteur" DOIT être visible uniquement pour le patient. Son activation DOIT déclencher la transition F → G.
- **FR-016**: En état G, un bouton "Médicaments reçus" DOIT être visible uniquement pour le patient. Son activation DOIT déclencher la transition G → H.
- **FR-017**: Tous les boutons contextuels DOIVENT être entièrement absents (non désactivés, absents) pour les rôles non autorisés.

**Notifications email**

- **FR-018**: Lors de la transition A→D via `prop_achat_transport` (scénario 1), le système DOIT envoyer un email au patient l'invitant à fixer un RDV.
- **FR-019**: Lors de la transition B→D (scénario 2), le système DOIT envoyer un email à l'aidant-acheteur l'informant qu'un transporteur est disponible.
- **FR-020**: Lors de la transition C→D (scénario 3), le système DOIT envoyer un email à l'aidant-transporteur l'informant qu'un acheteur est prêt.
- **FR-021**: Lors de la transition E→F (transporteur clique "Médicaments reçus"), le système DOIT envoyer un email au patient l'invitant à fixer un RDV.
- **FR-022**: Chaque notification email DOIT être envoyée exactement une fois par événement déclencheur (protection anti-doublon).

**Suppression de l'ancien modèle**

- **FR-023**: Le modèle de cagnotte (collecte de fonds, contributions, objectif financier) DOIT être entièrement supprimé du workflow des demandes.
- **FR-024**: L'ancien type de proposition `prop1_cagnotte` et les états associés (`fonds_atteints`, `attente_fonds_et_transporteur`) DOIVENT être supprimés.

### Key Entities

- **Demande**: Représente la demande de médicaments d'un patient. Attributs clés : état (A-H), identifiant acheteur assigné, identifiant transporteur assigné, timestamps de verrous acheteur/transporteur, indicateur "aidant unique couvre les deux rôles".
- **Proposition**: Engagement d'un aidant sur une demande. Types : `prop_achat_envoi`, `prop_transport`, `prop_achat_transport`. Reliée à un aidant et à une demande.
- **Aidant-Acheteur**: Aidant qui achète les médicaments et les envoie au transporteur (ou les livre directement au patient dans le scénario 1).
- **Aidant-Transporteur**: Aidant qui récupère les médicaments auprès de l'acheteur et les livre au patient (ou est le même que l'acheteur dans le scénario 1).
- **Notification Email**: Déclenchée automatiquement lors de certaines transitions. Destinataires : patient, aidant-acheteur, ou aidant-transporteur selon la transition.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les 3 scénarios de workflow (1 aidant, 2 aidants ordre A→B, 2 aidants ordre B→A) se déroulent sans erreur du début (état A) à la fin (état H).
- **SC-002**: Aucune transition illégale n'est possible — toute tentative est rejetée avec un message d'erreur explicite en moins de 2 secondes.
- **SC-003**: Les verrous anti-doublon bloquent 100% des tentatives de double-proposition dans le délai imparti.
- **SC-004**: Les boutons contextuels sont absents pour les rôles non autorisés — 0% de fuite de visibilité vers d'autres rôles.
- **SC-005**: Les notifications email sont déclenchées dans les 60 secondes suivant la transition concernée.
- **SC-006**: Chaque notification email est envoyée exactement une fois par événement (0 doublon, 0 omission).
- **SC-007**: La suppression du modèle cagnotte ne casse aucune fonctionnalité existante non liée à la cagnotte (création de demande, ordonnance, chat, profil).

## Assumptions

- La durée du verrou anti-doublon est de 24 heures par défaut. Elle pourra être configurée ultérieurement sans modifier le workflow.
- La coordination entre acheteur et transporteur (états D et E) se fait via le chat intégré existant — aucune nouvelle interface de coordination n'est nécessaire dans cette itération.
- Le modèle de cagnotte est entièrement supprimé (pas de migration de données — les données de développement peuvent être réinitialisées).
- L'identification du rôle de l'utilisateur courant (patient, aidant-acheteur, aidant-transporteur) repose sur les champs de la demande comparés à l'identifiant de l'utilisateur connecté.
- La transition D→F dans le scénario 1 est automatique (déclenchée par le système immédiatement après l'entrée en état D via `prop_achat_transport`, sans action utilisateur supplémentaire).
- Les emails sont envoyés via la fonction Edge Supabase existante (006-patient-notifications) qui sera étendue pour supporter les nouveaux types d'événements.
