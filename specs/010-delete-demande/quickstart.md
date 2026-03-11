# Quickstart: Suppression de demande (010)

## Migration SQL (à exécuter dans Supabase SQL Editor)

### 010_a — Policy DELETE pour patient

```sql
-- Permettre au patient de supprimer sa propre demande
CREATE POLICY "patient_delete_own_demande"
  ON demandes FOR DELETE
  TO authenticated
  USING (patient_id = auth.uid());
```

> **Note** : Si ON DELETE CASCADE n'existe pas encore sur messages/propositions/ordonnances,
> ajouter manuellement (normalement déjà présent depuis migration 005).

---

## Scénario de test manuel

### Scénario 1 — Suppression réussie (état annulable)

1. Connexion patient (`testpatient@yopmail.com` / `amina1234`)
2. Créer une demande en `nouvelle_demande`
3. Ouvrir le détail → bouton "Supprimer la demande" visible (rouge)
4. Cliquer → dialog de confirmation s'affiche
5. Cliquer "Supprimer" → toast succès → redirection vers la liste
6. Vérifier que la demande n'apparaît plus dans la liste
7. Vérifier dans Supabase : aucun message, proposition, ordonnance résiduelle

### Scénario 2 — Blocage sur état verrouillé

1. Connexion aidant (`testaidant@yopmail.com` / `ben1234`)
2. Se proposer sur une demande (état → `medicaments_achetes_attente_transporteur` ou plus avancé)
3. Connexion patient → ouvrir le détail de cette demande
4. Vérifier que le bouton "Supprimer" est absent

### Scénario 3 — Annulation de la confirmation

1. Ouvrir une demande en `nouvelle_demande`
2. Cliquer "Supprimer" → dialog s'affiche
3. Cliquer "Annuler" → dialog se ferme, demande intacte

### Scénario 4 — Swipe-to-delete depuis la liste (P3)

1. Depuis la liste, swiper à gauche sur une carte de demande annulable
2. Option "Supprimer" rouge apparaît
3. Taper → même dialog de confirmation → suppression

---

## Comptes de test

- Patient : `testpatient@yopmail.com` / `amina1234`
- Aidant : `testaidant@yopmail.com` / `ben1234`
