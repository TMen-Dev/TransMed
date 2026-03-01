# Feature Specification: TransMed v1.2 — Workflow complet de livraison

**Feature Branch**: `003-delivery-workflow`
**Created**: 2026-03-01
**Status**: Draft
**Input**: Extension du workflow de livraison TransMed — nom de demande, urgence, mock data étendu, 3 nouvelles étapes de livraison, redirection post-login

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Nom et urgence de la demande (Priority: P1)

En tant que patient créant une demande, je vois un champ "Nom de la demande" pré-rempli avec mon prénom et la ville de livraison (ex: "Alice — Alger"), que je peux modifier. Je peux aussi cocher "Demande urgente". Ce nom et le badge urgence s'affichent dans la liste et dans le détail.

**Why this priority**: Identifiant humain essentiel — sans nom, les aidants et le transporteur ne peuvent pas distinguer les demandes. L'urgence impacte la priorisation des traitements.

**Independent Test**: Créer une demande avec adresse "5 rue des Lilas, Alger, Algérie" → champ nom pré-rempli "Alice — Alger" → modifier → soumettre → nom modifié visible dans liste et détail. Cocher urgente → badge rouge "URGENT" visible.

**Acceptance Scenarios**:

1. **Given** le formulaire de création avec l'adresse "5 rue des Lilas, Alger, Algérie", **When** le patient ouvre le formulaire, **Then** le champ "Nom de la demande" est pré-rempli "Alice — Alger".
2. **Given** le champ nom pré-rempli, **When** le patient saisit un nom personnalisé, **Then** la demande créée affiche ce nom personnalisé dans la liste et le détail.
3. **Given** une demande créée avec "Demande urgente" cochée, **When** le patient consulte la liste ou le détail, **Then** un badge rouge "URGENT" est visible.
4. **Given** une demande non urgente, **When** le patient consulte la liste, **Then** aucun badge rouge n'est affiché.

---

### User Story 2 — Mock data couvrant tous les statuts (Priority: P1)

En tant que testeur, je peux vérifier chaque étape du workflow depuis les données mock sans avoir à simuler manuellement chaque transition. Il existe au moins une demande mock par statut.

**Why this priority**: Sans données mock complètes, les scénarios de test des nouvelles étapes sont impossibles à vérifier visuellement.

**Independent Test**: Se connecter en tant qu'Alice → liste des demandes → voir des demandes dans les 7 statuts du workflow.

**Acceptance Scenarios**:

1. **Given** les données mock, **When** Alice se connecte, **Then** elle voit des demandes couvrant : `attente_fonds_et_transporteur`, `fonds_atteints`, `transporteur_disponible`, `pret_acceptation_patient` (emailNotifEnvoyee=true), `livraison_confirmee`, `livree`, `traitee`.
2. **Given** les données mock, **When** Karim se connecte, **Then** il a au moins une demande `attente_fonds_et_transporteur` sans proposition.
3. **Given** les données mock, **When** Benjamin (aidant) se connecte, **Then** il voit des demandes actives auxquelles il peut contribuer.

---

### User Story 3 — Confirmation de livraison par le patient (Priority: P1)

En tant que patient ayant reçu un email de notification, quand je me connecte, je suis automatiquement redirigé vers ma demande en attente de confirmation. Un bouton "Confirmer la livraison" me permet de valider que je souhaite recevoir la livraison.

**Why this priority**: Étape critique — sans confirmation patient, le transporteur ne peut pas démarrer la livraison.

**Independent Test**: Se connecter en tant qu'Alice (demande `pret_acceptation_patient` + emailNotifEnvoyee=true) → redirection automatique vers la demande → bouton "Confirmer la livraison" visible → cliquer → statut passe à `livraison_confirmee`.

**Acceptance Scenarios**:

1. **Given** Alice a une demande `pret_acceptation_patient` avec `emailNotifEnvoyee = true`, **When** Alice se connecte, **Then** elle est redirigée automatiquement vers cette demande.
2. **Given** Alice est sur la page détail de sa demande `pret_acceptation_patient`, **When** elle regarde l'écran, **Then** le bouton "Confirmer la livraison" est visible.
3. **Given** Alice clique "Confirmer la livraison", **When** la confirmation est traitée, **Then** le statut passe à `livraison_confirmee` et le bouton disparaît.
4. **Given** Benjamin (aidant) consulte la même demande `pret_acceptation_patient`, **When** il regarde l'écran, **Then** le bouton "Confirmer la livraison" n'est pas visible.
5. **Given** Alice a une demande `pret_acceptation_patient` mais `emailNotifEnvoyee = false`, **When** Alice se connecte, **Then** elle est redirigée vers la liste normale.

---

### User Story 4 — Marquage "Ordonnance livrée" par le transporteur (Priority: P1)

En tant que transporteur assigné à une demande confirmée, je peux marquer la demande comme livrée depuis la page de détail. Ce bouton n'est visible que pour moi et uniquement si la demande est en statut `livraison_confirmee`.

**Why this priority**: Étape essentielle qui clôt la responsabilité logistique et déclenche la dernière étape du cycle de vie.

