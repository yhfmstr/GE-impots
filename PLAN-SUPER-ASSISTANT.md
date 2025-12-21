# Plan: GeTax Super Assistant

## Objective
Create a "super assistant" that guides users step-by-step through filling the **actual ge.ch/GeTax** declaration, telling them exactly what value to enter in which field.

---

## Current Assets

### Knowledge Base (2024/knowledge/)
| File | Content | Field Codes |
|------|---------|-------------|
| `guide-structure.md` | 10 sections of declaration | Structure only |
| `guide-officiel-2024.md` | All limits & tax brackets | Partial (52.31/52.32) |
| `deductions-2024.md` | All deduction limits ICC/IFD | Codes 31.xx, 52.xx |
| `frais-professionnels.md` | Professional fees details | 31.xx codes |
| `immobilier.md` | Real estate rules | To verify |
| `prevoyance.md` | Pension deductions | 52.xx codes |
| `taxation-codes.md` | Commune/canton/country codes | Geographic codes |
| `baremes-2024.md` | Tax brackets | N/A |

### Existing Plugin (ge-impots-expert/)
- 8 agents (tax-coordinator, deductions-expert, etc.)
- 7 skills (questionnaire, analyser-situation, etc.)
- Frontend with questionnaire (9 sections)

---

## Gap Analysis

### What's Missing

1. **Complete GeTax Field Mapping**
   - Need ALL rubrique codes (10.xx, 20.xx, 30.xx, 40.xx, 50.xx, 60.xx, 70.xx)
   - Field names as they appear in GeTax
   - Field order per GeTax page

2. **User Data Storage**
   - Currently: Frontend state (lost on refresh)
   - Needed: Persistent storage of user's tax data

3. **GeTax Page-by-Page Guide**
   - Currently: General questionnaire
   - Needed: Exact match to GeTax UI screens

4. **Pre-calculated Values**
   - Currently: Manual calculation needed
   - Needed: Auto-calculate all derived fields

---

## Architecture

### Phase 1: Field Mapping Database

Create `2024/knowledge/getax-fields.md`:

```markdown
# GeTax 2024 Field Reference

## Page 1: Situation Personnelle
| Rubrique | GeTax Field Name | Description | Source |
|----------|------------------|-------------|--------|
| 10.00 | État civil | Célibataire/Marié/etc | User input |
| 10.01 | Date naissance | DD.MM.YYYY | User input |
| 10.10 | Conjoint nom | Si marié | User input |
| 10.20 | Nb enfants | Nombre | User input |
...

## Page 2: Revenus Salariés
| Rubrique | GeTax Field Name | Description | Calculation |
|----------|------------------|-------------|-------------|
| 20.10 | Salaire brut | CHF | Certificate field 8 |
| 20.20 | Cotisations AVS/AI | CHF | Certificate field 9 |
| 20.30 | Cotisations LPP | CHF | Certificate field 10 |
...
```

### Phase 2: Super Assistant Agent

Create `agents/getax-guide.md`:

```markdown
# Agent: GeTax Step-by-Step Guide

## Role
Guide the user through EACH PAGE of GeTax, telling them:
1. Which page they're on
2. What each field means
3. EXACTLY what value to enter
4. Any calculations needed
5. Warnings about limits

## Instructions
- Ask user which GeTax page they're viewing
- For each field, provide: value, source, validation
- Highlight if value exceeds limits
- Explain ICC vs IFD differences
```

### Phase 3: Enhanced Frontend

Add new page `/guide`:

```
+------------------------------------------+
|  GeTax Assistant                         |
+------------------------------------------+
|  Current Page: [Dropdown: Select page]   |
+------------------------------------------+
|  Field-by-Field Guide:                   |
|  +------------------------------------+  |
|  | Rubrique 20.10: Salaire brut       |  |
|  | Enter: CHF 120,000                 |  |
|  | Source: Your salary certificate    |  |
|  +------------------------------------+  |
|  | Rubrique 20.20: AVS/AI             |  |
|  | Enter: CHF 6,300                   |  |
|  | Calculated: 5.3% of gross          |  |
|  +------------------------------------+  |
|  ...                                     |
+------------------------------------------+
|  [Ask Assistant] [Next Page]             |
+------------------------------------------+
```

