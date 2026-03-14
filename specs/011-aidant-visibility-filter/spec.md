# Feature Specification: Visibilité Aidant & Filtre Liste Demandes

**Feature Branch**: `011-aidant-visibility-filter`
**Created**: 2026-03-12
**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Contrôle des actions disponibles selon le statut (Priority: P1)

Un aidant qui consulte une demande ne voit que les options de proposition cohérentes avec le statut actuel. Si un rôle est déjà couvert (achat fait → seul le transport reste), le système masque les options inopportunes.

**Why this priority**: Empêche des propositions incohérentes (ex : proposer l'achat alors qu'il est déjà couvert), garantit la cohérence du workflow.

**Independent Test**: Connecté en tant qu'aidant non impliqué, ouvrir une demande en statut B → seule l'option "Transport" est proposée. Ouvrir une demande en statut C → seule l'option "Achat + envoi" est proposée.

**Acceptance Scenarios**:

1. **Given** une demande en statut B (médicaments achetés, attente transporteur), **When** un aidant non impliqué ouvre la demande, **Then** seule la proposition de transport est disponible.
2. **Given** une demande en statut C (transporteur dispo, attente acheteur), **When** un aidant non impliqué ouvre la demande, **Then** seule la proposition achat+envoi est disponible.
3. **Given** une demande en statut A (nouvelle), **When** un aidant non impliqué ouvre la demande, **Then** toutes les options de proposition sont disponibles.
4. **Given** une demande en statut H (traitée) où l'aidant est impliqué, **When** il ouvre la demande, **Then** aucune action n'est disponible, affichage en lecture seule.

---

### User Story 2 — Accès restreint aux demandes en cours de livraison (Priority: P1)

Les demandes dont le statut est "En transit" (E) ou "En livraison patient" (G) ne sont accessibles qu'aux personnes directement impliquées (acheteur, transporteur, patient). Les aidants non impliqués ne les voient pas.

**Why this priority**: Protège la vie privée et évite les interférences une fois le workflow engagé.

**Independent Test**: Connecté en tant qu'aidant non impliqué, vérifier que les demandes en statut E et G n'apparaissent pas dans la liste.

**Acceptance Scenarios**:

1. **Given** une demande en statut E, **When** un aidant non impliqué consulte la liste, **Then** cette demande n'apparaît pas.
2. **Given** une demande en statut G, **When** un aidant non impliqué consulte la liste, **Then** cette demande n'apparaît pas.
3. **Given** une demande en statut E ou G, **When** l'aidant assigné consulte la liste, **Then** la demande apparaît en lecture seule.

---

### User Story 3 — Visibilité complète des demandes où l'aidant est impliqué (Priority: P1)

Un aidant ayant contribué à une demande (proposition émise, rôle acheteur ou transporteur assigné) retrouve toujours cette demande dans sa liste, quel que soit son statut, y compris une fois traitée.

**Why this priority**: Permet à l'aidant de suivre ses engagements passés et de consulter l'historique.

**Independent Test**: Un aidant avec des demandes traitées les voit via le filtre "Traitées" ou "Mes engagements".

**Acceptance Scenarios**:

