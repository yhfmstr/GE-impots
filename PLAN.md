# Geneva Tax Declaration Plugin - Architecture Plan

## Overview
Advanced Claude Code plugin for filling and optimizing "déclaration d'impôts" for Geneva, Switzerland. Acts as an expert accountant with comprehensive knowledge of Geneva-specific tax rules.

## Plugin Structure

```
GE-impots/
├── .claude/
│   ├── settings.local.json
│   └── plugins/
│       └── ge-impots-expert/
│           ├── plugin.json              # Plugin configuration
│           ├── agents/
│           │   ├── tax-coordinator.md   # Main orchestrator agent
│           │   ├── pdf-extractor.md     # Document extraction agent
│           │   ├── revenus-expert.md    # Income analysis agent
│           │   ├── deductions-expert.md # Deductions optimization agent
│           │   ├── fortune-expert.md    # Assets/wealth agent
│           │   ├── immobilier-expert.md # Real estate agent
│           │   ├── compliance-checker.md # Validation agent
│           │   └── optimizer.md         # Tax optimization agent
│           └── skills/
│               ├── analyser-situation.md    # Analyze tax situation
│               ├── optimiser-deductions.md  # Optimize deductions
│               ├── extraire-documents.md    # Extract from documents
│               ├── verifier-conformite.md   # Check compliance
│               ├── calculer-impots.md       # Calculate taxes
│               └── generer-rapport.md       # Generate report
├── 2024/
│   ├── guidepp-2024-180225.pdf          # Official guide (source)
│   ├── knowledge/
│   │   ├── guide-structure.md           # Extracted guide structure
│   │   ├── deductions-2024.md           # All deductions with limits
│   │   ├── baremes-2024.md              # Tax rates/scales
│   │   ├── frais-professionnels.md      # Professional expenses
│   │   ├── prevoyance.md                # Pension/pillar info
│   │   ├── immobilier.md                # Real estate rules
│   │   ├── fortune.md                   # Wealth taxation
│   │   └── cas-speciaux.md              # Special cases
│   └── user-data/                       # User's documents (gitignored)
│       ├── certificats-salaire/
│       ├── releves-bancaires/
│       ├── attestations-3a/
│       └── autres/
└── 2025/
    └── knowledge/                       # (To be populated when available)
```

## Tax Categories to Cover

### 1. Revenus (Income)
- **Activité dépendante**: Salaires, bonus, gratifications
- **Activité indépendante**: Revenus d'indépendant
- **Prestations sociales**: Chômage, AI, APG
- **Rentes et pensions**: AVS, LPP, autres rentes
- **Revenus de la fortune**: Intérêts, dividendes, gains
- **Autres revenus**: Pensions alimentaires reçues, etc.

### 2. Déductions (Deductions)
- **Frais professionnels**:
  - Forfait 3% (CHF 634-1,796)
  - Frais de repas (CHF 15/jour, max CHF 3,200)
  - Frais de déplacement (max CHF 529 cantonal)
  - Autres frais professionnels effectifs
- **Prévoyance**:
  - 3ème pilier A (max CHF 7,056 ou CHF 35,280)
  - Rachats 2ème pilier
- **Assurances**:
  - Primes maladie (limites par âge)
  - Assurance-vie 3b
- **Frais médicaux**: >5% du revenu
- **Dons et contributions**: Partis, institutions
- **Frais de garde**: Max CHF 26,080 ICC
- **Formation continue**: Max CHF 12,640
- **Pensions alimentaires versées**
- **Déductions sociales**: Enfants, personnes à charge

### 3. Fortune (Wealth)
- Comptes bancaires et postaux
- Titres et participations
- Véhicules et biens mobiliers
- Assurances-vie (valeur de rachat)
- Prêts accordés
- Autres actifs

### 4. Immobilier (Real Estate)
- Propriétés en Suisse
- Propriétés à l'étranger
- Valeur locative
- Frais d'entretien (forfait ou effectifs)
- Intérêts hypothécaires
- Impôt immobilier complémentaire (IIC)

### 5. Situation familiale
- État civil
- Enfants à charge
- Autres personnes à charge
- Splitting/quotient familial

## Agents Architecture

### 1. Tax Coordinator Agent (Orchestrator)
**Purpose**: Main entry point, coordinates all other agents
**Responsibilities**:
- Analyze user's overall tax situation
- Route to specialized agents
- Consolidate recommendations
- Generate final reports

