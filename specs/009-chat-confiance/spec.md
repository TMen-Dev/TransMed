# Feature Specification: Améliorations UX Chat & Confiance

**Feature Branch**: `009-chat-confiance`
**Created**: 2026-03-10
**Status**: Draft
**Input**: Analyse comparative Cocolis.fr — 7 améliorations UX prioritaires

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Pré-chat : l'aidant pose une question avant de se proposer (Priority: P1)

Un aidant consulte la liste des demandes en état `nouvelle_demande`. Il voit une demande qui l'intéresse mais a besoin de clarifier un détail (pharmacie préférée, disponibilité du patient, nature exacte des médicaments) avant de s'engager. Il peut ouvrir une conversation directement depuis la carte ou la vue détail, sans déclencher de proposition formelle.

**Why this priority**: C'est le cœur de la valeur — réduire les propositions inadaptées et augmenter le taux de matching réussi. Permet aussi au patient de recevoir des messages d'aidants intéressés même avant toute proposition formelle.

**Independent Test**: Un aidant connecté peut envoyer un message à un patient depuis la vue détail d'une demande en état `nouvelle_demande`, sans apparaître dans les propositions reçues par le patient.

**Acceptance Scenarios**:

1. **Given** un aidant consulte une demande en état `nouvelle_demande`, **When** il clique sur "Poser une question", **Then** la vue chat s'ouvre, liée à cette demande, et son premier message est envoyé sans créer de proposition.
2. **Given** un aidant a déjà un pré-chat ouvert avec un patient, **When** il fait ensuite une proposition formelle sur la même demande, **Then** le fil de conversation existant continue (aucun doublon de thread).
3. **Given** un patient reçoit un pré-chat d'un aidant, **When** il ouvre la vue chat, **Then** il voit le message avec l'identité de l'aidant et peut répondre normalement.
4. **Given** un aidant ouvre un pré-chat pour la première fois, **When** le chat s'ouvre vide, **Then** des suggestions de messages contextuels sont affichées.

---

### User Story 2 — Charte des aidants : engagement one-time avant toute action (Priority: P2)

Avant qu'un aidant puisse envoyer son premier message (pré-chat) ou faire sa première proposition sur n'importe quelle demande, un modal lui présente la "Charte TransMed des aidants". Il doit l'accepter explicitement. Cette acceptation est mémorisée et le modal ne réapparaît plus.

**Why this priority**: Filtre les aidants peu sérieux et responsabilise chaque participant. Critique pour la confiance dans une app médicale.

**Independent Test**: Un aidant qui n'a jamais accepté la charte voit le modal au premier clic sur "Poser une question" ou "Se proposer". Un aidant ayant déjà accepté ne voit plus ce modal.

**Acceptance Scenarios**:

1. **Given** un aidant n'a pas encore accepté la charte, **When** il clique sur "Poser une question" ou "Se proposer", **Then** un modal affiche la Charte TransMed avec un bouton "J'accepte et je continue".
2. **Given** le modal charte est affiché, **When** l'aidant clique "J'accepte", **Then** la date d'acceptation est enregistrée et l'action initiale se poursuit normalement.
3. **Given** le modal charte est affiché, **When** l'aidant ferme ou annule, **Then** aucune action n'est déclenchée et la charte n'est pas marquée comme acceptée.
4. **Given** un aidant a déjà accepté la charte, **When** il clique sur "Poser une question" ou "Se proposer", **Then** aucun modal intermédiaire — l'action se lance directement.

---

### User Story 3 — Badge non-lus persistent dans la tab bar (Priority: P2)

Le badge de messages non-lus est visible depuis toutes les pages de l'application via un onglet Messages dédié dans la tab bar. Sa couleur varie selon l'urgence des demandes concernées.

**Why this priority**: L'absence de tab Messages dédiée et de badge non-lus est une lacune de navigation critique — les utilisateurs manquent des messages importants.

**Independent Test**: Depuis le compte aidant, recevoir un nouveau message d'un patient. Naviguer sur un autre onglet → le badge rouge (si demande URGENT) doit rester visible sur l'onglet Messages.