**Independent Test**: Leila (transporteur assignée) → demande `livraison_confirmee` → bouton "Ordonnance livrée" visible → cliquer → statut `livree`.

**Acceptance Scenarios**:

1. **Given** une demande `livraison_confirmee` et Leila est le transporteur assigné, **When** Leila consulte le détail, **Then** le bouton "Ordonnance livrée" est visible.
2. **Given** Leila clique "Ordonnance livrée", **When** l'action est confirmée, **Then** le statut passe à `livree`.
3. **Given** Alice (patiente) consulte la même demande `livraison_confirmee`, **When** elle regarde l'écran, **Then** le bouton "Ordonnance livrée" n'est pas visible.
4. **Given** Benjamin (aidant non transporteur) consulte la demande, **When** il regarde l'écran, **Then** le bouton n'est pas visible.

---

### User Story 5 — Réception des médicaments par le patient (Priority: P1)

En tant que patient ayant reçu sa livraison, je peux marquer ma demande comme "traitée" via le bouton "Médicaments récupérés". Une popup s'ouvre me permettant de laisser un message de remerciement optionnel. Après confirmation, la demande est clôturée.

**Why this priority**: Étape terminale du cycle de vie — confirme la bonne fin du service.

**Independent Test**: Alice (demande `livree`) → bouton "Médicaments récupérés" → popup → message optionnel → confirmer → statut `traitee` → message visible dans le détail.

**Acceptance Scenarios**:

1. **Given** Alice a une demande `livree`, **When** elle consulte le détail, **Then** le bouton "Médicaments récupérés" est visible.
2. **Given** Alice clique "Médicaments récupérés", **When** la popup s'ouvre, **Then** elle peut saisir un message de remerciement optionnel.
3. **Given** Alice valide la popup (avec ou sans message), **When** la confirmation est soumise, **Then** le statut passe à `traitee` et le message est enregistré si fourni.
4. **Given** Leila (transporteur) consulte une demande `livree`, **When** elle regarde l'écran, **Then** le bouton "Médicaments récupérés" n'est pas visible.
5. **Given** une demande `traitee` avec message de remerciement, **When** quiconque consulte le détail, **Then** le message est affiché.

---

### User Story 6 — Timeline 6 étapes (Priority: P2)

La timeline horizontale affiche les 6 étapes complètes : En attente → Financé → Transporteur → Confirmé → Livré → Traité. Chaque étape franchie est marquée en vert.

**Why this priority**: Cohérence visuelle — sans mise à jour, la timeline trompe l'utilisateur sur l'avancement réel.

**Independent Test**: Ouvrir une demande `livraison_confirmee` → 4 étapes cochées, 2 grisées.

**Acceptance Scenarios**:

1. **Given** une demande `livraison_confirmee`, **When** l'utilisateur consulte la timeline, **Then** 4 étapes sont cochées (En attente, Financé, Transporteur, Confirmé).
2. **Given** une demande `livree`, **When** l'utilisateur consulte la timeline, **Then** 5 étapes sont cochées (+ Livré).
3. **Given** une demande `traitee`, **When** l'utilisateur consulte la timeline, **Then** les 6 étapes sont cochées.

---

### Edge Cases

- Que se passe-t-il si Alice a plusieurs demandes `pret_acceptation_patient` avec `emailNotifEnvoyee = true` ? (Redirection vers la plus récente.)
- Que se passe-t-il si le transporteur clique "Ordonnance livrée" deux fois ? (Le bouton doit disparaître après la transition — bouton conditionné au statut.)
- Que se passe-t-il si Alice ferme la popup "Médicaments récupérés" sans confirmer ? (Rien ne change, demande reste `livree`.)
- Que se passe-t-il si le nom de la demande est vide à la soumission ? (Valeur par défaut "Médicaments — [ville]" appliquée.)
- Que se passe-t-il si la ville ne peut pas être extraite de l'adresse ? (Nom suggéré : "[Prénom] — Médicaments".)

---

## Requirements *(mandatory)*

### Functional Requirements

#### Nom et urgence

- **FR-201**: Le système DOIT afficher un champ "Nom de la demande" dans le formulaire de création.
- **FR-202**: Le système DOIT pré-remplir ce champ avec "[Prénom patient] — [Ville extraite de l'adresse de livraison]".
- **FR-203**: Le patient DOIT pouvoir modifier le nom suggéré avant soumission.
- **FR-204**: Le nom DOIT s'afficher dans la carte de la liste des demandes.
- **FR-205**: Le nom DOIT s'afficher dans le titre ou sous-titre de la page détail.
- **FR-206**: Le formulaire de création DOIT inclure un toggle "Demande urgente".
- **FR-207**: Les demandes urgentes DOIVENT afficher un badge visuel rouge "URGENT" dans la liste et le détail.
- **FR-208**: Le champ `urgente: boolean` DOIT être enregistré dans la demande.

#### Mock data