### 2. PDF Extractor Agent
**Purpose**: Extract and structure content from tax documents
**Responsibilities**:
- Read official guides (guidepp-2024.pdf)
- Extract user's salary certificates
- Process bank statements
- Structure data for other agents

### 3. Revenus Expert Agent
**Purpose**: Analyze and optimize income declaration
**Responsibilities**:
- Classify income types
- Identify taxable vs non-taxable
- Handle special cases (stock options, bonuses)
- Coordinate with fortune for dividends

### 4. Deductions Expert Agent
**Purpose**: Maximize legal deductions
**Responsibilities**:
- Identify all applicable deductions
- Calculate optimal amounts
- Verify eligibility conditions
- Compare forfait vs effectif
- Recommend additional contributions (3a, rachats LPP)

### 5. Fortune Expert Agent
**Purpose**: Wealth declaration optimization
**Responsibilities**:
- Inventory all assets
- Apply correct valuations
- Identify exempt assets
- Calculate wealth tax impact

### 6. Immobilier Expert Agent
**Purpose**: Real estate taxation
**Responsibilities**:
- Calculate valeur locative
- Optimize maintenance deductions
- Handle mortgage interest
- IIC calculations

### 7. Compliance Checker Agent
**Purpose**: Ensure legal compliance
**Responsibilities**:
- Verify all limits respected
- Check documentation requirements
- Flag potential audit risks
- Ensure consistency across sections

### 8. Optimizer Agent
**Purpose**: Global tax optimization
**Responsibilities**:
- Run optimization scenarios
- Compare ICC vs IFD impacts
- Suggest year-end actions
- Multi-year planning

## Key Geneva-Specific Rules (2024)

### Limites importantes
| Déduction | Limite ICC | Limite IFD |
|-----------|------------|------------|
| 3ème pilier A (avec LPP) | CHF 7,056 | CHF 7,056 |
| 3ème pilier A (sans LPP) | CHF 35,280 | CHF 35,280 |
| Frais de déplacement | CHF 529 | CHF 3,200 |
| Frais de repas | CHF 3,200 | CHF 3,200 |
| Forfait frais professionnels | 3% (634-1,796) | 3% (2,000-4,000) |
| Frais de garde | CHF 26,080 | CHF 25,500 |
| Formation continue | CHF 12,640 | CHF 12,000 |
| Cotisations syndicales | CHF 700 | - |
| Prime maladie adulte | CHF 16,207 | - |
| Prime maladie 18-26 | CHF 12,442 | - |
| Prime maladie enfant | CHF 3,811 | - |
| 3b (célibataire) | CHF 2,232 | - |
| 3b (couple) | CHF 3,348 | - |

### Barèmes d'imposition
- ICC: Progressif, 0% à ~30% selon revenu
- IFD: Progressif, 0% à 11.5%
- Impôt sur la fortune: 0.175% à 1% selon fortune

## Skills (User-Facing Commands)

### /analyser-situation
Analyze complete tax situation from provided documents

### /optimiser-deductions
Identify all possible deductions and optimization opportunities

### /extraire-documents
Extract information from user's tax documents (salary certificates, etc.)

### /verifier-conformite
Verify the declaration is compliant with Geneva tax rules

### /calculer-impots
Calculate estimated taxes (ICC + IFD + fortune)

### /generer-rapport
Generate comprehensive tax report with recommendations

## Implementation Phases

### Phase 1: Foundation
1. Create plugin structure
2. Build knowledge base for 2024
3. Implement PDF extraction agent
4. Create basic tax coordinator

### Phase 2: Specialized Agents
5. Implement all category experts
6. Build compliance checker
7. Create optimization engine

### Phase 3: User Experience
8. Implement all skills
9. Add interactive questionnaire
10. Create report generation

### Phase 4: Refinement
11. Test with real scenarios
12. Add edge cases
13. Optimize prompts
14. Document everything

## Data Sources
- Official: ge.ch/getax guides
- Rates: AFC (Administration Fédérale des Contributions)
- Limits: Annual cantonal publications
- Online: Research for optimization strategies

## Security & Privacy
- User data stays in local /user-data/ folder
- Folder is gitignored
- No data sent to external services
- All processing done locally via Claude
