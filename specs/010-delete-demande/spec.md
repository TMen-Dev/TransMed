# Feature Specification: Suppression de demande par le patient

**Feature Branch**: `010-delete-demande`
**Created**: 2026-03-10
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Supprimer une demande depuis le détail (Priority: P1)

Un patient consulte le détail d'une de ses demandes et réalise qu'il n'en a plus besoin (annulation, erreur de saisie, problème résolu). Il souhaite la supprimer définitivement pour libérer la liste et éviter que des aidants continuent de la consulter.

**Why this priority**: Flux principal — la suppression depuis le détail est l'action la plus naturelle après avoir relu sa demande.

**Independent Test**: Créer une demande en état `nouvelle_demande`, l'ouvrir dans le détail, cliquer "Supprimer", confirmer → la demande disparaît de la liste et le patient est redirigé.

**Acceptance Scenarios**:

1. **Given** le patient est sur le détail d'une demande dont il est propriétaire en état annulable, **When** il clique "Supprimer la demande", **Then** une confirmation est affichée mentionnant que l'action est irréversible
2. **Given** la confirmation est affichée, **When** le patient confirme, **Then** la demande, ses messages et son ordonnance sont supprimés, et le patient est redirigé vers la liste
3. **Given** la confirmation est affichée, **When** le patient annule, **Then** rien n'est supprimé et il reste sur le détail
4. **Given** le patient confirme, **When** la suppression échoue (réseau), **Then** un message d'erreur est affiché et la demande reste intacte

---

### User Story 2 — Blocage de suppression sur demandes en cours (Priority: P2)

Une demande en cours de traitement (aidant engagé, livraison en route) ne peut pas être supprimée unilatéralement car cela impacterait un aidant qui s'est engagé. La suppression doit être conditionnée à l'état de la demande.

**Why this priority**: Protège les aidants contre une annulation en cours de mission. Règle de cohérence métier indispensable.

**Independent Test**: Tenter d'accéder au bouton "Supprimer" sur une demande en état `en_cours_livraison_transporteur` → le bouton est absent ou désactivé avec une explication visible.

**Acceptance Scenarios**:

1. **Given** la demande est dans un état annulable (`nouvelle_demande`, `medicaments_achetes_attente_transporteur`, `transporteur_disponible_attente_acheteur`), **When** le patient ouvre le détail, **Then** le bouton "Supprimer" est visible et actif
2. **Given** la demande est dans un état verrouillé (`transporteur_et_medicaments_prets`, `en_cours_livraison_transporteur`, `rdv_a_fixer`, `en_cours_livraison_patient`, `traitee`), **When** le patient ouvre le détail, **Then** le bouton "Supprimer" est absent ou désactivé avec une explication

---

### User Story 3 — Suppression depuis la liste (Priority: P3)

Un patient veut supprimer une demande directement depuis la liste sans avoir à ouvrir le détail (gain de temps).

**Why this priority**: Confort supplémentaire, non bloquant. US1 + US2 suffisent en MVP.

**Independent Test**: Depuis la liste, effectuer un swipe-left sur une carte de demande annulable → bouton "Supprimer" rouge → confirmation → la carte disparaît.

**Acceptance Scenarios**:

1. **Given** le patient est sur la liste de ses demandes, **When** il effectue un swipe-left sur une carte de demande annulable, **Then** un bouton "Supprimer" rouge apparaît
2. **Given** le bouton "Supprimer" est visible, **When** le patient tape dessus, **Then** une confirmation est demandée avant la suppression effective

---

### Edge Cases

- Si la suppression du fichier ordonnance échoue mais que la demande est déjà supprimée → suppression considérée réussie (fichier orphelin acceptable, log d'erreur)
- Si un aidant consulte la demande au moment où le patient la supprime → l'aidant voit "demande introuvable" ou est redirigé vers la liste
- Demande sans ordonnance → la suppression fonctionne normalement, pas d'erreur sur l'absence de fichier
- Un patient ne peut supprimer que ses propres demandes — vérification de propriété obligatoire

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Un patient DOIT pouvoir supprimer une demande dont il est propriétaire depuis la vue de détail
- **FR-002**: Avant toute suppression, le système DOIT afficher une confirmation explicite mentionnant que l'action est irréversible
- **FR-003**: La suppression DOIT effacer la demande, tous ses messages associés, et le fichier ordonnance dans le stockage
- **FR-004**: Le système DOIT rediriger le patient vers la liste après une suppression réussie
- **FR-005**: La suppression DOIT être bloquée (bouton absent ou désactivé) si la demande est dans un état avancé (`transporteur_et_medicaments_prets`, `en_cours_livraison_transporteur`, `rdv_a_fixer`, `en_cours_livraison_patient`, `traitee`)
- **FR-006**: Un patient ne DOIT pas pouvoir supprimer la demande d'un autre patient
- **FR-007**: En cas d'échec, le système DOIT afficher un message d'erreur et laisser la demande intacte
- **FR-008**: Un patient PEUT initier la suppression depuis la liste (swipe ou menu contextuel) — optionnel P3

### Key Entities

- **Demande** : entité principale supprimée (statut, médicaments, adresse, ordonnance_url, patient_id)
- **Messages** : tous les messages liés à la demande, supprimés en cascade
- **Ordonnance** : fichier stocké dans le système de fichiers de l'application, supprimé lors de la suppression de la demande
- **États annulables** : `nouvelle_demande`, `medicaments_achetes_attente_transporteur`, `transporteur_disponible_attente_acheteur`
- **États verrouillés** : `transporteur_et_medicaments_prets`, `en_cours_livraison_transporteur`, `rdv_a_fixer`, `en_cours_livraison_patient`, `traitee`

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Le patient peut supprimer une demande annulable en 2 actions maximum (bouton → confirmer)
- **SC-002**: 100% des données associées (messages, fichier ordonnance) sont supprimées lors d'une suppression réussie
- **SC-003**: Aucune demande en état verrouillé ne peut être supprimée — 0 faux positifs sur le contrôle d'état
- **SC-004**: En cas d'erreur réseau, la demande reste intacte dans 100% des cas (pas de suppression partielle visible)
- **SC-005**: Le patient est redirigé vers la liste en moins d'une seconde après confirmation de suppression

## Assumptions

- Les états `nouvelle_demande`, `medicaments_achetes_attente_transporteur` et `transporteur_disponible_attente_acheteur` sont les seuls états où la suppression est autorisée
- La suppression des messages est gérée en cascade ou explicitement en séquence
- Si le fichier ordonnance n'existe pas, la suppression de la demande réussit quand même
- Le patient est authentifié — aucun accès anonyme à la suppression
- La suppression depuis la liste (US3) est optionnelle — le MVP se concentre sur US1 + US2