- **FR-209**: Les données mock DOIVENT contenir au moins une demande pour chacun des 7 statuts : `attente_fonds_et_transporteur`, `fonds_atteints`, `transporteur_disponible`, `pret_acceptation_patient`, `livraison_confirmee`, `livree`, `traitee`.
- **FR-210**: La demande mock `pret_acceptation_patient` d'Alice DOIT avoir `emailNotifEnvoyee = true`.

#### Machine d'états

- **FR-211**: Le système DOIT ajouter le statut `livraison_confirmee` entre `pret_acceptation_patient` et `livree`.
- **FR-212**: Le système DOIT ajouter le statut `livree` entre `livraison_confirmee` et `traitee`.
- **FR-213**: L'événement `patient_confirme_livraison` DOIT faire transitionner `pret_acceptation_patient` → `livraison_confirmee`.
- **FR-214**: L'événement `transporteur_livre` DOIT faire transitionner `livraison_confirmee` → `livree`.
- **FR-215**: L'événement `patient_recoit_medicaments` DOIT faire transitionner `livree` → `traitee`.

#### Confirmation patient (Étape A)

- **FR-216**: Après connexion, si le patient a une demande `pret_acceptation_patient` avec `emailNotifEnvoyee = true`, le système DOIT le rediriger vers cette demande.
- **FR-217**: En cas de plusieurs demandes éligibles, la redirection cible la plus récente.
- **FR-218**: Le bouton "Confirmer la livraison" DOIT être visible uniquement pour le patient propriétaire sur une demande `pret_acceptation_patient`.
- **FR-219**: Cliquer "Confirmer la livraison" DOIT déclencher la transition vers `livraison_confirmee`.

#### Livraison transporteur (Étape B)

- **FR-220**: Le bouton "Ordonnance livrée" DOIT être visible uniquement pour le transporteur assigné sur une demande `livraison_confirmee`.
- **FR-221**: Cliquer "Ordonnance livrée" DOIT déclencher la transition vers `livree`.

#### Réception patient (Étape C)

- **FR-222**: Le bouton "Médicaments récupérés" DOIT être visible uniquement pour le patient propriétaire sur une demande `livree`.
- **FR-223**: Cliquer "Médicaments récupérés" DOIT ouvrir une popup avec un champ de message optionnel.
- **FR-224**: Valider la popup DOIT déclencher la transition vers `traitee` et enregistrer le message si fourni.
- **FR-225**: Le message de remerciement DOIT s'afficher dans la page détail d'une demande `traitee`.

#### Timeline

- **FR-226**: La timeline DOIT afficher 6 étapes : En attente, Financé, Transporteur, Confirmé, Livré, Traité.
- **FR-227**: Les étapes franchies DOIVENT être marquées en vert selon le statut courant.

### Key Entities

- **Demande** : Champs ajoutés — `nom: string`, `urgente: boolean`, `messageRemerciement?: string`. Statuts étendus à 8 valeurs.
- **StatutDemande** : `livraison_confirmee` et `livree` insérés entre `pret_acceptation_patient` et `traitee`.
- **TypeEvenement** : 3 nouveaux événements — `patient_confirme_livraison`, `transporteur_livre`, `patient_recoit_medicaments`.
- **CreateDemandeDto** : Ajout de `nom: string` et `urgente: boolean`.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-201**: 100% des demandes affichent un nom lisible dans la liste et le détail.
- **SC-202**: Le champ nom est pré-rempli automatiquement dans 100% des créations de demande.
- **SC-203**: Les demandes urgentes sont visuellement distinguables en moins de 2 secondes de lecture.
- **SC-204**: Les données mock couvrent 100% des 7 statuts du workflow.
- **SC-205**: La redirection post-login fonctionne dans 100% des cas où la condition est remplie.
- **SC-206**: Le cycle complet (confirmation → livraison → réception) peut être exécuté en moins de 10 clics depuis l'interface.
- **SC-207**: Aucun bouton d'action de livraison n'est visible pour un utilisateur non autorisé.
- **SC-208**: La timeline affiche correctement 6 étapes pour 100% des statuts.
- **SC-209**: Le message de remerciement est affiché dans 100% des demandes `traitee` où il a été saisi.

---

## Assumptions

- Le nom de la demande est extrait de l'adresse de livraison : la ville est le 2ème segment de la virgule (ex: "5 rue des Lilas, Alger, Algérie" → "Alger"). Si l'extraction échoue, le nom suggéré est "[Prénom] — Médicaments".
- Les demandes urgentes ne bénéficient pas d'un tri prioritaire automatique en v1.2 (badge visuel uniquement).
- La redirection post-login se base sur les demandes chargées en mémoire mock — aucun appel réseau supplémentaire.
- Le message de remerciement est stocké en mémoire uniquement (pas de persistance entre sessions).
- La protection des boutons d'action est côté client uniquement (MVP mock sans vrai backend sécurisé).
- L'email mock existant (spec 002, US9) continue de fonctionner — les nouvelles étapes s'enchaînent après ce déclencheur.
- Le statut `en_cours_livraison` existant est REMPLACÉ par `livraison_confirmee` dans la machine d'états pour cohérence sémantique. Les mock data et composants existants utilisant `en_cours_livraison` sont migrés.
