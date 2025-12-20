# Skill: Calculer Impôts

## Description
Calcule l'estimation des impôts (ICC cantonal/communal + IFD fédéral + impôt sur la fortune) selon les barèmes genevois.

## Usage
```
/calculer-impots [année]
```

## Prompt

Vous êtes un calculateur fiscal expert pour le canton de Genève. Calculez les impôts selon les barèmes officiels {année}.

### Données nécessaires

Avant de calculer, vérifiez que vous disposez de:
- [ ] Revenu brut total
- [ ] Déductions totales
- [ ] Fortune brute
- [ ] Dettes
- [ ] Situation familiale
- [ ] Commune de résidence (pour centime additionnel)

### Formules de calcul

#### 1. Revenu imposable
```
Revenu imposable = Revenu brut - Déductions
                 = CHF [X] - CHF [Y]
                 = CHF [Z]
```

#### 2. Impôt cantonal et communal (ICC)

**Barème 2024 - Personnes seules**
| Revenu imposable | Taux marginal |
|------------------|---------------|
| 0 - 17,493 | 0% |
| 17,493 - 21,152 | 8% |
| 21,152 - 23,330 | 9% |
| 23,330 - 25,597 | 10% |
| 25,597 - 27,863 | 11% |
| 27,863 - 33,213 | 12% |
| 33,213 - 36,648 | 12.5% |
| 36,648 - 40,522 | 13% |
| 40,522 - 44,396 | 13.5% |
| 44,396 - 72,808 | 14% |
| 72,808 - 119,471 | 14.5% |
| 119,471 - 162,219 | 15% |
| 162,219 - 182,893 | 15.5% |
| 182,893 - 261,186 | 16% |
| 261,186 - 349,493 | 16.5% |
| 349,493 - 435,066 | 17% |
| 435,066 - 617,959 | 17.5% |
| > 617,959 | 19% |

**Barème couples mariés/pacsés**: Splitting (revenu ÷ 2 → barème → impôt × 2)

**Centimes additionnels communaux (exemples 2024)**
| Commune | Centime |
|---------|---------|
| Genève ville | 45.5 |
| Carouge | 51 |
| Lancy | 50 |
| Meyrin | 50 |
| Vernier | 51 |
| Onex | 51 |
| Thônex | 48 |
| Grand-Saconnex | 44 |
| Cologny | 36 |
| Collonge-Bellerive | 39 |
| Vandoeuvres | 34 |

```
ICC de base = [Calcul selon barème]
Centime communal = ICC base × [centime]%
**ICC total = ICC base + Centime communal**
```

#### 3. Impôt fédéral direct (IFD)

**Barème 2024 - Personnes seules**
| Revenu imposable | Taux |
|------------------|------|
| 0 - 14,500 | 0% |
| 14,500 - 31,600 | 0.77% |
| 31,600 - 41,400 | 0.88% + CHF 131.65 |
| 41,400 - 55,200 | 2.64% + CHF 217.90 |
| 55,200 - 72,500 | 2.97% + CHF 582.20 |
| 72,500 - 78,100 | 5.94% + CHF 1,095.95 |
| 78,100 - 103,600 | 6.60% + CHF 1,428.60 |
| 103,600 - 134,600 | 8.80% + CHF 3,111.60 |
| 134,600 - 176,000 | 11.00% + CHF 5,839.60 |
| 176,000 - 755,200 | 13.20% + CHF 10,393.60 |
| > 755,200 | 11.50% du total |

```
IFD = [Calcul selon barème]
```

#### 4. Impôt sur la fortune (ICC uniquement)

**Barème 2024**
| Fortune nette | Taux (‰) |
|---------------|----------|
| 0 - 87,864 (célibataire) | 0 (franchise) |
| 0 - 175,728 (couple) | 0 (franchise) |
| Au-dessus franchise | 1.75 à 4.5‰ |

```
Fortune nette = Fortune brute - Dettes - Franchise
Impôt fortune = Fortune nette × taux applicable
```

#### 5. Bouclier fiscal (GE)

```
Plafond = 60% × Revenu net
Minimum = 1% × Fortune nette (ou 0.5% pour ICC seul)

Si (ICC + IFD + Impôt fortune) > Plafond:
  Réduction applicable
```

### Rapport de calcul

```markdown
## Estimation fiscale - {année}

### Données de calcul
| Élément | Montant CHF |
|---------|-------------|
| Revenu brut | X |
| Total déductions | X |
| **Revenu imposable** | **X** |
| Fortune brute | X |
| Total dettes | X |
| Franchise | X |
| **Fortune imposable** | **X** |

### Situation
- État civil: [X]
- Commune: [X]
- Centime additionnel: [X]%

### Détail du calcul ICC

#### Impôt de base sur le revenu
[Détail du calcul par tranche]
= CHF X

#### Centime additionnel
CHF X × [centime]% = CHF X

#### Impôt sur la fortune
[Détail du calcul]
= CHF X

#### **Total ICC: CHF X**

### Détail du calcul IFD
[Détail du calcul par tranche]
= CHF X

#### **Total IFD: CHF X**

### Vérification bouclier fiscal
- Plafond (60% revenu): CHF X
- Impôts calculés: CHF X
- Bouclier applicable: [Oui/Non]
- Réduction: CHF X

### Récapitulatif

| Impôt | Montant CHF |
|-------|-------------|
| ICC revenu | X |
| ICC fortune | X |
| Centime communal | X |
| **Sous-total ICC** | **X** |
| IFD | X |
| **TOTAL ESTIMÉ** | **X** |

### Taux effectif d'imposition
- Sur le revenu: X%
- Sur la fortune: X‰

### Comparaison avec acomptes
- Acomptes versés: CHF X
- Impôt estimé: CHF X
- Différence: CHF X ([à payer/à recevoir])

### Avertissement
*Cette estimation est fournie à titre indicatif. Les montants définitifs
seront calculés par l'administration fiscale sur la base de la déclaration
complète.*
```

### Notes importantes

1. **Précision**: Utiliser les barèmes officiels de l'année concernée
2. **Arrondis**: Selon règles cantonales (généralement au franc inférieur)
3. **Splitting**: Obligatoire pour couples mariés/pacsés
4. **Commune**: Le centime additionnel varie significativement

### Ressources
- Barèmes officiels: `/{année}/knowledge/baremes-{année}.md`
- Simulateur officiel: ge.ch/calculette-impots
