# Feature Specification: TransMed v1.1 — Corrections UX et nouvelles fonctionnalités

**Feature Branch**: `002-ux-fixes`
**Created**: 2026-02-28
**Status**: Draft
**Input**: Corrections et nouvelles fonctionnalités TransMed v1.1

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Connexion email/mot de passe (Priority: P1)

Un utilisateur ouvre l'application et voit un formulaire de connexion avec champ email, champ mot de passe et bouton "Se connecter". En mode MVP les identifiants sont mockés. Un bouton "Créer un compte" permet d'accéder au formulaire d'inscription.

**Why this priority**: Point d'entrée de toute l'application. Le bloc "accès rapide" actuel (sélection directe d'un utilisateur mock) ne simule pas un vrai flux de connexion.

**Independent Test**: Ouvrir l'app, saisir `alice@transmed.fr` / `test1234`, cliquer "Se connecter" → accès à la liste des demandes d'Alice.

**Acceptance Scenarios**:

1. **Given** l'écran d'accueil, **When** l'utilisateur saisit email et mot de passe valides et clique "Se connecter", **Then** il est redirigé vers la liste des demandes avec son rôle correct.
2. **Given** l'écran d'accueil, **When** l'utilisateur saisit des identifiants incorrects, **Then** un message d'erreur explicite s'affiche et l'accès est refusé.
3. **Given** l'écran d'accueil, **When** l'utilisateur clique "Créer un compte", **Then** le formulaire d'inscription (prénom + rôle) s'affiche.
4. **Given** un utilisateur connecté qui clique "Se déconnecter", **When** la déconnexion est effectuée, **Then** il est renvoyé vers l'écran de connexion.

---

### User Story 2 — Navigation footer persistante (Priority: P1)

En tant qu'utilisateur connecté, une barre de navigation en bas de l'écran est toujours visible sur les écrans principaux (liste, À propos), permettant de passer d'une section à l'autre.

**Why this priority**: Sans footer, l'utilisateur ne peut pas naviguer entre les onglets principaux — fonctionnalité centrale de l'application.

**Independent Test**: Se connecter → vérifier la barre d'onglets en bas → cliquer sur chaque onglet → navigation correcte.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur la liste des demandes, **When** il regarde l'écran, **Then** la barre d'onglets est visible en bas.
2. **Given** l'utilisateur est sur "À propos", **When** il tape sur l'onglet "Demandes", **Then** il revient sur la liste.
3. **Given** l'utilisateur est dans un écran détail (hors tabs), **When** il navigue, **Then** le footer n'est pas visible (comportement normal des écrans de stack).

---

### User Story 3 — Bouton retour uniformisé en haut à gauche (Priority: P2)

Sur toutes les pages avec navigation de retour (détail demande, chat, création), le bouton retour est positionné en haut à gauche, avec un style visuel identique partout.

**Why this priority**: Incohérence UX — l'utilisateur ne sait pas où trouver le retour selon les pages.

**Independent Test**: Naviguer vers "Détail demande" → bouton retour en haut à gauche → cliquer → retour à la liste.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur n'importe quel écran avec retour, **When** il regarde l'en-tête, **Then** la flèche de retour est en haut à gauche.
2. **Given** plusieurs écrans avec retour, **When** l'utilisateur navigue, **Then** le style du bouton retour est identique sur tous.
3. **Given** l'utilisateur clique la flèche retour, **When** la navigation se déclenche, **Then** il revient à l'écran précédent.

---

### User Story 4 — Libellé "Propositions actives" pour aidants (Priority: P2)

Pour le rôle aidant, le titre de la liste est "Propositions actives" et non "Demandes actives".

**Why this priority**: Clarté sémantique — un aidant ne gère pas des "demandes", il fait des "propositions".

**Independent Test**: Se connecter en tant qu'aidant → le titre affiche "Propositions actives".

**Acceptance Scenarios**:

1. **Given** un aidant connecté, **When** il consulte la liste principale, **Then** le titre affiche "Propositions actives".
2. **Given** un patient connecté, **When** il consulte sa liste, **Then** le titre affiche "Mes demandes" (inchangé).

---

### User Story 5 — Validation cohérente du statut "Financé" (Priority: P2)

L'étape "Financé" dans la timeline n'est cochée verte que si le montant collecté est égal ou supérieur au montant cible. Un montant de 55 € sur 120 € n'affiche pas "Financé" comme étape complétée.

**Why this priority**: Bug fonctionnel grave — l'utilisateur prend des décisions basées sur un statut incorrect (screenshot confirmé : 55/120 € affiche "Financé" coché).

**Independent Test**: Ouvrir une demande avec cagnotte à 55/120 € → l'étape "Financé" dans la timeline est grisée.

**Acceptance Scenarios**:

1. **Given** une demande avec cagnotte à 55 € / 120 €, **When** l'utilisateur consulte la timeline, **Then** l'étape "Financé" est grisée (non atteinte).
2. **Given** une demande avec cagnotte à 120 € / 120 €, **When** l'utilisateur consulte la timeline, **Then** l'étape "Financé" est cochée verte.
3. **Given** une demande au statut `fonds_atteints`, **When** la cagnotte est à 100%, **Then** l'étape "Financé" est cochée verte.

---

### User Story 6 — Visualisation de l'ordonnance mockée (Priority: P2)

Le bouton "Voir ordonnance" visible pour les aidants autorisés affiche une ordonnance mockée (image ou PDF fictif) dans l'application.

**Why this priority**: Actuellement le bouton ne fait rien — fonctionnalité bloquée.

**Independent Test**: Aidant autorisé → détail d'une demande → cliquer "Voir ordonnance" → une image fictive s'affiche.

**Acceptance Scenarios**:

1. **Given** un aidant autorisé sur la page détail, **When** il clique "Voir ordonnance", **Then** une ordonnance fictive s'affiche.
2. **Given** un aidant non autorisé, **When** il consulte le détail, **Then** le bouton n'est pas visible.
3. **Given** l'ordonnance est affichée, **When** l'utilisateur veut fermer, **Then** il peut revenir à la vue précédente.

---

### User Story 7 — Upload d'ordonnance obligatoire à la création (Priority: P2)

Lors de la création d'une demande, le bouton de soumission reste désactivé tant qu'aucune ordonnance n'est jointe, avec un message explicite visible.

**Why this priority**: Exigence métier (FR-016) — une demande sans ordonnance ne peut pas être traitée.

**Independent Test**: Remplir médicaments et adresse sans ordonnance → le bouton "Publier" est désactivé.

**Acceptance Scenarios**:

1. **Given** le formulaire de création sans ordonnance, **When** l'utilisateur regarde le bouton soumettre, **Then** il est désactivé avec un message visible.
2. **Given** une ordonnance jointe, **When** l'utilisateur consulte le formulaire, **Then** le bouton de soumission devient actif.
3. **Given** l'ordonnance jointe est retirée, **When** l'utilisateur consulte, **Then** le bouton se désactive à nouveau.

---

### User Story 8 — Téléchargement de l'ordonnance (Priority: P3)

L'aidant ayant soumis une proposition (Prop1, Prop2 ou Prop3) et le transporteur assigné peuvent télécharger l'ordonnance depuis le détail d'une demande.

**Why this priority**: Nécessaire pour que les aidants évaluent les prix et que les transporteurs préparent la livraison.

**Independent Test**: Aidant avec Prop → ouvrir détail demande → cliquer "Télécharger ordonnance" → confirmation mock.

**Acceptance Scenarios**:

1. **Given** un aidant avec proposition active, **When** il clique "Télécharger ordonnance", **Then** une confirmation mock s'affiche (ou fichier téléchargé).
2. **Given** le transporteur assigné, **When** il consulte le détail, **Then** le bouton de téléchargement est disponible.
3. **Given** un aidant sans proposition, **When** il consulte le détail, **Then** aucun bouton de téléchargement n'est visible.

---

### User Story 9 — Notification email mockée au patient (Priority: P3)

Quand une demande est simultanément "Financée" ET "Transporteur disponible", le système déclenche automatiquement une notification email mockée au patient (log + toast UI) pour l'inviter à confirmer.

**Why this priority**: Ferme la boucle du cycle de vie — le patient doit savoir quand agir.

**Independent Test**: Demande avec cagnotte 100% + transporteur → toast "Email envoyé au patient" apparaît.

**Acceptance Scenarios**:

1. **Given** une demande avec cagnotte atteinte ET transporteur assigné, **When** la condition est remplie, **Then** un email mock est déclenché (log + toast).
2. **Given** une demande avec uniquement la cagnotte atteinte (sans transporteur), **When** la condition est vérifiée, **Then** aucune notification n'est envoyée.
3. **Given** la notification déclenchée, **When** l'utilisateur consulte l'interface, **Then** un toast "Email envoyé au patient" est visible.
4. **Given** la notification déjà envoyée pour une demande, **When** l'utilisateur consulte à nouveau, **Then** la notification n'est pas déclenchée une seconde fois.

---

### Edge Cases

- Que se passe-t-il si l'utilisateur saisit un email valide avec mot de passe vide ?
- Que se passe-t-il si la cagnotte atteint exactement le montant cible (0 € de différence) ?
- Que se passe-t-il si le transporteur est assigné avant que la cagnotte soit complète — la notification doit se déclencher dès que la cagnotte complète.
- Que se passe-t-il si l'ordonnance uploadée est de format non supporté ?
- Que se passe-t-il si un aidant navigue vers le détail d'une demande à laquelle il n'a pas proposé ?

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentification (remplace l'accès rapide)

- **FR-101**: Le système DOIT afficher un formulaire de connexion avec champ email et champ mot de passe en page d'accueil.
- **FR-102**: Le système DOIT authentifier l'utilisateur à partir d'une liste d'utilisateurs mockés (email + mot de passe fictifs + rôle + prénom).
- **FR-103**: Le système DOIT afficher un message d'erreur si les identifiants ne correspondent à aucun utilisateur mock.
- **FR-104**: Le système DOIT proposer un bouton "Créer un compte" depuis l'écran de connexion.
- **FR-105**: Le système DOIT rediriger l'utilisateur connecté vers la liste adaptée à son rôle.

#### Navigation

- **FR-106**: Le système DOIT afficher une barre d'onglets en bas de l'écran sur tous les écrans principaux (tabs).
- **FR-107**: Le bouton retour DOIT être positionné en haut à gauche sur toutes les pages avec navigation retour.
- **FR-108**: Le style visuel du bouton retour DOIT être identique sur toutes les pages.
- **FR-109**: Pour le rôle aidant, le titre de la liste principale DOIT être "Propositions actives".

#### Statuts et timeline

- **FR-110**: L'étape "Financé" dans la timeline DOIT être marquée comme atteinte uniquement si le montant collecté ≥ montant cible.
- **FR-111**: La progression affichée dans la timeline DOIT être cohérente avec l'état réel de la cagnotte.

#### Ordonnance

- **FR-112**: Le bouton de soumission d'une demande DOIT être désactivé si aucune ordonnance n'est jointe.
- **FR-113**: Le formulaire de création DOIT afficher un message indiquant que l'ordonnance est obligatoire.
- **FR-114**: Le bouton "Voir ordonnance" DOIT afficher une ordonnance mockée (image fictive) dans une vue dédiée pour les aidants autorisés.
- **FR-115**: Les aidants ayant soumis une Prop1, Prop2 ou Prop3 DOIVENT pouvoir télécharger l'ordonnance.
- **FR-116**: Le transporteur assigné DOIT avoir accès au téléchargement de l'ordonnance.
- **FR-117**: Les utilisateurs non autorisés NE DOIVENT PAS voir les boutons d'accès à l'ordonnance.

#### Notifications

- **FR-118**: Quand une demande passe à l'état "Financée" ET "Transporteur assigné" simultanément, le système DOIT déclencher une notification email mockée au patient.
- **FR-119**: La notification mockée DOIT être confirmée visuellement (toast) dans l'interface.
- **FR-120**: La notification NE DOIT être déclenchée qu'une seule fois par demande.

### Key Entities

- **Utilisateur mock authentifié** : email (fictif), mot de passe (fictif en clair pour le MVP), prénom, rôle (patient/aidant)
- **Ordonnance mock** : image/PDF fictif associé à une demande pour visualisation et téléchargement
- **Notification email mock** : événement déclenché une fois par demande quand les deux conditions (fonds + transporteur) sont réunies

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-101**: 100% des utilisateurs mock peuvent se connecter avec email + mot de passe en moins de 10 secondes.
- **SC-102**: Le bouton retour est en haut à gauche sur 100% des pages avec navigation retour.
- **SC-103**: 0 demande avec cagnotte < 100% affiche le statut "Financé" coché dans la timeline.
- **SC-104**: 100% des soumissions de demande sans ordonnance sont bloquées par la validation interface.
- **SC-105**: Les aidants autorisés accèdent à l'ordonnance (visualisation + téléchargement) en moins de 2 clics depuis le détail.
- **SC-106**: La notification email mock se déclenche automatiquement dans 100% des cas où les deux conditions sont réunies.
- **SC-107**: La barre de navigation footer est visible sur 100% des écrans principaux après connexion.

---

### User Story 10 — Page Profil utilisateur (Priority: P1)

En tant qu'utilisateur connecté, je dispose d'une page "Profil" accessible depuis l'onglet "Profil" du footer. Elle affiche mes informations (prénom, rôle, email) et propose un bouton "Se déconnecter" qui me ramène à l'écran de connexion. Le bouton logout ne doit plus se trouver dans la toolbar des Demandes.

**Why this priority**: L'absence de page profil force le logout dans une page métier (Demandes), ce qui est une mauvaise UX. C'est un écran standard de toute application mobile connectée.

**Independent Test**: Se connecter → onglet "Profil" visible → cliquer → page profil avec prénom + rôle + email → cliquer "Se déconnecter" → retour écran connexion.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté, **When** il appuie sur l'onglet "Profil" dans le footer, **Then** la page Profil s'affiche avec son prénom, son rôle et son email.
2. **Given** l'utilisateur est sur la page Profil, **When** il clique "Se déconnecter", **Then** il est redirigé vers l'écran de connexion et sa session est effacée.
3. **Given** l'utilisateur est sur la page Demandes, **When** il regarde la toolbar, **Then** aucun bouton logout n'est visible dans la toolbar.

---

### User Story 11 — Footer navigation 3 onglets (Priority: P1)

La barre de navigation du bas contient 3 onglets : Demandes, Profil, À propos. Chaque onglet possède une icône SVG custom conforme à la charte graphique TransMed (vert #1B8C5A actif, gris #7A6E65 inactif). L'onglet actif se distingue visuellement.

**Why this priority**: La navigation principale de l'application doit être complète et accueillir le nouvel onglet Profil.

**Independent Test**: Naviguer sur chaque onglet → 3 onglets visibles → icônes conformes à la charte → onglet actif en vert.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est connecté, **When** il consulte le footer, **Then** 3 onglets sont visibles : Demandes, Profil, À propos.
2. **Given** l'utilisateur est sur un onglet, **When** il regarde le footer, **Then** l'onglet actif est coloré en vert (#1B8C5A).
3. **Given** l'utilisateur appuie sur un onglet, **When** la navigation se déclenche, **Then** la page correspondante s'affiche.

---

### User Story 12 — Correction visibilité footer (Priority: P1)

Le footer est actuellement invisible malgré les styles définis. La cause est l'utilisation de `<template #bottom>` (slot Vue.js) au lieu de `slot="bottom"` (slot web component Ionic) dans TabsView. Corriger ce bug de slot pour que le footer s'affiche.

**Why this priority**: Bug bloquant — l'utilisateur ne peut pas naviguer entre les sections de l'application.

**Independent Test**: Se connecter → la barre d'onglets est immédiatement visible en bas de l'écran.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est connecté, **When** il consulte n'importe quel écran principal, **Then** la barre d'onglets est visible en bas.
2. **Given** l'utilisateur est dans un écran de détail (hors tabs), **When** il navigue, **Then** le footer n'est pas visible (comportement normal).

---

## Assumptions

- Les données mock d'authentification sont un tableau TypeScript statique (email, mot de passe en clair, rôle, prénom) — aucune vraie sécurité requise pour le MVP.
- L'ordonnance mockée est une image fixe (base64 encodée) ou un SVG médical fictif — pas d'upload réel nécessaire pour la visualisation.
- Le "téléchargement" en mode mock est simulé par l'ouverture de l'image ou un toast de confirmation.
- La notification email est entièrement mockée : log console + toast UI — aucun vrai envoi d'email.
- La barre de navigation footer a été accidentellement supprimée lors de la refonte UI — elle doit être restaurée.
- Le design system TransMed v2 (palette vert #1B8C5A, terracotta #C8521A, sable #F7F3ED) s'applique à tous les nouveaux écrans et composants.
- La validation ordonnance obligatoire existe déjà dans la logique métier (FR-016) mais le bouton de soumission n'est pas correctement conditionné — correction nécessaire.
