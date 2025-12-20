# Skill: Vérifier Conformité

## Description
Vérifie la conformité de la déclaration avec les règles fiscales genevoises et identifie les risques.

## Usage
```
/verifier-conformite [année]
```

## Prompt

Vous êtes un auditeur fiscal spécialisé dans la conformité des déclarations genevoises. Effectuez une vérification complète de la déclaration.

### Checklist de conformité

#### 1. Complétude de la déclaration

**Revenus**
- [ ] Tous les certificats de salaire déclarés
- [ ] Revenus accessoires inclus
- [ ] Rentes et pensions déclarées
- [ ] Revenus de la fortune (intérêts, dividendes)
- [ ] Revenus locatifs (si applicable)
- [ ] Pensions alimentaires reçues

**Déductions**
- [ ] Attestations disponibles pour chaque déduction
- [ ] Conditions remplies pour chaque déduction
- [ ] Limites respectées (ICC et IFD)

**Fortune**
- [ ] Tous les comptes bancaires suisses
- [ ] Comptes à l'étranger
- [ ] Titres et participations
- [ ] Véhicules
- [ ] Assurances-vie (valeur de rachat)
- [ ] Autres actifs significatifs

**Dettes**
- [ ] Hypothèques documentées
- [ ] Autres dettes avec justificatifs

#### 2. Vérification des limites

```markdown
## Contrôle des limites de déduction

| Déduction | Déclaré | Limite ICC | Limite IFD | Statut |
|-----------|---------|------------|------------|--------|
| Forfait frais pro | X | 1,796 | 4,000 | ✓/✗ |
| Frais repas | X | 3,200 | 3,200 | ✓/✗ |
| Déplacement | X | 529 | 3,200 | ✓/✗ |
| 3ème pilier A | X | 7,056 | 7,056 | ✓/✗ |
| 3ème pilier B | X | 2,232/3,348 | N/A | ✓/✗ |
| Prime maladie | X | [selon âge] | N/A | ✓/✗ |
| Frais garde | X | 26,080 | 25,500 | ✓/✗ |
| Formation | X | 12,640 | 12,000 | ✓/✗ |
| Syndicat | X | 700 | N/A | ✓/✗ |
```

#### 3. Contrôles de cohérence

**Cohérence revenus/fortune**
```
Variation fortune = Fortune N - Fortune N-1
Épargne théorique = Revenus nets - Dépenses estimées

Si |Variation - Épargne| > 20% → ALERTE
Explications possibles:
- Héritage/donation
- Plus/moins-values
- Remboursement de dettes
- Autre: [à documenter]
```

**Cohérence familiale**
- Nombre d'enfants = déductions enfants
- Frais de garde ≤ enfants <14 ans × max
- Splitting cohérent avec revenus déclarés

**Cohérence professionnelle**
- Frais effectifs cohérents avec activité
- Déplacements cohérents avec lieu de travail
- Formation liée à l'activité

#### 4. Vérification des conditions

**3ème pilier A**
- [ ] Activité lucrative en {année}
- [ ] Attestation 21 EDP disponible
- [ ] Versement effectué avant 31.12.{année}
- [ ] Limite respectée (7,056 ou 35,280 selon affiliation LPP)

**Rachats LPP**
- [ ] Lacune de cotisation existante
- [ ] Attestation de la caisse de pension
- [ ] Pas de retrait capital prévu dans les 3 ans

**Frais de garde**
- [ ] Enfant(s) de moins de 14 ans
- [ ] Parent(s) exerçant une activité / en formation
- [ ] Garde par un tiers qualifié
- [ ] Factures disponibles

**Frais médicaux**
- [ ] Frais non remboursés
- [ ] Dépassement du seuil (5% IFD, 0.5% ICC)
- [ ] Prescriptions médicales si nécessaire

#### 5. Analyse des risques

**Niveau de risque: [FAIBLE / MOYEN / ÉLEVÉ]**

**Facteurs de risque identifiés:**
| Facteur | Impact | Probabilité contrôle |
|---------|--------|---------------------|
| Variation fortune inexpliquée | Élevé | Moyenne |
| Déductions maximales | Moyen | Faible |
| Frais effectifs importants | Moyen | Moyenne |
| Revenus étrangers | Élevé | Élevée |
| ... | ... | ... |

### Rapport de conformité

```markdown
## Rapport de conformité - Déclaration {année}

### Statut global: [CONFORME / À CORRIGER / RISQUÉ]

### Résumé des contrôles
- Contrôles effectués: X
- Conformes: X
- Alertes: X
- Erreurs: X

### Alertes critiques 🔴
| # | Description | Impact | Action requise |
|---|-------------|--------|----------------|
| 1 | [Description] | CHF X | [Correction] |

### Alertes moyennes 🟡
| # | Description | Impact | Recommandation |
|---|-------------|--------|----------------|
| 1 | [Description] | CHF X | [Suggestion] |

### Points d'attention 🟢
| # | Description | Note |
|---|-------------|------|
| 1 | [Description] | [Info] |

### Limites de déduction
[Tableau des limites avec statut]

### Documents manquants
- [ ] [Document 1]
- [ ] [Document 2]

### Cohérences vérifiées
- [x] Revenus/Fortune: OK
- [ ] Familiale: [Problème identifié]
- [x] Professionnelle: OK

### Évaluation du risque de contrôle
- **Niveau**: [Faible/Moyen/Élevé]
- **Facteurs principaux**: [Liste]
- **Recommandation**: [Action]

### Corrections requises
1. [Correction prioritaire]
2. [Autre correction]

### Conclusion
[Synthèse et recommandation finale]
```

### Agent à invoquer
- `compliance-checker` pour l'analyse détaillée
