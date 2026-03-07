# Feature Specification: Correction du blocage écran après Camera/Gallery Activity Switch

**Feature Branch**: `007-camera-bugfix`
**Created**: 2026-03-07
**Status**: Implémenté ✅

## Contexte et problème

Sur les appareils Huawei EMUI (et certains Android), après qu'un utilisateur sélectionne une photo d'ordonnance via la caméra ou la galerie, cliquer sur "Publier la demande" laissait l'écran figé indéfiniment. L'application ne répondait plus et aucun message d'erreur n'apparaissait.

### Cause racine diagnostiquée (adb logcat, 2026-03-07)

Le mécanisme `autoRefreshToken` de Supabase Auth déclenche un rafraîchissement JWT en arrière-plan au moment du retour depuis l'Activity Android (caméra/galerie). Ce refresh :

1. Acquiert `navigator.locks.request('supabase-...-auth-token')` — mutex interne de Supabase Auth (Web Locks API)
2. Lance un `fetch` vers `/auth/v1/token`
3. Sur Huawei EMUI, le radio WiFi s'endort après un switch d'Activity → le `fetch` pend indéfiniment
4. Le verrou Web Locks n'est jamais relâché → `initializePromise` reste en état `pending`
5. Tout appel à `getSession()` attend `initializePromise` → deadlock permanent, écran figé

---

## User Scenarios & Testing

### User Story 1 — Publication de demande après sélection photo (Priority: P1)

Un patient remplit le formulaire de demande, sélectionne une photo d'ordonnance depuis sa galerie ou sa caméra, puis publie la demande. L'opération doit se terminer avec succès en quelques secondes.

**Why this priority**: C'est le flux principal de l'application. Sans cette correction, aucun patient sur Huawei EMUI ne peut créer de demande avec ordonnance.

**Independent Test**: Peut être testé de bout en bout sur un appareil Huawei EMUI en sélectionnant une photo puis en soumettant le formulaire — la demande doit apparaître dans Supabase.

**Acceptance Scenarios**:

1. **Given** l'utilisateur est connecté et a rempli le formulaire de demande, **When** il sélectionne une photo via la galerie puis clique "Publier la demande", **Then** la demande est créée en base et l'ordonnance est visible dans Supabase Storage en moins de 10 secondes.
2. **Given** l'utilisateur est connecté et a rempli le formulaire, **When** il prend une photo via la caméra puis clique "Publier la demande", **Then** la demande est créée avec succès et le formulaire se ferme.
3. **Given** l'utilisateur clique "Publier la demande" après sélection photo, **When** la connexion réseau est temporairement lente au retour de la caméra, **Then** l'application affiche "Connexion lente, nouvelle tentative…" et réessaie automatiquement une fois.
4. **Given** l'utilisateur clique "Publier la demande" après sélection photo, **When** deux tentatives réseau échouent (réseau vraiment indisponible), **Then** un message d'erreur clair s'affiche et le bouton redevient actif pour une nouvelle tentative manuelle.

---

### User Story 2 — Stabilité après Activity switch répété (Priority: P2)

L'application reste stable et fonctionnelle après tout retour d'une Activity Android externe (caméra, galerie, sélecteur de fichier), sans corruption de l'état interne du client réseau.

**Why this priority**: Garantit la fiabilité à long terme au-delà du seul cas de création de demande.

**Independent Test**: Ouvrir la galerie, sélectionner un fichier, revenir à l'app, effectuer n'importe quelle opération réseau — elle doit réussir sans délai anormal.

**Acceptance Scenarios**:

1. **Given** l'utilisateur a ouvert et fermé la galerie plusieurs fois, **When** il effectue une opération réseau (lecture de demandes, connexion), **Then** l'opération aboutit sans délai anormal.
2. **Given** le token JWT est proche de l'expiration au moment du switch Activity, **When** l'utilisateur publie une demande, **Then** le token est utilisé ou rafraîchi correctement sans blocage.

