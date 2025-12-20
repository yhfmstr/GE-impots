# GE-Impôts Expert - Plugin Claude Code

Plugin expert pour la déclaration d'impôts du Canton de Genève, Suisse.

## Structure du projet

```
GE-impots/
├── .claude/
│   ├── settings.local.json
│   └── plugins/
│       └── ge-impots-expert/
│           ├── plugin.json           # Configuration du plugin
│           ├── agents/               # 8 agents spécialisés
│           │   ├── tax-coordinator.md
│           │   ├── pdf-extractor.md
│           │   ├── revenus-expert.md
│           │   ├── deductions-expert.md
│           │   ├── fortune-expert.md
│           │   ├── immobilier-expert.md
│           │   ├── compliance-checker.md
│           │   └── optimizer.md
│           └── skills/               # 7 skills utilisateur
│               ├── analyser-situation.md
│               ├── optimiser-deductions.md
│               ├── extraire-documents.md
│               ├── verifier-conformite.md
│               ├── calculer-impots.md
│               ├── generer-rapport.md
│               └── questionnaire.md
├── 2024/
│   ├── guidepp-2024-180225.pdf      # Guide officiel
│   ├── knowledge/                    # Base de connaissances
│   │   ├── deductions-2024.md
│   │   ├── baremes-2024.md
│   │   ├── guide-structure.md
│   │   ├── frais-professionnels.md
│   │   ├── prevoyance.md
│   │   ├── immobilier.md
│   │   ├── fortune.md
│   │   └── cas-speciaux.md
│   └── user-data/                    # Vos documents (gitignored)
│       ├── certificats-salaire/
│       ├── releves-bancaires/
│       ├── attestations-3a/
│       └── autres/
├── 2025/
│   └── knowledge/                    # À remplir quand disponible
├── PLAN.md                           # Architecture détaillée
└── README.md
```

## Agents disponibles

| Agent | Description |
|-------|-------------|
| `tax-coordinator` | Coordinateur principal, orchestre l'analyse complète |
| `pdf-extractor` | Extrait les données des documents fiscaux |
| `revenus-expert` | Analyse tous types de revenus |
| `deductions-expert` | Optimise les déductions fiscales |
| `fortune-expert` | Gère la déclaration de patrimoine |
| `immobilier-expert` | Spécialiste fiscalité immobilière |
| `compliance-checker` | Vérifie la conformité légale |
| `optimizer` | Optimisation fiscale globale |

## Skills (Commandes)

| Commande | Description |
|----------|-------------|
| `/analyser-situation` | Analyse complète de votre situation fiscale |
| `/optimiser-deductions` | Identifie toutes les déductions possibles |
| `/extraire-documents` | Extrait les infos de vos documents fiscaux |
| `/verifier-conformite` | Vérifie la conformité de la déclaration |
| `/calculer-impots` | Calcule l'estimation ICC + IFD + fortune |
| `/generer-rapport` | Génère un rapport fiscal complet |
| `/questionnaire` | Questionnaire guidé pour collecter les infos |

## Utilisation

### 1. Préparer vos documents
Placez vos documents dans les dossiers appropriés:
- Certificats de salaire → `2024/user-data/certificats-salaire/`
- Attestations 3a → `2024/user-data/attestations-3a/`
- Relevés bancaires → `2024/user-data/releves-bancaires/`

### 2. Lancer l'analyse
```
/questionnaire
```
ou
```
/analyser-situation 2024
```

### 3. Optimiser
```
/optimiser-deductions
```

### 4. Vérifier et générer le rapport
```
/verifier-conformite
/generer-rapport
```

## Limites principales 2024

| Déduction | ICC Genève | IFD Fédéral |
|-----------|------------|-------------|
| 3ème pilier A | CHF 7,056 | CHF 7,056 |
| Frais repas | CHF 3,200 | CHF 3,200 |
| Déplacement | CHF 529 | CHF 3,200 |
| Formation | CHF 12,640 | CHF 12,000 |
| Frais garde | CHF 26,080 | CHF 25,500 |
| Syndicat | CHF 700 | - |

## Confidentialité

- Tous vos documents personnels restent dans `user-data/`
- Ce dossier est automatiquement ignoré par git (`.gitignore`)
- Aucune donnée n'est envoyée à l'extérieur

## Sources

- [Guide fiscal 2024 - ge.ch](https://www.ge.ch/document/guide-fiscal-2024-particuliers)
- [GeTax - Support](https://www.getax.ch/support/)
- [AFC - Administration Fédérale des Contributions](https://www.estv.admin.ch/)

## Avertissement

Ce plugin est un outil d'aide. Pour les situations complexes, consultez un professionnel qualifié. Les montants et règles peuvent évoluer - vérifiez toujours avec les sources officielles.