1. **Given** un aidant assigné comme transporteur sur une demande traitée, **When** il consulte sa liste, **Then** la demande est visible.
2. **Given** un aidant ayant émis une proposition sur une demande (quelle que soit l'issue), **When** il consulte sa liste, **Then** la demande reste visible dans ses engagements.

---

### User Story 4 — Filtre moderne sur la liste des demandes (Priority: P2)

Un aidant filtre rapidement la liste via des chips horizontales scrollables. Le filtre actif est visuellement distinct. Les catégories reflètent le cycle de vie des demandes.

**Why this priority**: Améliore l'ergonomie quand la liste grossit. Réduit le bruit visuel.

**Independent Test**: Tester chaque filtre indépendamment et vérifier que seules les demandes correspondantes sont affichées.

**Acceptance Scenarios**:

1. **Given** un aidant sur la liste, **When** il sélectionne "Nouvelles", **Then** seules les demandes en statut A sont affichées.
2. **Given** un aidant sur la liste, **When** il sélectionne "En cours", **Then** les demandes en statuts B–G accessibles sont affichées.
3. **Given** un aidant sur la liste, **When** il sélectionne "Mes engagements", **Then** seules les demandes où il est acheteur ou transporteur assigné (statuts non traitée) sont affichées.
4. **Given** un aidant sur la liste, **When** il sélectionne "Traitées", **Then** seules les demandes en statut H où il est impliqué sont affichées.
5. **Given** un aidant sur la liste, **When** il sélectionne "Toutes" (défaut), **Then** toutes les demandes visibles selon les règles de visibilité sont affichées.
6. **Given** un filtre actif, **When** l'aidant effectue un pull-to-refresh, **Then** la liste se met à jour en conservant le filtre sélectionné.

---

### Edge Cases

- Un aidant a émis une proposition sur une demande qui passe en statut E ou G → la demande reste visible car il est impliqué (proposition existante).
- Le filtre "Mes engagements" ne contient aucune demande → afficher un état vide avec message explicatif.
- Un aidant est à la fois acheteur ET transporteur (singleAidant) sur une demande en statut E ou G → visible, lecture seule, infos de livraison complètes.
- Un aidant non impliqué tente d'accéder directement (URL) à une demande en statut E ou G → accès refusé ou redirection.

---

## Requirements *(mandatory)*

### Functional Requirements

**Visibilité — Liste des demandes**

- **FR-001**: La liste des demandes côté aidant MUST NOT afficher les demandes en statuts E et G pour les aidants non impliqués.
- **FR-002**: Un aidant impliqué (acheteur_id, transporteur_id, ou proposition existante) MUST voir toutes ses demandes quel que soit le statut, y compris H.
- **FR-003**: Les demandes en statut H MUST être accessibles en lecture seule pour les aidants impliqués.

**Actions disponibles selon le statut**

- **FR-004**: Pour une demande en statut B, MUST afficher uniquement l'option `prop_transport` aux aidants non impliqués.
- **FR-005**: Pour une demande en statut C, MUST afficher uniquement l'option `prop_achat_envoi` aux aidants non impliqués.
- **FR-006**: Pour les demandes en statuts E, F, G, H, MUST masquer le panneau de proposition pour les aidants impliqués (lecture seule).

**Filtre liste demandes**

- **FR-007**: La liste côté aidant MUST afficher un sélecteur de filtre horizontal scrollable : Toutes, Nouvelles, En cours, Mes engagements, Traitées.
- **FR-008**: Le filtre "Toutes" (actif par défaut) MUST afficher toutes les demandes visibles selon FR-001 et FR-002.
- **FR-009**: Le filtre "Nouvelles" MUST afficher uniquement les demandes en statut A.
- **FR-010**: Le filtre "En cours" MUST afficher les demandes en statuts B, C, D accessibles + E, F, G où l'aidant est impliqué.
- **FR-011**: Le filtre "Mes engagements" MUST afficher les demandes (statuts non H) où l'aidant est acheteur ou transporteur assigné.
- **FR-012**: Le filtre "Traitées" MUST afficher les demandes en statut H où l'aidant est impliqué.
- **FR-013**: Le filtre sélectionné MUST être conservé lors d'un pull-to-refresh.
- **FR-014**: Le filtre actif MUST être visuellement distingué (indicateur couleur primaire, style pill/chip).

### Key Entities

- **Demande**: Statut (A–H), acheteur_id, transporteur_id, propositions[]. Visibilité et actions dépendent du statut et de l'implication de l'aidant.
- **Proposition**: Lien aidant ↔ demande. Rend l'aidant "impliqué" même sans être acheteur/transporteur assigné.
- **Filtre actif**: État local UI (non persisté) représentant la catégorie sélectionnée.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Aucune demande en statut E ou G n'est visible par un aidant non impliqué — 0 demande incorrectement visible dans 100% des cas de test.
- **SC-002**: Les options de proposition affichées correspondent toujours au statut — 0 option incohérente dans 100% des cas de test.
- **SC-003**: Le filtre "Mes engagements" est accessible en 1 tap depuis la liste des demandes — un aidant trouve ses engagements passés (y compris traitées) sans navigation supplémentaire.
- **SC-004**: Le changement de filtre est perçu comme instantané (rendu visible sans délai réseau).
- **SC-005**: Le filtre réduit le nombre de demandes à parcourir d'au moins 50% par rapport à la liste complète dans un scénario réel avec 10+ demandes.