---

### Edge Cases

- Que se passe-t-il si l'utilisateur ouvre la caméra, attend plusieurs minutes, puis revient et publie ? → Le token est peut-être expiré mais le client frais le recharge depuis le stockage persistant.
- Que se passe-t-il si l'utilisateur annule la sélection photo ? → Le bouton "Publier" reste désactivé, aucune requête n'est envoyée.
- Que se passe-t-il si l'upload de l'ordonnance échoue (fichier trop volumineux, erreur de permissions) ? → Une erreur explicite est affichée, pas de silence silencieux.
- Que se passe-t-il si l'utilisateur perd complètement le réseau (mode avion) ? → Après 15s + 2s + 15s, un message "Connexion réseau insuffisante" s'affiche.

---

## Requirements

### Functional Requirements

- **FR-001**: L'application DOIT créer une demande complète (demande + médicaments + cagnotte + ordonnance) après sélection d'une photo sur Huawei EMUI sans bloquer l'interface utilisateur.
- **FR-002**: L'application DOIT afficher l'indicateur "Publication…" durant le traitement et le libérer à la fin (succès ou erreur), dans tous les cas.
- **FR-003**: L'application DOIT afficher un message d'erreur compréhensible si le réseau est indisponible après deux tentatives automatiques.
- **FR-004**: Le mécanisme de connexion réseau DOIT être immunisé contre tout état bloqué hérité d'une opération précédente interrompue par un switch Activity.
- **FR-005**: Toutes les requêtes réseau DOIVENT avoir un timeout maximal de 15 secondes pour éviter tout blocage indéfini.
- **FR-006**: Le système de verrouillage interne de l'authentification NE DOIT PAS pouvoir bloquer les opérations de l'utilisateur en cas de réseau indisponible.
- **FR-007**: L'upload de l'ordonnance DOIT lever une erreur explicite et visible en cas d'échec (fin du comportement silencieux antérieur).

### Key Entities

- **Session d'authentification** : token JWT stocké en persistance locale (survit aux redémarrages d'app et aux switches d'Activity), chargé au démarrage et à chaque opération.
- **Client réseau principal** : instance partagée dans toute l'app, avec rafraîchissement automatique du token. Peut entrer dans un état bloqué après un switch Activity.
- **Client réseau de création** : instance éphémère créée pour chaque opération de publication, état vierge, sans rafraîchissement automatique concurrent. Utilisé exclusivement pour la création de demande.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: La création d'une demande avec ordonnance photo se termine en moins de 10 secondes sur WiFi normal, sans blocage écran, sur Huawei EMUI. ✅ *Validé le 2026-03-07 (3.4s mesurées en logcat)*
- **SC-002**: 100% des tentatives de publication après sélection photo aboutissent à un succès ou à un message d'erreur explicite — zéro écran figé indéfini. ✅ *Validé le 2026-03-07*
- **SC-003**: En cas de réseau lent, l'utilisateur voit un feedback visuel dans les 15 premières secondes.
- **SC-004**: Les 6 étapes de création (INSERT demande, médicaments, cagnotte, upload ordonnance, INSERT ordonnance record, SELECT final) s'exécutent toutes avec succès lors d'un test sur appareil physique Huawei EMUI. ✅ *Validé le 2026-03-07 via adb logcat*
- **SC-005**: Aucune régression sur les autres flux (lecture de demandes, connexion, navigation) consécutive à ce correctif.

---

## Assumptions

- Le problème est spécifique à Huawei EMUI et aux Android qui endorment le radio WiFi lors d'un switch Activity. Sur iOS et d'autres Android, le comportement peut différer mais le correctif est inoffensif.
- Le stockage de session local (Android SharedPreferences) persiste correctement entre les Activity switches — confirmé par les logs.
- Désactiver le rafraîchissement automatique du token sur le client éphémère est safe car la création de demande dure moins de 15 secondes — le token JWT n'expire pas pendant cette fenêtre.
