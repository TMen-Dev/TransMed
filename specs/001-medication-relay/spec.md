# Feature Specification: Mise en relation patients-aidants pour médicaments

**Feature Branch**: `master`
**Created**: 2026-02-18
**Updated**: 2026-02-27
**Status**: Implemented — MVP (données mockées)
**Input**: User description: "Je veux créer une application mobile moderne ayant pour but de mettre en relation des patients ayant besoin de médicaments avec des aidants (acheteurs et/ou transporteurs). Pour l'instant les données sont mockées."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Patient crée une demande de médicaments (Priority: P1)

Un patient qui a besoin de médicaments ouvre l'application, saisit la liste des médicaments dont il a besoin, indique son adresse de livraison et publie sa demande. La demande est alors visible par les aidants disponibles.

**Why this priority**: C'est le cœur de valeur de l'application. Sans demande créée, aucune mise en relation n'est possible. C'est la fonctionnalité qui déclenche tout le reste.

**Independent Test**: Peut être testé en isolation en vérifiant qu'une demande soumise par un patient apparaît dans la liste des demandes disponibles, sans qu'aucun aidant n'ait encore à intervenir.

**Acceptance Scenarios**:

1. **Given** un patient connecté sur l'écran d'accueil, **When** il crée une nouvelle demande en saisissant un ou plusieurs médicaments et son adresse, **Then** la demande est enregistrée avec le statut "En attente" et apparaît dans son historique.
2. **Given** un patient sur le formulaire de demande, **When** il tente de soumettre sans avoir saisi de médicament ou sans avoir joint d'ordonnance, **Then** un message d'erreur lui demande de compléter les champs obligatoires (médicaments + ordonnance).
3. **Given** une demande créée avec succès, **When** le patient consulte sa liste de demandes, **Then** il voit sa nouvelle demande avec son statut actuel et le détail des médicaments.

---

### User Story 2 - Aidant propose son aide sur une demande (Priority: P2)

Un aidant consulte la liste des demandes actives et choisit comment contribuer : soit en participant à la cagnotte (Prop1), soit en proposant de transporter (Prop2), soit en s'engageant à acheter ET transporter (Prop3). Chaque proposition met à jour le statut de la demande selon les règles définies.

**Why this priority**: C'est la mise en relation elle-même. Sans proposition d'aidant, la demande reste bloquée. Cette histoire valide les 3 flux de proposition et les transitions de statut.

**Independent Test**: Peut être testé en vérifiant que chaque type de proposition (Prop1/2/3) produit la transition de statut attendue sur la demande.

**Acceptance Scenarios**:

1. **Given** une demande au statut 1, **When** un aidant fait une Prop2 (transport), **Then** le statut passe à 5 (`transporteur_disponible`).
2. **Given** une demande au statut 1, **When** des contributions Prop1 atteignent le montant cible de la cagnotte, **Then** le statut passe à 4 (`fonds_atteints`).
3. **Given** une demande au statut 4, **When** un aidant fait une Prop2 (transport), **Then** le statut passe à 6 (`pret_acceptation_patient`).
4. **Given** une demande au statut 5, **When** la cagnotte atteint son objectif via une Prop1, **Then** le statut passe à 6 (`pret_acceptation_patient`).
5. **Given** une demande au statut 1, **When** un aidant fait une Prop3 (achat + transport), **Then** le statut passe directement à 6 (`pret_acceptation_patient`).

---

### User Story 3 - Patient confirme et suit sa demande (Priority: P3)

Un patient suit en temps réel la progression de sa demande à travers les 8 statuts. Lorsque le statut atteint 6 (fonds atteints + transporteur disponible), le patient doit confirmer pour lancer la livraison.

**Why this priority**: La confirmation du patient est le déclencheur de la livraison. Sans cette étape, la demande reste bloquée en statut 6.

**Independent Test**: Peut être testé en vérifiant que le bouton "Confirmer" apparaît uniquement au statut 6, et que la confirmation bascule le statut à 7.

**Acceptance Scenarios**:

1. **Given** une demande au statut 6, **When** le patient consulte le détail, **Then** il voit un bouton "Confirmer la livraison" et les informations de l'aidant (prénom, type de proposition).
2. **Given** une demande au statut 6, **When** le patient appuie sur "Confirmer", **Then** le statut passe à 7 (`en_cours_livraison`) et le bouton disparaît.
3. **Given** un patient avec plusieurs demandes, **When** il consulte son historique, **Then** il voit toutes ses demandes triées par date avec leur statut courant (libellé lisible, ex. "En attente de fonds").

