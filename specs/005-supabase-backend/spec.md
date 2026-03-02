# Feature Specification: Intégration backend persistant (Supabase)

**Feature Branch**: `005-supabase-backend`
**Created**: 2026-03-01
**Status**: Draft
**Input**: User description: "Intégrer Supabase comme backend persistant pour remplacer les données mockées TypeScript. Authentification réelle des utilisateurs (email/password) via Supabase Auth. Base de données PostgreSQL pour toutes les entités : demandes, médicaments, patients, aidants, messages, propositions, contributions, cagnotte. Supabase Storage pour les ordonnances (bucket privé avec signed URLs). La couche d'accès aux données (services TypeScript) doit être remplacée de façon transparente sans modifier les composants Vue ni les stores Pinia — seuls les services/repositories changent. Row Level Security (RLS) pour isoler les données par utilisateur."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Inscription et connexion réelle (Priority: P1)

Un patient ou aidant peut créer un compte réel avec son email et un mot de passe, puis se connecter depuis n'importe quel appareil. Sa session persiste entre les ouvertures de l'application. Il peut se déconnecter à tout moment.

**Why this priority**: Sans authentification réelle, aucune donnée ne peut être associée à un utilisateur spécifique, et toute la persistence des données est impossible. C'est le prérequis absolu de toutes les autres histoires.

**Independent Test**: Un nouvel utilisateur ouvre l'application, crée un compte email/password, ferme l'application complètement, la rouvre — il est encore connecté et voit son espace personnel vide.

**Acceptance Scenarios**:

1. **Given** un utilisateur non inscrit, **When** il saisit un email valide et un mot de passe de 8 caractères minimum sur l'écran d'inscription, **Then** un compte est créé et l'utilisateur est redirigé vers l'application
2. **Given** un utilisateur inscrit, **When** il saisit ses identifiants corrects, **Then** il est connecté et ses données personnelles sont chargées
3. **Given** un utilisateur connecté, **When** il ferme et rouvre l'application, **Then** il est encore connecté sans avoir à ressaisir ses identifiants
4. **Given** un utilisateur connecté, **When** il appuie sur "Se déconnecter", **Then** sa session est invalidée et il est redirigé vers l'écran de connexion
5. **Given** un utilisateur qui saisit des identifiants incorrects, **When** il tente de se connecter, **Then** un message d'erreur clair s'affiche (identifiants invalides)

---

### User Story 2 — Persistance des demandes entre sessions (Priority: P1)

Les demandes créées par un patient sont sauvegardées et disponibles à tout moment, y compris après fermeture de l'application ou changement d'appareil. Les aidants voient les demandes actives publiées par les patients.

**Why this priority**: C'est la valeur fondamentale de l'application — sans persistance, les demandes disparaissent à chaque fermeture, rendant l'application inutilisable en conditions réelles.

**Independent Test**: Un patient crée une demande sur son téléphone. Un aidant ouvre l'application sur un autre appareil — il voit la demande dans la liste. Le patient ferme et rouvre l'application — sa demande est toujours là avec son statut actuel.

**Acceptance Scenarios**:

1. **Given** un patient connecté, **When** il crée une demande de médicaments, **Then** la demande est sauvegardée et visible par tous les aidants connectés
2. **Given** un patient avec des demandes existantes, **When** il ferme et rouvre l'application, **Then** toutes ses demandes sont chargées avec leurs statuts actuels
3. **Given** un aidant qui effectue une proposition (Prop1/2/3), **When** l'action est confirmée, **Then** la mise à jour du statut est persistée et visible pour le patient et les autres aidants
4. **Given** plusieurs aidants qui consultent la même demande, **When** l'un d'eux effectue une action, **Then** les autres voient le statut mis à jour sans relancer l'application
5. **Given** un patient dont la demande atteint le statut `pret_acceptation_patient`, **When** il ouvre la demande, **Then** il voit le bouton de confirmation

---

### User Story 3 — Upload et consultation sécurisés des ordonnances (Priority: P2)