---

## Implementation Plan

### Step 1: Complete Field Mapping (Priority: HIGH)
1. Extract ALL rubrique codes from PDF guide
2. Map to GeTax field names
3. Document calculations for derived fields
4. Create `getax-fields.md`

### Step 2: Data Persistence
1. Add localStorage/backend storage
2. Save user questionnaire responses
3. Load data on return visits

### Step 3: GeTax Guide Agent
1. Create `getax-guide.md` agent
2. Page-aware context
3. Field-by-field instructions
4. Limit warnings

### Step 4: Guide Frontend Page
1. New `/guide` route
2. GeTax page selector
3. Field list with values
4. Copy-to-clipboard feature

### Step 5: Browser Extension (Optional)
1. Chrome extension overlay
2. Detect GeTax page
3. Show values inline

---

## Key GeTax Pages to Map

| Page | Section | Key Fields |
|------|---------|------------|
| 1 | Situation personnelle | État civil, enfants, commune |
| 2 | Revenus activité dépendante | Salaire, cotisations |
| 3 | Revenus activité indépendante | Bénéfice, charges |
| 4 | Autres revenus | Rentes, dividendes |
| 5 | Déductions revenus | Frais pro, formation |
| 6 | Prévoyance | 3a, 3b, rachats LPP |
| 7 | Assurances & médical | Primes maladie, frais médicaux |
| 8 | Fortune mobilière | Comptes, titres, véhicules |
| 9 | Fortune immobilière | Biens, valeur locative |
| 10 | Dettes | Hypothèques, crédits |
| 11 | Déductions famille | Enfants, garde |
| 12 | Récapitulatif | Vérification |

---

## Data Flow

```
User fills questionnaire (our app)
        ↓
Data stored (localStorage + backend)
        ↓
User opens GeTax (ge.ch)
        ↓
User selects current GeTax page in our assistant
        ↓
Assistant shows exact values to enter
        ↓
User copies values to GeTax
        ↓
Repeat for each page
```

---

## Rubrique Code Reference (To Complete)

### Income (20.xx - 29.xx)
- 20.10: Salaire brut
- 20.20: Cotisations AVS/AI/APG
- 20.30: Cotisations AC
- 20.40: Cotisations LPP
- 20.50: Frais de repas
- 20.60: Frais de transport

### Deductions (30.xx - 39.xx)
- 31.10: Forfait frais professionnels
- 31.20: Frais effectifs repas
- 31.30: Frais effectifs transport
- 31.50: Formation continue
- 31.60: Cotisations syndicales
- 31.90/41.90: Déduction double activité (IFD)
- 31.95/41.95: Déduction double activité (ICC)

### Pension (50.xx - 59.xx)
- 52.21: Primes assurance maladie
- 52.31: 3ème pilier A (contribuable)
- 52.32: 3ème pilier A (conjoint)
- 52.40: Rachats LPP
- 52.50: 3ème pilier B

### Deductions autres (54.xx)
- 54.10: Rentes viagères versées
- 54.20: Pensions alimentaires versées

### Fortune (60.xx - 69.xx)
- 60.10: Comptes bancaires CH
- 60.20: Comptes bancaires étrangers
- 60.30: Titres cotés
- 60.40: Titres non cotés
- 60.50: Véhicules
- 60.60: Assurances-vie (rachat)

### Immobilier (70.xx - 79.xx)
- 70.10: Valeur locative
- 70.20: Frais d'entretien forfait
- 70.30: Frais d'entretien effectifs
- 70.40: Intérêts hypothécaires

### Family (80.xx)
- 80.10: Déduction enfants
- 80.20: Frais de garde
- 80.30: Déduction couple marié

---

## Next Steps

1. **Immediate**: Extract complete field mapping from PDF chapters
2. **Today**: Create `getax-fields.md` with all rubriques
3. **Tomorrow**: Build GeTax Guide agent
4. **This week**: Add guide page to frontend

---

## Questions to Resolve

1. Does GeTax use same rubrique codes for ICC and IFD?
2. Are field orders consistent across GeTax versions?
3. Should we support GeTax desktop app or web only?
4. Do we need Playwright to auto-fill GeTax? (complex, risky)