---

### User Story 4 - Aidant marque la livraison comme effectuée (Priority: P4)



Après avoir remis les médicaments au patient, l'aidant ayant fait une Prop3 (achat + transport) marque la demande comme livrée, ce qui clôture la demande au statut 8.

**Why this priority**: Clôture le cycle complet et met à jour le statut final visible par le patient. Dépend des histoires P1, P2 et P3.

**Independent Test**: Peut être testé en vérifiant que l'action "Marquer comme livré" depuis le statut 7 bascule la demande au statut 8 (`traitee`).

**Acceptance Scenarios**:

1. **Given** un aidant (Prop3) avec une demande au statut 7, **When** il appuie sur "Médicaments livrés", **Then** la demande passe au statut 8 (`traitee`) et disparaît de sa liste de demandes actives.
2. **Given** une demande au statut 8, **When** le patient consulte son historique, **Then** il voit le statut "Traitée" et la date de livraison.

---

### User Story 5 - Utilisateur découvre le fonctionnement de l'application (Priority: P5)

Un nouvel utilisateur (patient ou aidant) qui ne comprend pas encore comment fonctionne l'application consulte la page "À propos" pour comprendre les 6 étapes du cycle de vie d'une demande, depuis la création jusqu'à la livraison.

**Why this priority**: Facilite l'adoption par les nouveaux utilisateurs et réduit les questions de support. Non bloquant pour le flux principal.

**Independent Test**: Peut être testé indépendamment en vérifiant que la page "À propos" est accessible depuis la navigation principale et affiche les 6 étapes dans le bon ordre.

**Acceptance Scenarios**:

1. **Given** un utilisateur sur l'application, **When** il accède à la section "À propos", **Then** il voit les 6 étapes du fonctionnement (création demande → mobilisation aidants → financement → confirmation → livraison → clôture) avec une description claire de chaque étape.
2. **Given** un utilisateur sur la page "À propos", **When** il la consulte, **Then** il comprend le contexte géographique (patients en Algérie, médicaments disponibles en France) et le caractère bénévole de l'aide.

---

### Edge Cases