Quand un patient joint une ordonnance à sa demande, le fichier est stocké de façon sécurisée. Seuls les aidants autorisés (ceux ayant soumis une proposition d'achat sur cette demande) peuvent consulter le document.

**Why this priority**: L'ordonnance contient des données médicales sensibles. Sa sécurisation est critique pour la conformité et la confiance des utilisateurs. Dépend de P1.

**Independent Test**: Un patient upload une ordonnance. Un aidant sans proposition sur la demande tente d'accéder à l'URL de l'ordonnance — accès refusé. Un aidant ayant fait une Prop3 accède à l'ordonnance — le document s'affiche.

**Acceptance Scenarios**:

1. **Given** un patient qui joint un fichier PDF ou image lors de la création d'une demande, **When** il soumet la demande, **Then** le fichier est stocké de façon sécurisée et une référence est associée à la demande
2. **Given** un aidant ayant soumis une Prop1 ou Prop3 sur une demande, **When** il consulte le détail de la demande, **Then** il peut visualiser l'ordonnance associée
3. **Given** un aidant n'ayant pas de proposition active sur une demande, **When** il tente d'accéder à l'ordonnance, **Then** l'accès est refusé
4. **Given** une ordonnance stockée, **When** son lien d'accès est généré, **Then** ce lien expire après 60 minutes et ne peut pas être partagé indéfiniment

---

### User Story 4 — Chat persisté et temps réel (Priority: P2)

Les messages échangés entre patients et aidants sur une demande sont sauvegardés et apparaissent instantanément pour tous les participants, sans qu'ils aient à recharger l'écran.

**Why this priority**: Le chat est un outil de coordination critique. Sans persistance, les échanges disparaissent. Sans mise à jour en temps réel, les participants ne se voient pas mutuellement. Dépend de P1.

**Independent Test**: Un patient envoie un message sur une demande. Un aidant ouvert sur le même écran chat voit le message apparaître en moins de 2 secondes, sans recharger.

**Acceptance Scenarios**:

1. **Given** un utilisateur qui envoie un message dans le chat d'une demande, **When** le message est soumis, **Then** il apparaît immédiatement dans son fil de discussion
2. **Given** deux utilisateurs sur le même fil de chat, **When** l'un envoie un message, **Then** l'autre le voit s'afficher automatiquement sans action de sa part
3. **Given** un utilisateur qui revient sur un chat après l'avoir quitté, **When** il ouvre l'écran chat, **Then** tous les messages précédents sont affichés dans l'ordre chronologique

---

### User Story 5 — Isolation des données par utilisateur (Priority: P2)

Un patient ne peut accéder qu'à ses propres demandes depuis son compte. Aucun utilisateur ne peut lire ou modifier les données d'un autre utilisateur en contournant l'interface.

**Why this priority**: Sans isolation des données, un utilisateur malveillant pourrait accéder aux demandes médicales d'autres patients. C'est une exigence de sécurité non négociable. Dépend de P1.

**Independent Test**: Alice (patiente) et Bob (patient) ont chacun des demandes. Alice se connecte — elle ne voit que ses demandes dans son historique, pas celles de Bob. Si Alice manipule une URL avec l'identifiant d'une demande de Bob, elle reçoit une erreur.

**Acceptance Scenarios**:

1. **Given** un patient connecté, **When** il consulte son historique de demandes, **Then** il ne voit que les demandes qu'il a créées
2. **Given** un aidant connecté, **When** il consulte la liste des demandes disponibles, **Then** il voit les demandes actives de tous les patients (statuts 1 à 5) mais ne voit pas les données personnelles des autres utilisateurs
3. **Given** un utilisateur qui tente d'accéder à une ressource appartenant à un autre utilisateur, **When** la requête est traitée, **Then** l'accès est refusé et aucune information sur la ressource n'est divulguée

---

### Edge Cases

- Que se passe-t-il si la connexion réseau est perdue pendant la création d'une demande ? → La demande n'est pas publiée, un message d'erreur invite l'utilisateur à réessayer.
- Que se passe-t-il si deux aidants soumettent une Prop2 simultanément ? → Seule la première est acceptée, un message informe le second que le transporteur est déjà assigné.
- Que se passe-t-il si l'upload d'ordonnance échoue (timeout réseau) ? → Un message d'erreur s'affiche et l'utilisateur peut réessayer sans perdre les autres données saisies.
- Que se passe-t-il si un token de session expire pendant l'utilisation ? → L'utilisateur est redirigé vers l'écran de connexion avec un message explicatif.
- Que se passe-t-il si une ordonnance dépasse la limite de taille ? → Un message d'erreur indique la taille maximale autorisée (10 Mo) avant l'upload.
- Que se passe-t-il si un utilisateur inscrit tente de s'inscrire à nouveau avec le même email ? → Un message l'informe que ce compte existe déjà et l'invite à se connecter.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-501**: Le système DOIT permettre à un nouvel utilisateur de créer un compte avec son email et un mot de passe (minimum 8 caractères)
- **FR-502**: Le système DOIT permettre à un utilisateur inscrit de se connecter avec son email et son mot de passe
- **FR-503**: Le système DOIT maintenir la session de l'utilisateur entre les ouvertures de l'application (durée minimale : 7 jours)
- **FR-504**: Le système DOIT permettre à l'utilisateur de se déconnecter explicitement, invalidant sa session immédiatement
- **FR-505**: Le système DOIT associer chaque utilisateur à un rôle (patient ou aidant) et à un prénom saisi lors de la première connexion
- **FR-506**: Le système DOIT persister toutes les demandes de médicaments en base de données centrale, accessibles depuis tout appareil
- **FR-507**: Le système DOIT persister toutes les propositions (Prop1/2/3), contributions et mises à jour de statut en base de données
- **FR-508**: Le système DOIT persister tous les messages du chat en base de données et les diffuser en temps réel aux participants connectés
- **FR-509**: Le système DOIT stocker les fichiers ordonnances de façon sécurisée dans un espace de stockage privé non accessible publiquement
- **FR-510**: Le système DOIT générer des liens d'accès temporaires (60 minutes maximum) aux ordonnances pour les aidants autorisés
- **FR-511**: Le système DOIT interdire l'accès aux ordonnances aux aidants n'ayant pas de proposition active sur la demande concernée
- **FR-512**: Le système DOIT appliquer des règles d'isolation des données côté serveur : un patient ne voit que ses propres demandes dans son historique
- **FR-513**: Le système DOIT rejeter toute tentative d'accès à des ressources d'un autre utilisateur, sans révéler l'existence des données
- **FR-514**: La couche d'accès aux données DOIT être remplacée de façon transparente — seule la couche service (`src/services/`) est remplacée. Les stores métier (`demandes.store.ts`, `cagnotte.store.ts`, `chat.store.ts`, `propositions.store.ts`) et les composants Vue métier ne nécessitent aucune modification. **Exception admise** : `src/stores/auth.store.ts` et `src/views/InscriptionView.vue` requièrent des modifications minimales pour brancher l'authentification réelle (ajout de `initSession()`, `register()`, `login()` et gestion de session Supabase)
- **FR-515**: Le système DOIT afficher des messages d'erreur clairs et actionnables en cas d'échec réseau, de session expirée ou d'authentification échouée
- **FR-516**: Le système DOIT afficher un indicateur de chargement pendant les opérations réseau (connexion, création de demande, envoi de message)

### Key Entities

- **Utilisateur**: Identité authentifiée. Attributs : identifiant unique, email, rôle (patient/aidant), prénom, date d'inscription.
- **Session**: Jeton d'authentification associé à un appareil et un utilisateur. Durée de vie configurable, révocable à la déconnexion.
- **Demande**: Entité centrale persistée avec propriétaire (patient), statut, liste de médicaments, adresse de livraison, horodatages.
- **Proposition**: Engagement d'un aidant sur une demande. Type (Prop1/2/3), référence aidant, référence demande, date.
- **Contribution**: Apport financier à la cagnotte. Montant, aidant contributeur, demande associée, date.
- **Cagnotte**: Agrégat financier lié à une demande. Montant cible (fixé par acheteur), montant collecté, statut (en_attente/ouverte/atteinte).
- **Message**: Texte dans le chat d'une demande. Contenu, auteur, demande associée, horodatage.
- **Ordonnance**: Fichier médical joint à une demande. Référence de stockage sécurisée, type MIME, taille, demande associée. Accès contrôlé par proposition active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-501**: Un utilisateur peut créer un compte et accéder à l'application en moins de 2 minutes
- **SC-502**: Les données d'une demande créée sur un appareil sont visibles sur un second appareil en moins de 5 secondes après soumission
- **SC-503**: Les messages du chat apparaissent chez les destinataires en moins de 2 secondes après envoi
- **SC-504**: 100% des tentatives d'accès non autorisés aux ordonnances sont rejetées sans fuite de données médicales
- **SC-505**: Aucun composant d'interface ni store d'état existant ne nécessite de modification lors du remplacement de la couche de données
- **SC-506**: La session utilisateur persiste au minimum 7 jours sans reconnexion requise
- **SC-507**: Le cycle complet (inscription → création demande → proposition aidant → confirmation → livraison) fonctionne de bout en bout avec des données persistées réelles

## Assumptions

- L'email est l'identifiant unique de chaque utilisateur ; la récupération de mot de passe se fait par email
- Les liens d'accès aux ordonnances expirent après 60 minutes
- La taille maximale des ordonnances est limitée à 10 Mo (images JPEG/PNG et PDF)
- La mise à jour en temps réel du chat tolère un délai de 1-2 secondes
- La session persistante est valide 7 jours minimum — après quoi une reconnexion est demandée
- Les règles d'isolation des données sont appliquées côté serveur, rendant tout contournement client impossible
- Les données mockées existantes servent de référence pour le schéma de données mais ne sont pas migrées — les utilisateurs repartent de zéro avec le nouveau backend
- Le backend est hébergé sur infrastructure cloud managée (pas auto-hébergé) pour le MVP
