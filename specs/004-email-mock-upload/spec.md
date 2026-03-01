# Feature Specification: Email Mock Patient + Fix Upload Ordonnance

**Feature Branch**: `004-email-mock-upload`
**Created**: 2026-03-01
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Notification email mock au patient (Priority: P1)

Quand un aidant complète une proposition qui porte la demande au statut `pret_acceptation_patient`, le système envoie automatiquement un email mock au patient (testpatient@yopmail.com). L'aidant voit une confirmation visuelle. L'email n'est envoyé qu'une seule fois par demande.

**Why this priority**: C'est la fonctionnalité la plus visible et la plus demandée. Sans elle, le patient ne sait pas que sa demande est prête.

**Independent Test**: Benjamin (aidant) ouvre demande-004 (fonds_atteints), clique "Proposer le transport" → la demande passe à `pret_acceptation_patient` → une notification verte apparaît "Un email a été envoyé à testpatient@yopmail.com" → la console affiche le contenu complet de l'email mock.

**Acceptance Scenarios**:

1. **Given** une demande en `fonds_atteints` sans transporteur, **When** un aidant clique "Proposer le transport" (Prop2), **Then** la demande passe à `pret_acceptation_patient` ET une notification "Email envoyé à testpatient@yopmail.com" apparaît dans l'UI de l'aidant
2. **Given** une demande en `attente_fonds_et_transporteur`, **When** un aidant choisit "Acheter et transporter" (Prop3), **Then** la demande passe directement à `pret_acceptation_patient` ET l'email mock est déclenché
3. **Given** une demande dont `emailNotifEnvoyee = true`, **When** toute nouvelle action est effectuée, **Then** aucun second email n'est envoyé
4. **Given** la notification déclenchée, **When** l'aidant voit la notification, **Then** elle mentionne "testpatient@yopmail.com", le nom de la demande, et le message envoyé au patient

---

### User Story 2 — Fix upload ordonnance sur navigateur web (Priority: P1)

L'upload d'ordonnance ne fonctionne pas sur navigateur web car l'action sheet appelle `input.click()` hors contexte de geste utilisateur direct, ce qui est bloqué par les navigateurs modernes. Le composant doit être corrigé pour fonctionner sur web et sur natif.

**Why this priority**: Sans ordonnance uploadée, le patient ne peut pas créer de demande. C'est un blocage critique.

**Independent Test**: Ouvrir l'application dans Chrome, créer une nouvelle demande, cliquer sur la zone "Joindre une ordonnance" → un sélecteur de fichier s'ouvre → choisir un PDF mock → l'aperçu PDF apparaît → le bouton "Publier la demande" devient actif.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est sur un navigateur web (pas natif), **When** il clique "Joindre une ordonnance", **Then** le sélecteur de fichier système s'ouvre directement sans action sheet intermédiaire
2. **Given** l'utilisateur sélectionne un fichier PDF valide, **When** il confirme sa sélection, **Then** l'aperçu PDF apparaît dans le composant et la valeur est mise à jour
3. **Given** l'utilisateur est sur une app native (iOS/Android), **When** il clique "Joindre une ordonnance", **Then** l'action sheet propose Caméra / Galerie / Fichier comme avant
4. **Given** l'utilisateur sélectionne une image JPG/PNG, **When** il confirme, **Then** l'aperçu image s'affiche correctement

---

### User Story 3 — Fichiers PDF mock pour les tests (Priority: P2)

Créer 3 fichiers PDF valides et lisibles dans un navigateur, représentant des ordonnances pour les patients de test.

**Why this priority**: Nécessaire pour tester US2 concrètement avec du contenu réaliste.

**Independent Test**: Ouvrir `public/mocks/ordonnances/ordonnance-alice-doliprane.pdf` dans Chrome → le PDF s'affiche avec contenu lisible.

**Acceptance Scenarios**:

1. **Given** les 3 fichiers PDF existent dans `public/mocks/ordonnances/`, **When** on les ouvre dans un navigateur, **Then** ils s'affichent comme des PDFs valides avec contenu lisible
2. **Given** les fichiers PDF mock, **When** on les uploade via OrdonanceUploader corrigé, **Then** l'aperçu PDF apparaît sans erreur

---

### Edge Cases

- Si `demande.nom` est vide lors de l'envoi de l'email → utiliser l'identifiant de la demande comme fallback
- Si le navigateur bloque le sélecteur de fichier → afficher un message d'erreur explicatif
- Si un fichier > 10 Mo est sélectionné → afficher "Fichier trop volumineux (max 10 Mo)"
- L'email ne doit pas être envoyé si la demande n'atteint pas `pret_acceptation_patient`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-301**: Le système DOIT afficher une notification verte dans l'UI de l'aidant mentionnant testpatient@yopmail.com et le nom de la demande
- **FR-302**: L'email mock DOIT être loggé en console avec : sujet, destinataire, corps du message incluant le nom de la demande
- **FR-303**: Le corps de l'email DOIT être : "Votre demande [nom] est prête. Connectez-vous à TransMed pour confirmer la livraison ou chatter avec le transporteur."
- **FR-304**: L'email ne DOIT être envoyé qu'une seule fois par demande (guard sur `emailNotifEnvoyee`)
- **FR-305**: L'email DOIT être déclenché pour Prop2 ET Prop3 dès que la demande atteint `pret_acceptation_patient`
- **FR-306**: Sur navigateur web, le clic sur "Joindre une ordonnance" DOIT ouvrir directement le sélecteur de fichier système
- **FR-307**: Sur application native, le clic DOIT afficher l'action sheet (Caméra / Galerie / Fichier)
- **FR-308**: Les fichiers acceptés sont : JPEG, PNG, PDF (max 10 Mo)
- **FR-309**: Trois fichiers PDF mock valides DOIVENT être disponibles dans `public/mocks/ordonnances/`

### Key Entities

- **EmailNotifMock**: destinataire fixe (testpatient@yopmail.com), sujet, corps avec nom de demande
- **OrdonanceUpload**: fichier sélectionné (base64, mimeType) — résultat du sélecteur

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-301**: 100% des transitions vers `pret_acceptation_patient` déclenchent l'email mock (Prop2 sur fonds_atteints, Prop3 direct)
- **SC-302**: La notification email apparaît dans l'UI de l'aidant dans la seconde suivant la transition
- **SC-303**: L'upload d'ordonnance fonctionne sur Chrome, Firefox, Safari (desktop) sans blocage
- **SC-304**: L'aperçu du document s'affiche correctement après sélection (image ou icône PDF)
- **SC-305**: Les 3 PDFs mock sont valides et s'affichent dans un navigateur sans erreur

## Assumptions

- L'adresse email de test est fixe : testpatient@yopmail.com
- Sur navigateur web, la caméra n'est pas disponible — on ouvre directement le sélecteur de fichier
- Les PDFs mock sont minimalistes mais conformes PDF 1.4
- La détection de la plateforme (web vs natif) se fait via les APIs Capacitor disponibles
