# Quickstart — Test du Workflow Complet v1.2

## Prérequis

```bash
npm install && npm run dev
# → http://localhost:5173
```

## Scénario 1 — Nom et urgence (Patient Alice)

1. Se connecter : `alice@transmed.fr` / `test1234`
2. Cliquer le FAB "+" → Nouvelle demande
3. Vérifier que le champ "Nom de la demande" est pré-rempli "Alice — Alger"
4. Modifier le nom → "Insuline urgente"
5. Cocher le toggle "Demande urgente"
6. Ajouter un médicament + adresse + ordonnance → Publier
7. ✅ La demande apparaît dans la liste avec "Insuline urgente" + badge rouge "URGENT"

## Scénario 2 — Redirection post-login (Patient Alice)

1. La demande `demande-005` est en statut `pret_acceptation_patient` avec `emailNotifEnvoyee=true` dans les mock data
2. Se déconnecter (page Profil → "Se déconnecter")
3. Se reconnecter : `alice@transmed.fr` / `test1234`
4. ✅ Redirection automatique vers `/app/demandes/demande-005` (pas la liste)
5. ✅ Bouton "Confirmer la livraison" visible en vert

## Scénario 3 — Étape A : Confirmation patient

1. Depuis `demande-005` (statut `pret_acceptation_patient`) connecté en Alice
2. Cliquer "Confirmer la livraison"
3. ✅ Statut passe à `livraison_confirmee`
4. ✅ Timeline : 4 étapes cochées (En attente, Financé, Transporteur, Confirmé)
5. ✅ Le bouton "Confirmer la livraison" disparaît

## Scénario 4 — Étape B : Livraison transporteur

1. Se déconnecter → Se connecter : `benjamin@transmed.fr` / `test1234`
2. Naviguer vers `demande-006` (statut `livraison_confirmee`)
3. ✅ Bouton "Ordonnance livrée" visible (Benjamin est le transporteur)
4. Cliquer "Ordonnance livrée"
5. ✅ Statut passe à `livree`
6. ✅ Timeline : 5 étapes cochées

## Scénario 5 — Étape C : Réception patient

1. Se connecter : `alice@transmed.fr` / `test1234`
2. Naviguer vers `demande-007` (statut `livree`)
3. ✅ Bouton "Médicaments récupérés" visible (Alice est propriétaire)
4. Cliquer "Médicaments récupérés"
5. ✅ Popup s'ouvre avec champ message optionnel
6. Saisir "Merci beaucoup à toute l'équipe !" → Confirmer
7. ✅ Statut passe à `traitee`
8. ✅ Message de remerciement visible dans le détail
9. ✅ Timeline : 6 étapes cochées (toutes vertes)

## Scénario 6 — Vérification des gardes d'accès

1. Connecté en Alice → demande `livraison_confirmee` → ✅ PAS de bouton "Ordonnance livrée"
2. Connecté en Benjamin → demande `livree` d'Alice → ✅ PAS de bouton "Médicaments récupérés"
3. Connecté en Leila → demande `pret_acceptation_patient` d'Alice → ✅ PAS de bouton "Confirmer la livraison"

## Données mock disponibles après implémentation

| ID | Statut | Patient | Transporteur |
|----|--------|---------|--------------|
| demande-001 | `transporteur_disponible` | Alice | Leila |
| demande-002 | `attente_fonds_et_transporteur` | Alice | — |
| demande-003 | `attente_fonds_et_transporteur` | Karim | — |
| demande-004 | `fonds_atteints` | Alice | — |
| demande-005 | `pret_acceptation_patient` | Alice | Benjamin (emailNotif=true) |
| demande-006 | `livraison_confirmee` | Alice | Benjamin |
| demande-007 | `livree` | Alice | Leila |
| demande-008 | `traitee` | Alice | Benjamin + message |