**Acceptance Scenarios**:

1. **Given** il n'y a aucun message non-lu, **When** l'utilisateur est sur n'importe quelle page, **Then** aucun badge n'est affiché sur l'onglet Messages.
2. **Given** un nouveau message arrive pour une demande NON urgente, **When** l'utilisateur le reçoit, **Then** un badge orange apparaît avec le nombre de messages non-lus.
3. **Given** un nouveau message arrive pour une demande URGENTE, **When** l'utilisateur le reçoit, **Then** le badge est rouge, priorité visuelle maximale.
4. **Given** l'utilisateur ouvre le chat et lit les messages, **When** il les consulte, **Then** le badge se décrémente ou disparaît en temps réel.

---

### User Story 4 — Badge "N aidants intéressés" sur les demandes du patient (Priority: P3)

Sur la liste de ses demandes, le patient voit en temps réel le nombre d'aidants qui ont soit fait une proposition, soit ouvert un pré-chat. Ce compteur crée de la dynamique et rassure le patient que sa demande est active.

**Why this priority**: Améliore l'expérience patient et réduit l'anxiété du "ma demande est-elle visible ?". Faible effort d'implémentation.

**Independent Test**: Depuis le compte patient, créer une demande, puis depuis le compte aidant envoyer un pré-chat → le badge "1 aidant intéressé" doit apparaître sur la DemandeCard du patient.

**Acceptance Scenarios**:

1. **Given** une demande a 0 propositions et 0 pré-chats, **When** le patient consulte sa liste, **Then** aucun badge "aidants intéressés" n'est affiché.
2. **Given** une demande a 2 propositions et 1 pré-chat de 3 aidants distincts, **When** le patient consulte sa liste, **Then** le badge affiche "3 aidants intéressés".
3. **Given** un aidant a à la fois une proposition ET un pré-chat sur la même demande, **When** le badge est calculé, **Then** cet aidant est compté une seule fois (déduplication).
4. **Given** un nouvel aidant envoie un pré-chat, **When** le compteur change, **Then** il se met à jour sans rechargement manuel (≤ 5 secondes).

---

### User Story 5 — Indicateur de dernière connexion (Priority: P3)

Dans la vue détail d'une demande (côté aidant) et dans la vue chat, l'aidant voit quand le patient s'est connecté pour la dernière fois.

**Why this priority**: Réduit les frustrations des aidants qui proposent sur des demandes de patients inactifs.

**Independent Test**: Se connecter en tant que patient, puis consulter la demande depuis un compte aidant → "En ligne" ou "Vu il y a X" doit être affiché correctement.

**Acceptance Scenarios**:

1. **Given** un patient s'est connecté il y a moins de 30 minutes, **When** l'aidant consulte la demande, **Then** l'indicateur affiche "En ligne" avec un indicateur vert.
2. **Given** un patient s'est connecté il y a 2 heures, **When** l'aidant consulte la demande, **Then** l'indicateur affiche "Vu il y a 2h".
3. **Given** un patient s'est connecté il y a 3 jours, **When** l'aidant consulte la demande, **Then** l'indicateur affiche "Inactif depuis 3 jours" avec une couleur d'avertissement.
4. **Given** le patient se connecte à l'app, **When** la session démarre, **Then** sa dernière connexion est enregistrée automatiquement.

---

### User Story 6 — Suggestions de messages rapides dans le chat (Priority: P4)

Lors de l'ouverture d'une nouvelle conversation (chat vide), l'interface affiche des bulles de suggestions contextuelles. Un clic sur une suggestion pré-remplit le champ de saisie.

**Why this priority**: Réduit la friction du "premier message" et guide les utilisateurs vers des échanges productifs.

**Independent Test**: Ouvrir un chat vide depuis le rôle aidant → 3 suggestions aidant apparaissent. En envoyer une → les suggestions disparaissent pour ce chat.

**Acceptance Scenarios**:

