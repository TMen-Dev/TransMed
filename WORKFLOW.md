# Workflow TransMed - SpecKit + Git Manuel

## 📁 Structure du projet

### .specify/
Templates et scripts SpecKit :
- `.specify/templates/` : Templates de specs (spec-template.md, plan-template.md, tasks-template.md, etc.)
- `.specify/scripts/bash/` : Scripts d'automatisation (create-new-feature.sh, setup-plan.sh, etc.)
- `.specify/memory/constitution.md` : Constitution du projet

### .claude/
Configuration Claude Code :
- `.claude/settings.local.json` : Configuration locale
- `.claude/commands/` : Commandes personnalisées
- `.claude/speckit.config.json` : Configuration SpecKit (Git manuel)

### specs/
Spécifications des features (numérotées) :
- `specs/001-medication-relay/` : Feature medication relay
- `specs/002-future-feature/` : Futures features

Chaque spec contient :
- `spec.md` : Spécification complète
- `plan.md` : Plan d'implémentation
- `tasks.md` : Checklist des tâches
- `data-model.md` : Modèle de données
- `research.md` : Recherches et références
- `quickstart.md` : Guide de démarrage rapide
- `checklists/` : Checklists détaillées
- `contracts/` : Contrats d'API

## 🔧 Workflow Git manuel

**IMPORTANT** : SpecKit génère les specs dans `specs/00X-feature/` mais **NE CRÉE PAS** de branches Git.
Les développeurs gèrent Git manuellement.

### Nouvelle feature - Étapes :

```bash
# 1. SpecKit génère la spec (PAS de branche Git créée)
/speckit.specify "Ma nouvelle feature"
# → Crée specs/002-ma-feature/spec.md

# 2. Créer la branche Git MANUELLEMENT
git checkout master
git pull
git checkout -b feature/ma-feature

# 3. Committer la spec
git add specs/002-ma-feature/
git commit -m "docs: add spec for ma-feature"
git push -u origin feature/ma-feature

# 4. Planifier avec SpecKit
/speckit.plan
git add specs/002-ma-feature/plan.md
git commit -m "docs: add implementation plan"
git push

# 5. Créer les tâches
/speckit.tasks
git add specs/002-ma-feature/tasks.md
git commit -m "docs: add task checklist"
git push

# 6. Développer (répéter pour chaque task)
/speckit.implement Task 1
git add src/ specs/002-ma-feature/tasks.md
git commit -m "feat: implement Task 1"
git push

# 7. Analyser la conformité
/speckit.analyze

# 8. Mettre à jour la spec si nécessaire
/speckit.specify
git add specs/002-ma-feature/spec.md
git commit -m "docs: update spec after implementation"
git push

# 9. Créer PR → Review → Merge → Clean
```

## 📝 Commandes SpecKit disponibles

| Commande | Usage |
|----------|-------|
| `/speckit.clarify` | Clarifier un besoin flou |
| `/speckit.specify` | Créer/MAJ une spécification |
| `/speckit.plan` | Planifier l'implémentation |
| `/speckit.tasks` | Créer la checklist des tâches |
| `/speckit.implement` | Aide à l'implémentation |
| `/speckit.analyze` | Vérifier la conformité spec/code |
| `/speckit.taskstoissues` | Exporter vers Azure DevOps |

## 🔨 Scripts disponibles

Dans `.specify/scripts/bash/` :
- `create-new-feature.sh` : Créer une nouvelle feature avec templates
- `setup-plan.sh` : Setup du plan d'implémentation
- `update-agent-context.sh` : Mettre à jour le contexte agent
- `check-prerequisites.sh` : Vérifier les prérequis
- `common.sh` : Fonctions bash communes

## ⚠️ Règles importantes

1. **SpecKit NE crée PAS de branches Git** (désactivé dans config)
2. **Vous créez les branches manuellement** : `feature/`, `bugfix/`, `hotfix/`
3. **Les specs (`specs/`) sont versionnées avec le code**
4. **Chaque PR doit avoir les specs à jour**
5. **Une spec = une feature = une branche Git**

## 🎯 Template de PR

Chaque Pull Request doit inclure :

- [ ] Spec créée/mise à jour dans `specs/00X-feature/spec.md`
- [ ] Plan d'implémentation dans `plan.md`
- [ ] Tasks complétées (cochées dans `tasks.md`)
- [ ] Analyse de conformité réussie (`/speckit.analyze`)
- [ ] Tests unitaires
- [ ] Tests e2e (si applicable)
- [ ] Documentation à jour

## 🔄 Branches Git

- `master` : Branche principale (code stable)
- `feature/*` : Nouvelles features
- `bugfix/*` : Corrections de bugs
- `hotfix/*` : Corrections urgentes