- Que se passe-t-il si un aidant (Prop2 ou Prop3) ne livre jamais après que la demande est au statut 7 ? (La demande reste au statut 7 — acceptable pour le MVP mocked ; une gestion par timeout sera à envisager dans une version future.)
- Que se passe-t-il si deux aidants font simultanément une Prop2 ? (La première Prop2 est enregistrée ; les suivantes sont ignorées ou refusées car le transporteur est déjà assigné.)
- Que se passe-t-il si un aidant fait une Prop3 alors qu'une Prop2 est déjà enregistrée ? (À définir : refus ou remplacement — à clarifier en version live ; pour le MVP, la Prop3 prévaut.)
- Que se passe-t-il si le patient saisit un médicament mal orthographié ou introuvable ? (Pour le MVP, la saisie est libre ; aucune validation de nomenclature médicament n'est requise.)
- Que se passe-t-il si deux aidants tentent d'accepter la même demande simultanément ? (Avec des données mockées ce cas est évité ; à gérer par verrouillage optimiste dans une version live.)
- Que se passe-t-il si le patient ferme l'application pendant la création d'une demande ? (La demande n'est pas enregistrée si le formulaire n'est pas soumis — comportement standard.)
- Que se passe-t-il si le fichier d'ordonnance est trop volumineux ou dans un format non supporté ? (Pour le MVP, les formats acceptés sont image (JPG, PNG) et PDF ; un message d'erreur s'affiche si le format est incorrect.)
- Que se passe-t-il si un aidant tente de télécharger l'ordonnance sans avoir le rôle acheteur ? (Le bouton de téléchargement n'est pas affiché ; si accès direct tenté, accès refusé.)
- Que se passe-t-il si la cagnotte n'a pas encore de montant cible défini et qu'un aidant veut contribuer ? (L'aidant ne peut pas contribuer tant que l'acheteur n'a pas fixé le montant cible — la cagnotte est en statut "En attente d'évaluation".)
- Que se passe-t-il si la cagnotte dépasse le montant cible ? (Les contributions supplémentaires sont acceptées ; le surplus est géré hors de l'application dans cette version.)
- Que se passe-t-il si un aidant envoie un message dans le chat mais que la demande a déjà été acceptée par un autre aidant ? (Le chat reste visible et actif — le patient peut toujours y répondre pour informer les autres aidants que la demande est prise en charge.)
- Que se passe-t-il si le chat est vide (aucun message) ? (L'écran affiche un état vide avec un message invitant à poser une question.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un patient de créer une demande de médicaments contenant au moins un médicament (nom + quantité).
- **FR-002**: Le système DOIT permettre au patient d'indiquer une adresse de livraison associée à sa demande.
- **FR-003**: Le système DOIT gérer les 8 statuts suivants pour une demande, avec les transitions définies ci-dessous :
  - **Statut 1** `attente_fonds_et_transporteur` : état initial — ni les fonds ni le transporteur ne sont disponibles.
  - **Statut 2** `attente_fonds` : un transporteur est disponible, les fonds ne sont pas encore atteints.
  - **Statut 3** `attente_transporteur` : les fonds sont atteints, un transporteur est encore attendu.
  - **Statut 4** `fonds_atteints` : le montant cible de la cagnotte vient d'être atteint.
  - **Statut 5** `transporteur_disponible` : un aidant s'est proposé comme transporteur.
  - **Statut 6** `pret_acceptation_patient` : fonds atteints ET transporteur disponible — le patient doit confirmer.
  - **Statut 7** `en_cours_livraison` : le patient a confirmé, la livraison est en cours.
  - **Statut 8** `traitee` : médicaments livrés au patient, demande clôturée.
- **FR-004**: Le système DOIT afficher aux aidants la liste des demandes aux statuts 1, 2, 3, 4 ou 5 (demandes actives en attente de contribution).
- **FR-005**: Un aidant DOIT pouvoir consulter le détail d'une demande (médicaments, adresse, date de création, statut, progression cagnotte).
- **FR-006**: Un aidant DOIT pouvoir proposer son aide selon l'un des 3 types de proposition suivants :
  - **Prop1** — Participer à la cagnotte : contribuer financièrement au financement de l'achat.
  - **Prop2** — Transporter les médicaments : s'engager à récupérer et livrer les médicaments au patient.
  - **Prop3** — Acheter et transporter : s'engager à acheter les médicaments en pharmacie ET les livrer.
- **FR-007**: Le système DOIT mettre à jour le statut de la demande selon la règle de transition suivante lors d'une proposition :
  - Si **Prop1** : mettre à jour le montant collecté de la cagnotte. Si la cagnotte atteint son objectif → statut devient **4** (`fonds_atteints`). Si le statut était déjà **5** (`transporteur_disponible`) → statut devient **6** (`pret_acceptation_patient`).
  - Si **Prop2** : statut devient **5** (`transporteur_disponible`). Si le statut était déjà **4** (`fonds_atteints`) → statut devient **6** (`pret_acceptation_patient`).
  - Si **Prop3** : statut devient directement **6** (`pret_acceptation_patient`), car l'aidant couvre à la fois l'achat et le transport.
- **FR-008**: Le patient DOIT pouvoir confirmer la demande depuis l'écran de détail lorsque le statut est **6** (`pret_acceptation_patient`), ce qui déclenche le passage au statut **7** (`en_cours_livraison`).
- **FR-009**: Le patient DOIT pouvoir consulter l'historique de toutes ses demandes avec leur statut courant.
- **FR-010**: Le système DOIT afficher, pour une demande en cours, la liste des aidants ayant proposé leur aide (prénom, type de proposition, montant contribué pour Prop1).
- **FR-010b**: L'aidant ayant fait une Prop3 (achat + transport) DOIT marquer la demande comme livrée (statut 7 → 8) une fois les médicaments remis au patient.
- **FR-011**: Les données initiales (patients, aidants, demandes) DOIVENT être mockées localement pour permettre le développement sans backend.
- **FR-012**: Le système DOIT distinguer les deux profils d'utilisateurs — Patient et Aidant — avec des vues et des actions propres à chaque rôle.
- **FR-013**: Le système DOIT proposer un écran de chat associé à chaque demande, accessible dès sa création, permettant à tout aidant potentiel d'échanger avec le patient avant d'accepter la demande.
- **FR-014**: Les messages du chat DOIVENT être associés à une demande spécifique et afficher l'auteur (patient ou aidant) ainsi que l'horodatage.
- **FR-015**: La couche d'accès aux données DOIT être abstraite derrière une interface unique, de sorte que le remplacement des données mockées par un backend réel ne nécessite aucune modification des vues ni de la logique métier.
- **FR-016**: Le patient DOIT obligatoirement joindre une ordonnance (fichier image ou PDF) à sa demande — sans ordonnance, la soumission du formulaire est bloquée.
- **FR-017**: L'ordonnance associée à une demande DOIT être consultable uniquement par les aidants ayant soumis une proposition d'achat (Prop1 ou Prop3) sur cette demande. Les aidants sans proposition active sur la demande n'ont pas accès à l'ordonnance.
- **FR-018**: Chaque demande DOIT disposer d'une cagnotte affichant un montant cible et le montant déjà collecté.
- **FR-019**: Seuls les aidants inscrits PEUVENT contribuer financièrement à la cagnotte d'une demande.
- **FR-020**: Le système DOIT afficher en temps réel (ou au rechargement en mode mocked) la progression de la cagnotte (montant collecté / montant cible).
- **FR-021**: Le montant cible de la cagnotte est fixé par l'aidant de rôle acheteur, après consultation des prix en pharmacie. Le patient n'est pas tenu de saisir un montant lors de la création de la demande.
- **FR-022**: Tant que le montant cible n'a pas été défini par un acheteur, la cagnotte est affichée comme "En attente d'évaluation" et les contributions (Prop1) sont bloquées.
- **FR-023**: Seul un aidant de rôle acheteur peut saisir le montant cible de la cagnotte depuis l'écran de détail de la demande. Cette action déverrouille les Prop1.
- **FR-024**: Une fois le transporteur assigné (Prop2), toute nouvelle Prop2 sur la même demande est refusée — un seul transporteur par demande.
- **FR-025**: L'utilisateur DOIT renseigner son prénom lors de sa première connexion, en complément de la sélection de son rôle (patient ou aidant). Le prénom est utilisé pour identifier l'utilisateur dans les échanges (chat, liste des aidants engagés).
- **FR-026**: L'application DOIT proposer une section "À propos" accessible depuis la navigation principale, présentant le fonctionnement de l'application en 6 étapes illustrées, le contexte géographique et la nature bénévole du service.
- **FR-027**: L'utilisateur DOIT pouvoir rafraîchir manuellement la liste des demandes pour obtenir les données les plus récentes.
- **FR-028**: L'utilisateur DOIT pouvoir se déconnecter depuis la liste des demandes, ce qui le renvoie à l'écran de sélection du profil.

### Key Entities

- **Patient**: Utilisateur ayant besoin de médicaments. Attributs : identifiant, prénom, adresse par défaut. Peut avoir plusieurs demandes actives.
- **Aidant**: Utilisateur prêt à aider. Attributs : identifiant, prénom. Peut soumettre une ou plusieurs propositions (Prop1/2/3) sur différentes demandes. Plusieurs aidants peuvent contribuer à la même demande.
- **Demande de médicaments**: Objet central de mise en relation. Attributs : identifiant, liste de médicaments, adresse de livraison, statut (1 à 8, voir FR-003), date de création, patient associé, liste de propositions d'aidants (Prop1/2/3).
- **Médicament** (dans une demande): Nom du médicament et quantité demandée. Entité embarquée dans la demande, sans entité indépendante pour le MVP.
- **Message**: Échange textuel lié à une demande. Attributs : identifiant, contenu, auteur (patient ou aidant), horodatage, identifiant de la demande associée.
- **Ordonnance**: Document médical joint à une demande par le patient. Attributs : identifiant, identifiant de la demande associée, fichier (image ou PDF), date d'upload. Accessible uniquement aux aidants de rôle acheteur.
- **Cagnotte**: Système de collecte lié à une demande. Attributs : identifiant, identifiant de la demande, montant cible (fixé par l'acheteur, optionnel jusqu'à évaluation), montant collecté, statut (en_attente_evaluation / ouverte / atteinte), liste de contributions.
- **Contribution**: Apport financier d'un aidant à la cagnotte d'une demande. Attributs : identifiant, identifiant de la cagnotte, identifiant de l'aidant contributeur, montant, date.
- **Proposition**: Engagement d'un aidant sur une demande. Attributs : identifiant, type (Prop1 / Prop2 / Prop3), identifiant de l'aidant, identifiant de la demande, date. Une demande peut avoir plusieurs propositions de types différents.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un patient peut créer et soumettre une demande de médicaments en moins de 2 minutes.
- **SC-002**: Un aidant peut consulter la liste des demandes disponibles et en accepter une en moins de 1 minute.
- **SC-003**: Le statut d'une demande est visible et à jour pour le patient immédiatement après l'action de l'aidant (ou au rechargement de la vue en mode mocked).
- **SC-004**: 100 % des flux principaux (création, acceptation, livraison) sont fonctionnels avec les données mockées sans erreur bloquante.
- **SC-005**: Les deux profils utilisateurs (Patient / Aidant) disposent de vues clairement séparées et adaptées à leur rôle respectif.
- **SC-006**: L'intégralité du cycle MVP (inscription → création demande → proposition aidant → confirmation patient → livraison → clôture) peut être démontrée de bout en bout sans erreur bloquante avec les données mockées.

## Clarifications

### Session 2026-02-18

- Q: Quand l'écran CHAT est-il accessible et entre qui ? → A: Dès la création de la demande, pour permettre à tout aidant potentiel de poser des questions au patient avant d'accepter la demande.
- Q: Qui peut contribuer à la cagnotte d'une demande ? → A: Uniquement les aidants inscrits.
- Q: L'ordonnance est-elle obligatoire pour créer une demande ? → A: Oui, obligatoire pour toute demande.
- Q: Qui fixe le montant cible de la cagnotte ? → A: L'acheteur (aidant de rôle acheteur), qui est sur place en France et consulte les prix en pharmacie. Le patient ne connaît pas les prix car il se trouve à l'étranger (ex. Algérie) et les médicaments ne sont disponibles qu'en France.
- Contexte fourni : machine d'états complète (8 statuts) et 3 types de propositions d'aide. Typo corrigée : "si Prop2 → statut 6" dans l'input original était "si Prop3 → statut 6".
- Q: Les Prop1 (contributions cagnotte) sont-elles possibles avant que l'acheteur fixe le montant cible ? → A: Non. L'acheteur doit d'abord évaluer et saisir le montant cible. Tant que la cagnotte est "En attente d'évaluation", aucune Prop1 n'est acceptée.

## Assumptions

- **Authentification simplifiée**: Pour le MVP avec données mockées, la sélection du profil utilisateur (Patient ou Aidant) se fait via un écran de sélection simple au démarrage, sans mot de passe ni compte réel.
- **Contexte géographique**: Les patients se trouvent à l'étranger (ex. Algérie) et ont besoin de médicaments disponibles uniquement en France. Les aidants (acheteurs et transporteurs) sont basés en France. C'est pourquoi les patients ne connaissent pas les prix des médicaments : ils dépendent des acheteurs pour évaluer le coût réel.
- **Cagnotte sans paiement réel**: La cagnotte représente un engagement ou une contribution simulée dans le MVP mocked. Aucune intégration de paiement réel (Stripe, PayPal, virement) n'est prévue dans cette version. Les montants et contributions sont des données mockées.
- **Pas de géolocalisation active**: L'adresse du patient est saisie manuellement ; aucune détection GPS ni matching géographique automatique n'est requis pour le MVP.
- **Notifications**: Pas de notifications push pour le MVP ; le patient rafraîchit manuellement ou la vue se met à jour à l'ouverture.
- **Plusieurs aidants par demande**: Une demande peut recevoir des propositions de plusieurs aidants simultanément (ex. plusieurs Prop1 pour la cagnotte, un Prop2 pour le transport). C'est la combinaison des propositions qui fait progresser le statut.
- **Données mockées → base de données** : Le MVP utilise des données mockées localement. L'architecture de la couche d'accès aux données doit être conçue pour permettre un remplacement transparent par un vrai backend (base de données + API) sans refonte des composants UI ni des flux métier. Toutes les entités (Patient, Aidant, Demande, Message) sont à terme persistées côté serveur.
- **Déconnexion** : La déconnexion est disponible depuis la liste des demandes et renvoie l'utilisateur à l'écran d'inscription. En mode mocked, aucune session persistante n'est gérée — la déconnexion réinitialise simplement l'état local.
- **Navigation principale** : L'application est structurée avec une barre de navigation en bas à deux onglets ("Demandes" et "À propos"), accessible dès que l'utilisateur est connecté.