1. **Given** un aidant ouvre un chat qui n'a aucun message, **When** la vue s'affiche, **Then** 3 suggestions contextuelles pour aidants sont visibles ("Quels médicaments exactement ?", "Je suis disponible demain matin", "Quelle pharmacie préférez-vous ?").
2. **Given** un patient ouvre un chat qui n'a aucun message de sa part, **When** la vue s'affiche, **Then** 3 suggestions contextuelles pour patients sont visibles ("C'est urgent, merci", "Êtes-vous disponible ce soir ?", "Merci pour votre réactivité !").
3. **Given** les suggestions sont affichées, **When** l'utilisateur clique sur une suggestion, **Then** le texte se copie dans le champ de saisie.
4. **Given** un message a déjà été envoyé dans ce chat, **When** le chat est ouvert, **Then** aucune suggestion n'est affichée.

---

### User Story 7 — Badges de confiance sur le profil (Priority: P4)

Dans la vue profil et dans les mini-profils des propositions reçues, des badges indiquent la fiabilité d'un utilisateur : email vérifié, téléphone renseigné, nombre de demandes traitées.

**Why this priority**: Renforce la confiance dans la communauté, facteur clé pour l'adoption de l'app.

**Independent Test**: Compléter un numéro de téléphone dans le profil → le badge "Téléphone renseigné" apparaît sur ProfilView et dans la liste des propositions reçues.

**Acceptance Scenarios**:

1. **Given** un utilisateur a un email vérifié, **When** son profil est consulté, **Then** un badge "✅ Email vérifié" est visible.
2. **Given** un utilisateur a renseigné un numéro de téléphone, **When** son profil est consulté, **Then** un badge "✅ Téléphone renseigné" est visible.
3. **Given** un aidant a complété 5 demandes avec succès, **When** son profil est consulté, **Then** le compteur "5 livraisons réussies" est affiché.
4. **Given** le patient reçoit une proposition, **When** il consulte la liste des propositions, **Then** les badges de confiance de l'aidant sont visibles inline.

---

### Edge Cases

- Que se passe-t-il si un aidant tente d'ouvrir un pré-chat sur une demande dont il a déjà une proposition ? → Le chat existant s'ouvre directement, sans doublon.
- Que se passe-t-il si le patient supprime sa demande alors qu'un pré-chat est en cours ? → Le chat devient en lecture seule avec un bandeau "Demande clôturée".
- Que se passe-t-il si `last_seen_at` n'a jamais été enregistré (anciens comptes) ? → Afficher "Dernière connexion inconnue" sans date spécifique.
- Que se passe-t-il si l'aidant ferme le modal charte sans accepter puis revient ? → Le modal se réaffiche à la prochaine tentative d'action.
- Que se passe-t-il si un utilisateur de rôle "patient" tente d'accéder à "Poser une question" ? → Le bouton n'est pas rendu pour le rôle patient.
- Que se passe-t-il si le badge aidants intéressés dépasse 99 ? → Afficher "99+" pour ne pas déborder l'UI.

---

## Requirements *(mandatory)*

### Functional Requirements

**Pré-chat**
- **FR-001**: L'aidant DOIT pouvoir initier une conversation depuis `DetailDemandeView` sur toute demande en état `nouvelle_demande`, sans créer de proposition.
- **FR-002**: Le bouton "Poser une question" NE DOIT PAS être visible pour les utilisateurs de rôle patient sur leurs propres demandes.
- **FR-003**: Un pré-chat DOIT partager le même fil de conversation qu'une proposition ultérieure sur la même demande (pas de doublon de thread).

**Charte des aidants**
- **FR-004**: L'application DOIT afficher le modal Charte TransMed avant la première action d'un aidant (pré-chat ou proposition) si la charte n'a pas encore été acceptée.
- **FR-005**: La date d'acceptation de la charte DOIT être persistée dans le profil de l'aidant.
- **FR-006**: La charte DOIT mentionner : confidentialité médicale, respect des délais, obligation de signalement d'imprévu.
- **FR-007**: Le modal DOIT avoir deux actions distinctes : "J'accepte et je continue" et "Annuler".

