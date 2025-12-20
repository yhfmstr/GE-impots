# Test Scenarios - Geneva Tax Declaration 2024

## Purpose
Validate the corrected knowledge base against sample tax situations.

---

## Scenario 1: Single Employee in Geneva

### Profile
- Status: Célibataire
- Residence: Versoix (code 6644)
- Employment: Full-time salaried in Geneva

### Income
- Gross salary: CHF 95,000
- Social contributions (AVS/AI/APG/AC/LPP): CHF 12,000
- Net salary: CHF 83,000

### Deductions to Verify

| Deduction | Amount | Limit Check | Result |
|-----------|--------|-------------|--------|
| **Professional fees (forfait)** | 3% of 83,000 = CHF 2,490 | ICC: 634-1,796 / IFD: 2,000-4,000 | ICC: 1,796 (capped) / IFD: 2,490 |
| **3a contribution** | CHF 7,056 | Max 7,056 if LPP affiliated | OK |
| **3b contribution** | CHF 2,324 | 2,324 célibataire | OK |
| **Health insurance** | CHF 4,500 | 16,207 max adult | OK |

### Expected ICC Deductions Total
- Forfait pro: CHF 1,796
- 3a: CHF 7,056
- 3b: CHF 2,324
- Assurance maladie: CHF 4,500
- **Total**: CHF 15,676

---

## Scenario 2: Married Couple with Children

### Profile
- Status: Mariés
- Residence: Carouge (code 6608)
- Children: 2 (ages 8 and 12)

### Income
- Spouse 1 salary: CHF 120,000 gross, CHF 105,000 net
- Spouse 2 salary: CHF 65,000 gross, CHF 57,000 net
- Total net: CHF 162,000

### Deductions to Verify

| Deduction | Amount | Limit Check | Result |
|-----------|--------|-------------|--------|
| **3a (both)** | 2 × CHF 7,056 = CHF 14,112 | Max per person | OK |
| **3b (couple)** | CHF 3,486 | Couple limit | OK |
| **3b per child** | 2 × CHF 951 = CHF 1,902 | 951 per charge | OK |
| **Children ICC** | 2 × CHF 13,536 = CHF 27,072 | Full charge | OK |
| **Children IFD** | 2 × CHF 6,700 = CHF 13,400 | Full charge | OK |
| **Double activity ICC** | CHF 1,041 | Fixed amount | OK |
| **Double activity IFD** | 50% of 57,000 = CHF 13,900 | Capped at 13,900 | OK |
| **Childcare** | CHF 18,000 | ICC: 26,080 / IFD: 25,500 per child | OK |

### Splitting
- Full splitting 50% applies (married)
- Splitting partiel 55.56% NOT applicable (parents married)

---

## Scenario 3: Property Owner

### Profile
- Status: Propriétaire
- Property: Apartment in Geneva, 10+ years ownership
- Fiscal value: CHF 800,000
- Mortgage: CHF 400,000 at 1.5%

### Real Estate Calculations

| Item | ICC | IFD |
|------|-----|-----|
| **Valeur locative base** | CHF 24,000 | CHF 24,000 |
| **Indexation 2024** | × 123.2% | - |
| **Valeur locative indexed** | CHF 29,568 | CHF 24,000 |
| **Forfait entretien** | 25% (>10 ans) = CHF 7,392 | 20% = CHF 4,800 |
| **Net before abattement** | CHF 22,176 | CHF 19,200 |
| **Abattement (10 yrs × 4%)** | 40% = CHF 8,870 | - |
| **Net après abattement** | CHF 13,306 | CHF 19,200 |
| **Mortgage interest** | CHF 6,000 | CHF 6,000 |
| **Final net** | CHF 7,306 | CHF 13,200 |

### IIC Calculation
- Net fiscal value: CHF 800,000 - CHF 400,000 = CHF 400,000
- IIC rate: 1‰ (flat)
- IIC due: CHF 400

---

## Scenario 4: Self-Employed

### Profile
- Status: Indépendant
- Business: Consultant IT
- No LPP affiliation

### Income & Deductions

