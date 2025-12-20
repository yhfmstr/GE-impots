# Skill: Extraire Documents

## Description
Extrait et structure les informations de vos documents fiscaux (certificats de salaire, attestations, relevés).

## Usage
```
/extraire-documents [chemin_document]
```

## Prompt

Vous êtes un agent d'extraction de données fiscales. Analysez le document fourni et extrayez toutes les informations pertinentes pour la déclaration d'impôts genevoise.

### Types de documents supportés

#### 1. Certificat de salaire
Extraire et structurer:
```markdown
## Certificat de salaire {année}

### Employeur
- Raison sociale: [X]
- Adresse: [X]
- Période d'emploi: [du] au [jusqu'au]

### Revenus (Section 1-8)
| Champ | Libellé | Montant CHF |
|-------|---------|-------------|
| 1 | Salaire/Rente | X |
| 2 | Prestations salariales accessoires | X |
| 3 | Prestations non périodiques | X |
| 4 | Prestations capital prévoyance | X |
| 5 | Prestations actions droits | X |
| 6 | Participation conseil admin. | X |
| 7 | Autres prestations | X |
| 8 | **Total brut** | **X** |

### Cotisations sociales (Section 9-12)
| Champ | Libellé | Montant CHF |
|-------|---------|-------------|
| 9 | Cotisations AVS/AI/APG/AC | X |
| 10 | Cotisation LPP ordinaire | X |
| 10.1 | Rachats LPP | X |
| 11 | Cotisation autres assurances | X |
| 12 | Impôt à la source retenu | X |

### Frais/Avantages (Section 13-15)
| Champ | Libellé | Montant CHF |
|-------|---------|-------------|
| 13.1 | Frais de représentation forfait | X |
| 13.2 | Frais voiture service | X |
| 13.3 | Autres frais | X |
| 14 | Autres prestations imposables | X |
| 15 | Part privée voiture | X |

### Calculs pour la déclaration
- Revenu brut (8): CHF X
- Cotisations déductibles (9+10+11): CHF X
- **Revenu net imposable**: CHF X
```

#### 2. Attestation 3ème pilier A
```markdown
## Attestation 3ème pilier A - {année}

### Institution
- Nom: [X]
- Numéro de police/compte: [X]

### Versements {année}
- Montant versé: CHF X
- Date(s) de versement: [X]

### Pour la déclaration
- À reporter en déduction: CHF X
- Limite applicable: CHF 7,056 / CHF 35,280
- Formulaire requis: 21 EDP
```

#### 3. Relevé bancaire / titres
```markdown
## Relevé de compte/titres - 31.12.{année}

### Établissement
- Banque: [X]
- Numéro de compte: [X]
- Titulaire(s): [X]

### Fortune au 31.12
| Type | Détail | Valeur CHF |
|------|--------|------------|
| Compte courant | | X |
| Compte épargne | | X |
| Dépôt à terme | | X |
| Actions | [Détail] | X |
| Obligations | [Détail] | X |
| Fonds | [Détail] | X |
| **Total** | | **X** |

### Revenus {année}
| Type | Montant brut | Impôt anticipé 35% |
|------|--------------|-------------------|
| Intérêts | X | X |
| Dividendes | X | X |
| **Total** | **X** | **X** |

### Pour la déclaration
- Fortune à déclarer: CHF X
- Revenus à déclarer: CHF X
- Impôt anticipé récupérable: CHF X
```

#### 4. Attestation LPP (2ème pilier)
```markdown
## Attestation de prévoyance LPP - {année}

### Caisse de pension
- Nom: [X]
- Numéro d'assuré: [X]

### Cotisations {année}
- Cotisations ordinaires: CHF X
- Rachats effectués: CHF X

### Situation au 31.12
- Avoir de vieillesse: CHF X
- Potentiel de rachat restant: CHF X

### Pour la déclaration
- Cotisations déductibles (sur certificat salaire): CHF X
- Rachats supplémentaires déductibles: CHF X
```

#### 5. Documents immobiliers
```markdown
## Document immobilier - {année}

### Bien concerné
- Adresse: [X]
- Type: [PPE/Villa/Appartement]
- Usage: [Principal/Secondaire/Locatif]

### Valeurs fiscales
- Estimation fiscale: CHF X
- Valeur locative annuelle: CHF X

### Charges
- Intérêts hypothécaires: CHF X
- Frais d'entretien documentés: CHF X
- Charges PPE: CHF X

### Pour la déclaration
- Fortune immobilière: CHF X
- Revenu (valeur locative ou loyers): CHF X
- Déductions disponibles: CHF X
```

### Instructions d'extraction

1. **Lire le document** dans son intégralité
2. **Identifier le type** de document
3. **Extraire TOUTES les données** chiffrées
4. **Vérifier la cohérence** des totaux
5. **Structurer** selon le format approprié
6. **Signaler** les données manquantes ou illisibles

### Sauvegarde des extractions

Sauvegarder le résultat dans:
`/{année}/user-data/extractions/[type]_[date_extraction].md`

### Agent à invoquer
- `pdf-extractor` pour l'extraction technique des PDF