**Badge non-lus tab bar**
- **FR-008**: La tab bar DOIT inclure un onglet "Messages" dédié avec icône.
- **FR-009**: L'onglet Messages DOIT afficher un badge numérique comptant les messages non-lus de l'utilisateur.
- **FR-010**: Le badge DOIT être rouge si au moins un message non-lu concerne une demande URGENTE, orange sinon.
- **FR-011**: Le badge DOIT se mettre à jour en temps réel.
- **FR-012**: La lecture des messages DOIT décrémenter ou supprimer le badge correspondant.

**Badge aidants intéressés**
- **FR-013**: La `DemandeCard` DOIT afficher un badge "N aidants intéressés" égal à l'union déduplicatée des aidants ayant une proposition OU un pré-chat actif sur cette demande.
- **FR-014**: Le badge N'EST PAS affiché si le nombre est 0.
- **FR-015**: Le badge DOIT se mettre à jour en temps réel (≤ 5 secondes).

**Dernière connexion**
- **FR-016**: L'application DOIT enregistrer la date de dernière connexion à chaque démarrage de session utilisateur.
- **FR-017**: `DetailDemandeView` (côté aidant) DOIT afficher l'indicateur de dernière connexion du patient propriétaire.
- **FR-018**: La vue chat DOIT afficher l'indicateur de dernière connexion de l'interlocuteur dans le header.
- **FR-019**: Seuils : < 30 min → "En ligne" (vert), < 24h → "Vu il y a Xh" (neutre), ≥ 24h → "Inactif depuis X jours" (orange).

**Messages rapides**
- **FR-020**: La vue chat DOIT afficher des suggestions uniquement si aucun message n'a encore été envoyé dans cette conversation.
- **FR-021**: Les suggestions DOIVENT être différentes selon le rôle de l'utilisateur (aidant vs patient).
- **FR-022**: Un clic sur une suggestion DOIT pré-remplir le champ de saisie avec ce texte.
- **FR-023**: Les suggestions DOIVENT disparaître après l'envoi du premier message.

**Badges de confiance**
- **FR-024**: Le profil DOIT afficher "✅ Email vérifié" si l'email est confirmé.
- **FR-025**: Le profil DOIT afficher "✅ Téléphone renseigné" si le téléphone est renseigné dans le profil.
- **FR-026**: Le profil DOIT afficher le compteur de demandes traitées avec succès pour les aidants.
- **FR-027**: Les badges de confiance DOIVENT apparaître dans la liste des propositions reçues par le patient.

### Key Entities

- **Message** : entité existante — à étendre avec `is_read` (booléen, défaut false) pour le suivi des non-lus.
- **Profile** : entité existante — à étendre avec `last_seen_at` (date-heure), `charte_accepted_at` (date-heure nullable), `telephone` (texte nullable).
- **InteretAidant** : union logique (non persistée) entre propositions et messages pour calculer le badge "aidants intéressés" — dédupliqué par identifiant d'aidant.
- **MessageSuggestion** : liste statique de textes prédéfinis par rôle, définie côté client, non persistée.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un aidant peut initier un pré-chat en moins de 2 taps depuis la liste des demandes, sans remplir une proposition complète.
- **SC-002**: 100% des aidants voient le modal Charte TransMed avant leur première action — aucune proposition ni pré-chat ne peut être créé sans acceptation préalable.
- **SC-003**: Le badge "aidants intéressés" se met à jour en moins de 5 secondes après l'action d'un aidant.
- **SC-004**: L'indicateur de dernière connexion affiche une valeur cohérente (±2 minutes de précision).
- **SC-005**: Le badge non-lus de la tab bar est visible sur 100% des pages de l'application quand des messages non-lus existent.
- **SC-006**: Les badges de confiance sont affichés sur tous les profils ayant au moins un attribut vérifié.
- **SC-007**: Aucune régression sur le workflow existant des 8 états de demandes — tous les scénarios de la feature 008 restent fonctionnels après implémentation.