| Item | Amount | Notes |
|------|--------|-------|
| **Net business profit** | CHF 150,000 | After expenses |
| **AVS/AI/APG** | ~CHF 15,000 | Declared at 32.10 |
| **3a without LPP** | Max 20% of (150,000 - 15,000) = CHF 27,000 | Max CHF 35,280 |

### Key Verification Points
- Social contributions at rubriques 32.xx (NOT in business expenses)
- 3a limit: 20% of determining income OR CHF 35,280
- RFFA deductions available (12.28, 12.29) for ICC

---

## Scenario 5: High Net Worth with Wealth Tax

### Profile
- Net wealth: CHF 2,500,000
- Net income: CHF 180,000

### Wealth Tax Brackets (ICC)

| Bracket | Amount in Bracket | Rate | Tax |
|---------|-------------------|------|-----|
| 0 - 108,900 | 108,900 | 1.75‰ | 190.58 |
| 108,900 - 217,800 | 108,900 | 2.25‰ | 245.03 |
| 217,800 - 326,700 | 108,900 | 2.75‰ | 299.48 |
| 326,700 - 653,500 | 326,800 | 3.25‰ | 1,062.10 |
| 653,500 - 1,307,000 | 653,500 | 3.75‰ | 2,450.63 |
| > 1,307,000 | 1,193,000 | 4.50‰ | 5,368.50 |
| **Total base** | | | **9,616.32** |

### Bouclier Fiscal Check
- Max total tax: 60% of CHF 180,000 = CHF 108,000
- Minimum: 1% of CHF 2,500,000 = CHF 25,000
- If income + wealth tax > 108,000 → reduction applies
- Always at least CHF 25,000

---

## Scenario 6: Gambling Income

### Lottery Win
- Amount: CHF 1,200,000
- Threshold ICC: CHF 1,000,000
- Threshold IFD: CHF 1,056,600

### Taxable Amount
- ICC: CHF 1,200,000 - 1,000,000 = CHF 200,000 taxable
- IFD: CHF 1,200,000 - 1,056,600 = CHF 143,400 taxable

### Forfait Deduction
- 5% of gain, max CHF 5,118 (ICC) / CHF 5,300 (IFD)
- ICC: 5% of 200,000 = CHF 5,118 (capped)
- IFD: 5% of 143,400 = CHF 5,300 (capped)

---

## Scenario 7: Foreign Income with RSI

### US Dividends
- Gross dividends: CHF 10,000
- RSI withheld: 15% = CHF 1,500
- Net received: CHF 8,500

### Declaration
- Declare gross CHF 10,000 as income
- RSI of CHF 1,500 creditable via R-US 164 form
- Column: "non soumis à l'impôt anticipé"

### IES (Imputation Foreign Tax)
- Minimum claim: CHF 100
- Forms: DA-1 (dividends/interest), DA-3 (royalties)

---

## Validation Checklist

### Knowledge Base Values Tested

| Value | File | Correct? |
|-------|------|----------|
| 3b célibataire CHF 2,324 | prevoyance.md, deductions-2024.md | YES |
| 3b couple CHF 3,486 | prevoyance.md, deductions-2024.md | YES |
| 3b par charge CHF 951 | prevoyance.md, deductions-2024.md | YES |
| Child IFD CHF 6,700/3,350 | deductions-2024.md | YES |
| Formation IFD CHF 12,900 | frais-professionnels.md | YES |
| Forfait ICC 15%/25% | immobilier.md | YES |
| IIC flat 1‰ | immobilier.md, baremes-2024.md | YES |
| Abattement 4%/yr max 40% | immobilier.md | YES |
| Allocations familiales IMPOSABLES | fortune.md | YES |
| Political ICC 10,000 / IFD 10,400 | deductions-2024.md | YES |
| Wealth brackets corrected | baremes-2024.md | YES |
| Energy report 2 years | immobilier.md | YES |
| Splitting partiel 55.56% | baremes-2024.md | YES |

---

## Summary

All corrected values verified against official 2024 Geneva tax guide.
Test scenarios cover:
- Employee deductions
- Family situations
- Real estate (valeur locative, forfait, abattement, IIC)
- Self-employment
- Wealth tax with bouclier fiscal
- Gambling income thresholds
- Foreign income (RSI, IES)
